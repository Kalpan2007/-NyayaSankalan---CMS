from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uuid
import os
import sys
import json
from datetime import datetime

# Ensure project root (ai-poc) is on sys.path so utils imports work when running via uvicorn
BASE_DIR = os.path.dirname(__file__)
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from utils.ocr import image_to_text
from utils.ner import extract_entities

app = FastAPI(title="ai-poc")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ROOT_DIR = os.path.dirname(__file__)
STORAGE_DIR = os.path.join(ROOT_DIR, "storage")
EXTRACTS_DIR = os.path.join(STORAGE_DIR, "extracts")
OUTPUT_ROOT = os.path.join(STORAGE_DIR, "output")
EXTRACTIONS_JSON_DIR = os.path.join(OUTPUT_ROOT, "ai_extractions")
AI_DOCUMENTS_DIR = os.path.join(OUTPUT_ROOT, "ai_documents")

os.makedirs(EXTRACTS_DIR, exist_ok=True)
os.makedirs(EXTRACTIONS_JSON_DIR, exist_ok=True)
os.makedirs(AI_DOCUMENTS_DIR, exist_ok=True)


@app.post("/ocr-extract")
async def ocr_extract(file: UploadFile = File(...), caseId: str = Form(None)):
    """Accepts a file, saves it, runs OCR + NER, redacts PII, and saves JSON output."""
    try:
        content = await file.read()
        file_id = str(uuid.uuid4())
        filename = f"{file_id}-{file.filename}"
        out_path = os.path.join(EXTRACTS_DIR, filename)

        with open(out_path, "wb") as f:
            f.write(content)

        # OCR
        text = image_to_text(content)

        # NER + redaction
        ner_result = extract_entities(text)

        extraction = {
            "id": file_id,
            "caseId": caseId,
            "sourceFile": filename,
            "extractedText": text,
            "redactedText": ner_result.get("redactedText", ""),
            "entities": ner_result.get("entities", {}),
            "confidence": ner_result.get("confidence", 0.0),
            "createdAt": datetime.utcnow().isoformat() + "Z",
        }

        out_json_path = os.path.join(EXTRACTIONS_JSON_DIR, f"{file_id}.json")
        with open(out_json_path, "w", encoding="utf-8") as jf:
            json.dump(extraction, jf, ensure_ascii=False, indent=2)

        return JSONResponse({"success": True, "data": {"extractionId": file_id, "entities": extraction["entities"]}})
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


@app.get("/extractions/{extraction_id}")
async def get_extraction(extraction_id: str):
    path = os.path.join(EXTRACTIONS_JSON_DIR, f"{extraction_id}.json")
    if not os.path.exists(path):
        return JSONResponse({"success": False, "error": "Extraction not found"}, status_code=404)
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return JSONResponse({"success": True, "data": data})


@app.post('/generate-draft')
async def generate_draft(text: str = Form(None), extractionId: str = Form(None), model: str = Form(None)):
    """Generate a draft given raw text or an existing extractionId. Saves draft JSON to output."""
    try:
        source_text = text
        case_id = None
        source_extraction_id = None
        if extractionId:
            path = os.path.join(EXTRACTIONS_JSON_DIR, f"{extractionId}.json")
            if not os.path.exists(path):
                return JSONResponse({"success": False, "error": "Extraction not found"}, status_code=404)
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            source_text = data.get('redactedText') or data.get('extractedText')
            case_id = data.get('caseId')
            source_extraction_id = extractionId

        if not source_text:
            return JSONResponse({"success": False, "error": "No input text or extraction provided"}, status_code=400)

        from utils.generator import generate_draft_from_text

        result = generate_draft_from_text(source_text, model)
        doc_id = str(uuid.uuid4())
        doc = {
            'id': doc_id,
            'caseId': case_id,
            'extractionId': source_extraction_id,
            'documentType': 'CHARGE_SHEET',
            'draftText': result.get('draft'),
            'status': 'DRAFT',
            'modelInfo': result.get('modelInfo'),
            'prompt': result.get('prompt'),
            'createdAt': datetime.utcnow().isoformat() + 'Z'
        }

        out_path = os.path.join(AI_DOCUMENTS_DIR, f"{doc_id}.json")
        with open(out_path, 'w', encoding='utf-8') as jf:
            json.dump(doc, jf, ensure_ascii=False, indent=2)

        return JSONResponse({"success": True, "data": {"documentId": doc_id, "draft": doc['draftText']}})
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


