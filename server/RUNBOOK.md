# LearnioX — Development Runbook

## Quick Start

### Prerequisites
- Python 3.12+
- PostgreSQL 15+
- Redis 7+
- [uv](https://github.com/astral-sh/uv) package manager

### 1. Install dependencies for all services
```bash
# From repo root
cd server
uv sync --all-packages
```

### 2. Start infrastructure
```bash
# PostgreSQL + Redis via Docker
docker-compose up -d postgres redis
```

---

## Running Services

Each service runs on its own port. Start with the core services first:

| Service | Port | Start Command |
|---|---|---|
| `auth_service` | 8000 | `cd services/auth_service && uv run uvicorn app.main:app --port 8000 --reload` |
| `user_service` | 8001 | `cd services/user_service && uv run uvicorn app.main:app --port 8001 --reload` |
| `rbac_service` | 8002 | `cd services/rbac_service && uv run uvicorn app.main:app --port 8002 --reload` |
| `institution_service` | 8003 | `cd services/institution_service && uv run uvicorn app.main:app --port 8003 --reload` |
| `course_service` | 8004 | `cd services/course_service && uv run uvicorn app.main:app --port 8004 --reload` |
| `lesson_service` | 8005 | `cd services/lesson_service && uv run uvicorn app.main:app --port 8005 --reload` |
| `enrollment_service` | 8006 | `cd services/enrollment_service && uv run uvicorn app.main:app --port 8006 --reload` |
| `progress_service` | 8007 | `cd services/progress_service && uv run uvicorn app.main:app --port 8007 --reload` |
| `search_service` | 8008 | `cd services/search_service && uv run uvicorn app.main:app --port 8008 --reload` |
| `analytics_service` | 8009 | `cd services/analytics_service && uv run uvicorn app.main:app --port 8009 --reload` |
| `notification_service` | 8010 | `cd services/notification_service && uv run uvicorn app.main:app --port 8010 --reload` |
| `review_service` | 8011 | `cd services/review_service && uv run uvicorn app.main:app --port 8011 --reload` |
| `ai_service` | 8012 | `cd services/ai_service && uv run uvicorn app.main:app --port 8012 --reload` |
| `quiz_service` | 8013 | `cd services/quiz_service && uv run uvicorn app.main:app --port 8013 --reload` |
| `assignment_service` | 8014 | `cd services/assignment_service && uv run uvicorn app.main:app --port 8014 --reload` |
| `certificate_service` | 8015 | `cd services/certificate_service && uv run uvicorn app.main:app --port 8015 --reload` |
| `doubt_service` | 8016 | `cd services/doubt_service && uv run uvicorn app.main:app --port 8016 --reload` |
| `community_service` | 8017 | `cd services/community_service && uv run uvicorn app.main:app --port 8017 --reload` |
| `landing_page_service` | 8018 | `cd services/landing_page_service && uv run uvicorn app.main:app --port 8018 --reload` |
| `marketing_service` | 8019 | `cd services/marketing_service && uv run uvicorn app.main:app --port 8019 --reload` |
| `admin_service` | 8020 | `cd services/admin_service && uv run uvicorn app.main:app --port 8020 --reload` |
| `audit_service` | 8021 | `cd services/audit_service && uv run uvicorn app.main:app --port 8021 --reload` |
| `payment_service` | 8097 | `cd services/payment_service && uv run uvicorn app.main:app --port 8097 --reload` |
| `membership_service` | 8098 | `cd services/membership_service && uv run uvicorn app.main:app --port 8098 --reload` |
| `media_service` | 8099 | `cd services/media_service && uv run uvicorn app.main:app --port 8099 --reload` |
| `api_gateway` | 8100 | `cd services/api_gateway && uv run uvicorn app.main:app --port 8100 --reload` |

---

## AI Service Worker

The AI service requires a **Celery worker** in addition to the FastAPI server:

```bash
# Terminal 1: FastAPI API server
cd services/ai_service
uv run uvicorn app.main:app --port 8012 --reload

# Terminal 2: Celery worker (processes AI jobs)
cd services/ai_service
uv run celery -A app.workers.celery_app worker --loglevel=info -Q ai_jobs -c 2
```

**Required env vars:**
- `OPENROUTER_API_KEY` — get from https://openrouter.ai
- `CELERY_BROKER_URL` — Redis URL (default: `redis://localhost:6379/8`)
- `CELERY_RESULT_BACKEND` — Redis URL (default: `redis://localhost:6379/9`)

---

## Alembic Migrations

### Auth Service (template — replicate for each service)
```bash
cd services/auth_service

# Generate initial migration
uv run alembic revision --autogenerate -m "initial schema"

# Apply migrations
uv run alembic upgrade head

# Rollback
uv run alembic downgrade -1
```

---

## Running Tests

```bash
# Auth service tests
cd services/auth_service
uv run pytest tests/ -v

# All services (from server root)
uv run pytest services/*/tests/ -v
```

**Test dependencies per service:**
```
pytest>=8.0.0
pytest-asyncio>=0.23.0
pytest-mock>=3.14.0
httpx>=0.27.0
```

---

## Environment Variables — Key Secrets to Set

| Variable | Service | Description |
|---|---|---|
| `JWT_SECRET_KEY` | `auth_service`, `api_gateway` | **Must match exactly** — signs all JWTs |
| `RAZORPAY_KEY_ID` | `payment_service` | Razorpay test/live key |
| `RAZORPAY_KEY_SECRET` | `payment_service` | Razorpay secret |
| `RAZORPAY_WEBHOOK_SECRET` | `payment_service` | Webhook HMAC secret |
| `OPENROUTER_API_KEY` | `ai_service` | LLM API key |
| `CLOUDFLARE_ACCOUNT_ID` | `media_service` | CF account for Stream |
| `CLOUDFLARE_STREAM_API_TOKEN` | `media_service` | CF Stream API token |
| `R2_ACCESS_KEY_ID` | `media_service` | R2 storage key |
| `R2_SECRET_ACCESS_KEY` | `media_service` | R2 storage secret |

> **Security:** Never commit real values to git. Use `.env` (in `.gitignore`) or a secrets manager.

---

## Useful API Docs

Once services are running, Swagger UI is available at:
- Gateway: http://localhost:8100/docs
- Auth: http://localhost:8000/docs
- Course: http://localhost:8004/docs
- AI: http://localhost:8012/docs

---

## Architecture Overview

```
Frontend (Next.js :3000)
       ↓
API Gateway (:8100)
  ├── Auth Middleware (local JWT decode)
  ├── Rate Limiting (Redis)
  ├── Correlation ID headers
  └── Proxy / BFF aggregation
       ↓
Microservices (each with own DB)
  ├── auth_service → auth_db
  ├── user_service → user_db
  ├── course_service → course_db
  ├── enrollment_service → enrollment_db
  ├── progress_service → progress_db
  ├── payment_service → payment_db (Razorpay)
  ├── membership_service → membership_db
  ├── media_service → media_db (Cloudflare Stream + R2)
  └── ai_service → ai_db + Celery worker → OpenRouter LLM
```
