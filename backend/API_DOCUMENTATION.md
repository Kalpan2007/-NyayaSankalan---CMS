# NyayaSankalan Backend API Documentation

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation
```bash
cd backend
npm install
```

### Environment Setup
Create a `.env` file in the backend directory:
```env
DATABASE_URL="postgresql://postgres:Kalpan@20@localhost:5432/NyayaSankalan?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRY="24h"
PORT=5000
NODE_ENV="development"
```

### Database Migration
```bash
npm run db:generate
npm run db:migrate
```

### Start Server
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

The server will start at `http://localhost:5000`

---

## 📋 API Endpoints (36 Total)

### Authentication (2 APIs)

#### 1. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "User Name",
      "role": "POLICE",
      "organizationType": "POLICE_STATION",
      "organizationId": "uuid"
    },
    "token": "jwt-token"
  }
}
```

#### 2. Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Organization Data (2 APIs)

#### 3. Get All Police Stations
```http
GET /api/police-stations
Authorization: Bearer <token>
```

#### 4. Get All Courts
```http
GET /api/courts
Authorization: Bearer <token>
```

### FIR & Cases (6 APIs)

#### 5. Create FIR (POLICE only)
```http
POST /api/firs
Authorization: Bearer <token>
Content-Type: application/json

{
  "complainantName": "John Doe",
  "complainantContact": "9876543210",
  "complainantAddress": "123 Street, City",
  "incidentDate": "2024-01-15T10:30:00Z",
  "incidentLocation": "Location description",
  "incidentDescription": "Detailed incident description",
  "sections": "IPC 302, 307",
  "category": "CRIMINAL"
}
```

#### 6. Get FIR by ID
```http
GET /api/firs/:firId
Authorization: Bearer <token>
```

#### 7. Get My Cases (POLICE/SHO)
```http
GET /api/cases/my
Authorization: Bearer <token>
```

#### 8. Get All Cases with Filters (SHO/COURT)
```http
GET /api/cases/all?state=UNDER_INVESTIGATION&category=CRIMINAL
Authorization: Bearer <token>
```

#### 9. Get Case by ID
```http
GET /api/cases/:caseId
Authorization: Bearer <token>
```

#### 10. Assign Case (SHO only)
```http
POST /api/cases/:caseId/assign
Authorization: Bearer <token>
Content-Type: application/json

{
  "officerId": "uuid"
}
```

### Investigation (10 APIs)

#### 11. Create Investigation Event (POLICE)
```http
POST /api/cases/:caseId/investigation-events
Authorization: Bearer <token>
Content-Type: application/json

{
  "eventType": "SCENE_VISIT",
  "eventDate": "2024-01-15T14:00:00Z",
  "location": "Crime scene address",
  "description": "Detailed description",
  "findings": "Key findings"
}
```

#### 12. Get Investigation Events (POLICE)
```http
GET /api/cases/:caseId/investigation-events
Authorization: Bearer <token>
```

#### 13. Create Evidence (POLICE)
```http
POST /api/cases/:caseId/evidence
Authorization: Bearer <token>
Content-Type: application/json

{
  "evidenceType": "PHYSICAL",
  "description": "Evidence description",
  "location": "Where found",
  "collectedDate": "2024-01-15T15:00:00Z",
  "collectedBy": "Officer name",
  "storageLocation": "Evidence locker #123",
  "chainOfCustody": "Initial custody details"
}
```

#### 14. Get Evidence (POLICE)
```http
GET /api/cases/:caseId/evidence
Authorization: Bearer <token>
```

#### 15. Create Witness (POLICE)
```http
POST /api/cases/:caseId/witnesses
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Witness Name",
  "contactInfo": "9876543210",
  "address": "Witness address",
  "witnessType": "EYE_WITNESS",
  "statementSummary": "Statement details"
}
```

#### 16. Get Witnesses (POLICE)
```http
GET /api/cases/:caseId/witnesses
Authorization: Bearer <token>
```

#### 17. Create Accused (POLICE)
```http
POST /api/cases/:caseId/accused
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Accused Name",
  "age": 30,
  "gender": "Male",
  "address": "Address",
  "contactInfo": "9876543210",
  "arrestDate": "2024-01-16T10:00:00Z",
  "arrestLocation": "Arrest location",
  "chargesApplied": "IPC 302, 307"
}
```

#### 18. Get Accused (POLICE)
```http
GET /api/cases/:caseId/accused
Authorization: Bearer <token>
```

#### 19. Get Case Timeline
```http
GET /api/cases/:caseId/timeline
Authorization: Bearer <token>
```

#### 20. Get Audit Logs (SHO/COURT)
```http
GET /api/cases/:caseId/audit-logs
Authorization: Bearer <token>
```

### Documents (4 APIs)

#### 21. Create Document (POLICE)
```http
POST /api/cases/:caseId/documents
Authorization: Bearer <token>
Content-Type: application/json