@app.get('/drafts/{doc_id}')
async def get_draft(doc_id: str):
    path = os.path.join(AI_DOCUMENTS_DIR, f"{doc_id}.json")
    if not os.path.exists(path):
        return JSONResponse({"success": False, "error": "Draft not found"}, status_code=404)
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return JSONResponse({"success": True, "data": data})


@app.post('/index')
async def rebuild_index():
    """Rebuild FAISS index from extraction JSONs in output dir."""
    try:
        # lazy import to avoid startup cost
        from utils.faiss_index import build_index
        n = build_index(EXTRACTIONS_JSON_DIR)
        return JSONResponse({"success": True, "indexed": n})
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


@app.post('/index/doc/{extraction_id}')
async def index_single_document(extraction_id: str):
    """Index a single extraction document by id. For now, this triggers a full rebuild but is exposed for future incremental upserts."""
    try:
        # verify file exists
        path = os.path.join(EXTRACTIONS_JSON_DIR, f"{extraction_id}.json")
        if not os.path.exists(path):
            return JSONResponse({"success": False, "error": "Extraction not found"}, status_code=404)
        # For now reuse bulk builder (simple and reliable)
        from utils.faiss_index import build_index
        n = build_index(EXTRACTIONS_JSON_DIR)
        return JSONResponse({"success": True, "indexed": n, "indexedId": extraction_id})
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


@app.get('/health')
async def health():
    """Health check endpoint for service availability monitoring"""
    return JSONResponse({"status": "healthy", "service": "ai-poc"})


@app.get('/search')
async def search(q: str = None, k: int = 5):
    """Search extractions for query text. Use GET /search?q=...&k=5"""
    if not q:
        return JSONResponse({"success": False, "error": "Query parameter 'q' is required"}, status_code=400)
    try:
        from utils.faiss_index import search_index, index_exists
        if not index_exists():
            return JSONResponse({"success": False, "error": "Index not found. POST /index to build it."}, status_code=404)
        res = search_index(q, k)
        return JSONResponse({"success": True, "data": res})
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


@app.post('/chat')
async def chat(q: str = Form(...), k: int = Form(3), model: str = Form(None)):
    """RAG Chat: Search index and answer question."""
    try:
        if not q.strip():
             return JSONResponse({"success": False, "error": "Query required"}, status_code=400)

        # 0. Quick Greeting Check
        user_query = q.lower().strip()
        greetings = ["hi", "hello", "hey", "namaste", "hola"]
        if user_query in greetings:
            return JSONResponse({
                "success": True, 
                "answer": "Hello! I am your Legal Co-Pilot. I can answer questions based on the uploaded case documents. Try asking about a specific FIR or Evidence.", 
                "sources": []
            })

        # 1. Retrieve
        from utils.faiss_index import search_index, index_exists
        if not index_exists():
            return JSONResponse({"success": True, "answer": "The Knowledge Base is empty. Please upload/index some documents first.", "sources": []})
        
        results = search_index(q, k)
        
        # 2. Augment
        context_parts = []
        sources = []
        for res in results:
            text = res.get('text', '')
            meta = res.get('metadata', {})
            src = meta.get('sourceFile', 'unknown')
            score = res.get('score', 0)
            context_parts.append(f"Source ({src}): {text}")
            sources.append({"source": src, "score": score, "id": meta.get('id')})
        
        full_context = "\n\n".join(context_parts)
        
        # 3. Generate
        from utils.generator import generate_answer_from_context
        gen_res = generate_answer_from_context(full_context, q, model)
        
        return JSONResponse({
            "success": True, 
            "answer": gen_res.get('answer'), 
            "sources": sources,
            "debug": {"model": gen_res.get('modelInfo')}
        })

    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)
