# LearnioX Server Service (`server-service`)

The **Server Service** is the central core microservice for the **LearnioX** platform. Built with Python 3.11, FastAPI, SQLAlchemy 2.0 (Async), Pydantic v2, and Alembic, it encapsulates primary business domain logic including Authentication, Multi-Tenant Institution Management, Course Authoring, Curriculum Modules, Lessons, Enrollments, Payments, and Storage.

---

## 🏗 Architecture & Stack

- **Framework**: Python 3.11 + FastAPI (Async ASGI)
- **Production Server**: Gunicorn + Uvicorn Workers (`uvicorn.workers.UvicornWorker`)
- **Database**: PostgreSQL 16 via `asyncpg` & SQLAlchemy 2.0 Async Session
- **Migrations**: Alembic
- **Caching & Locks**: Redis 7.4 via `redis.asyncio`
- **Config Management**: `pydantic-settings` reading central `.env` at repo root

---

## 📡 API Versioning & Endpoints Summary

All routes are versioned under `/api/v1`:

| Route Prefix | Category | Key Responsibilities |
| :--- | :--- | :--- |
| `/api/v1/auth` | Authentication | Google OAuth 2.0, Dev bypass, JWT access/refresh token rotation, `/auth/me` profile lookup |
| `/api/v1/institutions` | Institutions | Multi-tenant organization CRUD, auto-slug generation, branding (logo, banner), team memberships |
| `/api/v1/courses` | Courses | Course catalog listing, search, level filtering, instructor course authoring, pricing, enrollment |
| `/api/v1/curriculum` | Curriculum | Modules, lessons, ordering, completion tracking |
| `/api/v1/enrollments` | Enrollments | User course enrollments, active learning progress, certificates |
| `/api/v1/payments` | Payments & Purchases | Course purchases, coupon code validation, transaction history |
| `/api/v1/storage` | Storage | File upload handling, previews, logo/banner file persistence |

---

## 🔒 Response Structure & Error Contract

All endpoints wrap responses in the standardized JSON envelope:

```json
{
  "success": true,
  "message": "Human readable status message",
  "data": { ... },
  "error": null
}
```

Error responses:
```json
{
  "success": false,
  "message": "Readable error description",
  "data": null,
  "error": {
    "code": "ERROR_CODE_STRING",
    "details": [...]
  }
}
```

---

## 🚀 Running Locally with Docker

```bash
# Build and run server-service image locally
docker build -t learniox-server-service .
docker run -p 8000:8000 --env-file ../../.env learniox-server-service
```