{
  "documentType": "CHARGESHEET",
  "title": "Final Chargesheet",
  "description": "Complete investigation report",
  "filePath": "/documents/chargesheet.pdf",
  "metadata": {}
}
```

#### 22. Get Documents
```http
GET /api/cases/:caseId/documents
Authorization: Bearer <token>
```

#### 23. Finalize Document (POLICE)
```http
POST /api/documents/:documentId/finalize
Authorization: Bearer <token>
```

**Note:** Documents are locked after case submission to court

---

### Judicial Document Requests (NEW)

This feature enables Police to request urgent judicial documents during the investigation phase. The flow is Police -> SHO -> Court Clerk/Judge -> Police. This workflow is independent of case submission to court.

#### 31. Create Document Request (POLICE)
```http
POST /api/document-requests
Authorization: Bearer <token>
Content-Type: application/json

{
  "caseId": "uuid",
  "documentType": "ARREST_WARRANT",
  "requestReason": "Reason for request"
}
```

#### 32. Get My Requests (POLICE)
```http
GET /api/document-requests/my
Authorization: Bearer <token>
```

#### 33. Get Pending Requests (SHO)
```http
GET /api/document-requests/pending
Authorization: Bearer <token>
```

#### 34. Approve Request (SHO)
```http
POST /api/document-requests/:id/approve
```

---

### Case Reopen Requests (NEW)

POST /api/cases/:caseId/reopen-request
- Role: POLICE
- Body: { policeReason: string }
- Creates a new request to re-open an archived case. Police must be assigned to the case. Only one active request per case is allowed.
- Response: { success: true, data: CaseReopenRequest }

GET /api/case-reopen/my-requests
- Role: POLICE
- Returns the list of re-open requests submitted by the authenticated user.
- Response: { success: true, data: CaseReopenRequest[] }

GET /api/case-reopen/pending
- Role: JUDGE
- Returns pending requests for cases associated with the judge's court (latest submission court match).
- Response: { success: true, data: CaseReopenRequest[] }

POST /api/case-reopen/:id/approve
- Role: JUDGE
- Body: { judgeNote: string }
- Approves the request: unarchives the case, sets case state to UNDER_INVESTIGATION, auto-assigns to the last assigned officer, writes timeline and audit logs.
- Response: { success: true, data: CaseReopenRequest }

POST /api/case-reopen/:id/reject
- Role: JUDGE
- Body: { reason: string }
- Rejects the request and records judicial note.
- Response: { success: true, data: CaseReopenRequest }

Authorization: Bearer <token>
```

#### 35. Reject Request (SHO or Court)
```http
POST /api/document-requests/:id/reject
Authorization: Bearer <token>
Content-Type: application/json

{ "reason": "Rejection reason" }
```

#### 36. Get Approved Requests (Court)
```http
GET /api/document-requests/approved
Authorization: Bearer <token>
```

#### 37. Issue Document (Court Clerk / Judge)
```http
POST /api/document-requests/:id/issue
Authorization: Bearer <token>
Content-Type: multipart/form-data

- file: PDF (signed document)
- remarks: optional
```

Notes:
- Document types: ARREST_WARRANT, SEARCH_WARRANT, REMAND_ORDER, CHARGE_SHEET_COPY, OTHER
- Status flow: REQUESTED → SHO_APPROVED → ISSUED (optional REJECTED)
- All actions are logged in audit_logs
- Police can create requests only if case is assigned to them
- SHO can approve only for cases in their police station
- Court can issue only after SHO approval

### Court Operations (6 APIs)

#### 24. Submit Case to Court (SHO only)
```http
POST /api/cases/:caseId/submit-to-court
Authorization: Bearer <token>
Content-Type: application/json

{
  "courtId": "uuid",
  "submissionNotes": "Case ready for trial"
}
```

#### 25. Intake Case (COURT_CLERK only)
```http
POST /api/cases/:caseId/intake
Authorization: Bearer <token>
Content-Type: application/json

{
  "acknowledgementNotes": "Case received and acknowledged"
}
```

#### 26. Create Court Action (JUDGE only)
```http
POST /api/cases/:caseId/court-actions
Authorization: Bearer <token>
Content-Type: application/json

{
  "actionType": "HEARING_SCHEDULED",
  "actionDate": "2024-02-01T10:00:00Z",
  "description": "First hearing scheduled",
  "orderDetails": "Details of the order",
  "nextHearingDate": "2024-02-15T10:00:00Z"
}
```

#### 27. Get Court Actions (Court users)
```http
GET /api/cases/:caseId/court-actions
Authorization: Bearer <token>
```

### Bail Applications (2 APIs)

