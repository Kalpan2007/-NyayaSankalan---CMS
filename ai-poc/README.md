# AI PoC (OCR & Extraction PoC)

This microservice is a PoC for OCR, entity extraction (NER) and redaction.

Quick start (dev):

1. Create & activate venv

Windows:
```powershell
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm  # optional, for better NER
python sanity_check.py
uvicorn main:app --host 0.0.0.0 --port 8001
```

Endpoints:
- POST /ocr-extract (multipart/form-data file; optional form field `caseId`) → runs OCR + NER, saves JSON to `storage/output/{id}.json` and returns `extractionId`.
- GET /extractions/{extractionId} → returns JSON extraction result.

Notes:
- Requires Tesseract OCR binary installed on the system for best OCR.
- For the PoC we use local JSON storage under `storage/output/` and saved files under `storage/extracts/`.