#### 28. Create Bail Application
```http
POST /api/cases/:caseId/bail-applications
Authorization: Bearer <token>
Content-Type: application/json

{
  "applicantName": "Accused Name",
  "applicantRelation": "Self",
  "grounds": "Grounds for bail",
  "suretyDetails": "Surety information",
  "amountProposed": 50000
}
```

#### 29. Get Bail Applications
```http
GET /api/cases/:caseId/bail-applications
Authorization: Bearer <token>
```

### Case Management (1 API)

#### 30. Archive Case (SHO/JUDGE only)
```http
POST /api/cases/:caseId/archive
Authorization: Bearer <token>
```

---

## 🔐 Role-Based Access Control

| Role | Access |
|------|--------|
| **POLICE** | Create FIR, manage investigation, create documents, view own cases |
| **SHO** | All POLICE permissions + assign cases, submit to court, view all station cases |
| **COURT_CLERK** | Intake cases, view court cases, manage court documents |
| **JUDGE** | All COURT_CLERK permissions + create court actions, judgments |

---

## 📊 Case State Machine

```
FIR_REGISTERED 
  → UNDER_INVESTIGATION 
  → INVESTIGATION_COMPLETE 
  → SUBMITTED_TO_COURT 
  → PENDING_COURT_INTAKE 
  → UNDER_TRIAL 
  → JUDGMENT_DELIVERED 
  → CLOSED 
  → ARCHIVED
```

---

## 🛡️ Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Automatic access logging
- Audit trail for sensitive operations
- Document locking after court submission
- Input validation with express-validator
- Helmet.js security headers
- CORS protection

---

## 📝 Error Handling

All errors follow a consistent format:
```json
{
  "success": false,
  "error": {
    "statusCode": 400,
    "message": "Error message"
  }
}
```

Common status codes:
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

---

## 🔍 Health Check

```http
GET /health
```

**Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 📦 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration (env.ts)
│   ├── middleware/      # Auth, role, error, validation
│   ├── modules/         # Feature modules
│   │   ├── auth/
│   │   ├── organization/
│   │   ├── fir/
│   │   ├── case/
│   │   ├── investigation/
│   │   ├── document/
│   │   ├── court/
│   │   ├── bail/
│   │   ├── audit/
│   │   └── timeline/
│   ├── prisma/          # Prisma client
│   ├── utils/           # Utilities (ApiError, asyncHandler)
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── prisma/
│   └── schema.prisma    # Database schema
├── package.json
├── tsconfig.json
└── .env
```

---

## 🧪 Testing

```bash
# Test server
npm run dev

# Access health endpoint
curl http://localhost:5000/health

# Test login (requires seed data)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

---

## 🔧 Database Commands

```bash
# Generate Prisma Client
npm run db:generate

# Create migration
npm run db:migrate

# Push schema without migration
npm run db:push

# Open Prisma Studio
npm run db:studio
```

---

## 📚 Additional Resources

- **Prisma Documentation:** https://www.prisma.io/docs
- **Express Documentation:** https://expressjs.com
- **JWT Documentation:** https://jwt.io

---

## ⚙️ Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `JWT_SECRET` | Secret key for JWT signing | `your-secret-key` |
| `JWT_EXPIRY` | JWT token expiry time | `24h` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` or `production` |
| `CORS_ORIGIN` | Allowed CORS origins | `*` or `http://localhost:3000` |

---

## 🚨 Important Notes

1. **Schema is read-only** - Do not modify database schema
2. **Audit logging is mandatory** - All sensitive operations are logged
3. **Documents are locked** - After court submission, no document modifications allowed
4. **Case state machine** - State transitions follow strict rules
5. **Access control** - Each endpoint has role-based restrictions

---

## 👥 User Roles & Permissions

### POLICE
- ✅ Create FIR
- ✅ Manage investigation (events, evidence, witnesses, accused)
- ✅ Create & finalize documents
- ✅ View own cases
- ✅ Submit bail applications

### SHO
- ✅ All POLICE permissions
- ✅ Assign cases to officers
- ✅ Submit cases to court
- ✅ View all station cases
- ✅ Archive closed cases

### COURT_CLERK
- ✅ Intake cases from police
- ✅ View court cases
- ✅ Manage court documents

### JUDGE
- ✅ All COURT_CLERK permissions
- ✅ Create court actions
- ✅ Schedule hearings
- ✅ Deliver judgments
- ✅ Grant/reject bail
- ✅ Archive cases

---

## 📈 API Success Response Format

All successful responses follow this format:
```json
{
  "success": true,
  "data": { /* response data */ }
}
```

---

## 🎯 Next Steps

1. Create seed data for testing
2. Implement file upload for documents
3. Add notification system
4. Implement search functionality
5. Add pagination for list endpoints
6. Create comprehensive test suite
7. Add API rate limiting
8. Implement logging with Winston
9. Add API documentation with Swagger
10. Deploy to production

---

**Built with ❤️ for NyayaSankalan - Police-Court Case Management System**
