# LearnioX — System Architecture, Implementation State & Development Guidelines

---

## 1. Project Vision & Core Identity
**LearnioX** is a **Multi-Tenant Ed-Tech Operating System** combining:
$$\text{LearnioX} = \text{YouTube (Discovery)} + \text{Udemy (Marketplace)} + \text{Graphy/Teachmint (Institution Studio)} + \text{Patreon (Memberships)} + \text{AI Operations}$$

- **Core Motto**: *"A single educator or creator should be able to run an entire online coaching institution autonomously with the power of AI, automation, and integrated business tools."*
- **Tenant Entity = Institution**: A "channel" in LearnioX is an **Institution Workspace** (e.g. coaching academy, university, creator collective) with team RBAC, custom branding, and private/public courses—not merely an individual profile.
- **The 4 Product Zones**:
  1. **Public Discovery Platform (`/`)**: Zero-login browsing, search engine, categories, trending feeds, free preview lessons.
  2. **Learner Classroom (`/learn/*`, `/courses/[id]/learn`)**: Video player with playlist sidebar, timestamped transcripts, student notes, doubts forum, and code playgrounds.
  3. **Academy Studio (`/institution/[id]`, `/studio/*`)**: Creator workspace, YouTube Studio-style content management, course creation stepper, lecture uploader, live control room, Discord-style community channels, and analytics.
  4. **Platform Admin (`/admin/*`)**: Super-admin panel for moderation, verification, disputes, and platform-wide revenue.

---

## 2. Current Implementation Ground Truth (Do Not Re-invent)
Before creating any feature, verify against existing implementations:

| Microservice | Port | Current Implementation Status | What is Mocked / Scaffolded |
| :--- | :--- | :--- | :--- |
| **`nginx`** | `80, 443` | Reverse proxy for Next.js (`/`), API Gateway (`/api/*`), and static media (`/uploads/*`). | Fully operational. |
| **`api-gateway`** | `8080` | FastAPI BFF with Redis rate-limiting, edge JWT claims extraction (`X-User-ID`), dynamic prefix routing, rotating JSON logging, and Azure App Insights OTel. | Fully operational. |
| **`server-service`** | `8000` | **30+ REST endpoints**, 15 services, 12 repositories, 20+ models. Full RBAC. Sanitized FTS + Trigram search, atomic Redis payment locks. 35 unit/integration tests passing. Rotating JSON logs & Azure App Insights. | Media storage local fallback exists when Cloudflare R2 is unconfigured. |
| **`live-service`** | `8003` | Real-time virtual classroom WebSocket hub with 200ms reaction sliding window, whiteboard synchronization, attendance reconciliation, and HMAC join tickets. 8 unit/integration tests passing. Rotating JSON logs & Azure App Insights. | Fully operational. |
| **`ai-service`** | `8001` | FastAPI service with Gemini AI + Whisper STT. **14 assessment types** generated & evaluated + deterministic offline mock simulation fallback. 18 unit/integration tests passing. Rotating JSON logs & Azure App Insights. | Fully operational with deterministic fallback. |
| **`marketing-service`**| `8002` | Directory scaffolding exists. | `app/` is currently empty and not enabled in `docker-compose.yml`. |
| **`client-service`** | `3000` | Next.js 14, Tailwind v4, Shadcn UI, Redux Toolkit (`authSlice`, `institutionSlice`), TanStack Query v5, Axios with 401 refresh queue. Implemented: `/`, `/auth/*`, `/courses`, `/courses/[id]/learn`, `/institution/[id]` (with YouTube Studio and Discord views). | Several deep studio/admin pages still use mock fallback data. |

---

## 3. Backend Architectural Invariants

### 3.1 Five-Layer Separation of Concerns
All backend code in `server-service` and `ai-service` must strictly follow:
1. **API Router Layer (`app/api/`)**: Validates HTTP input, delegates to business services, returns standardized responses.
2. **Service Layer (`app/services/`)**: Implements pure business logic, security validations, and token generation.
3. **Repository Layer (`app/repositories/`)**: Encapsulates DB queries using SQLAlchemy 2.0 async sessions.
4. **Model Layer (`app/models/`)**: Declarative SQLAlchemy models registered in `app/models/__init__.py`.
5. **Schema Layer (`app/schemas/`)**: Pydantic v2 models for DTOs and validation.

### 3.2 Universal Environment Configuration & Zero Hardcoding Policy
All runtime modes, operational parameters, thresholds, logging levels, rate limits, and credentials across the microservices mesh MUST be declared via Pydantic `BaseSettings` and managed exclusively through the root `.env` file (`c:\Users\ashut\Devlopments\Ovanthra\LearnioX\.env`) and mirrored in `.env.example`.

#### Complete Platform Controllable Environment Matrix:
| Domain Category | Environment Variables | Controllable Behavior & Defaults |
| :--- | :--- | :--- |
| **1. Runtime & Debug** | `PROJECT_NAME`, `ENVIRONMENT`, `DEBUG`, `API_V1_STR` | Toggle production vs dev, enable FastAPI `/docs` and tracebacks (`DEBUG=True`). |
| **2. Logging & Telemetry** | `LOG_LEVEL`, `LEARNIOX_LOG_DIR`, `LOG_FILE_MAX_BYTES`, `LOG_FILE_BACKUP_COUNT`, `APPLICATIONINSIGHTS_CONNECTION_STRING` | Log verbosity (`DEBUG`/`INFO`), rotating JSON directory, 25MB max size, 10 backups, and Azure App Insights OpenTelemetry connection string. |
| **3. Security & Auth** | `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS`, `INTERNAL_API_KEY`, `WEBHOOK_SECRET`, `SUPERADMIN_EMAILS` | JWT lifespan, HMAC webhook secrets, diagnostic auth keys, and platform root administrators. |
| **4. PostgreSQL Database** | `POSTGRES_SERVER`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `DATABASE_URL`, `DB_POOL_SIZE`, `DB_MAX_OVERFLOW`, `DB_POOL_RECYCLE` | Async DB connection strings and connection pool concurrency tuning (`DB_POOL_SIZE=25`, `DB_MAX_OVERFLOW=15`). |
| **5. Redis Cache & Locks** | `REDIS_HOST`, `REDIS_PORT`, `REDIS_URL`, `REDIS_DB` | Connection endpoint for caching, task queuing, and distributed purchase locks. |
| **6. Cache TTL Fine-Tuning** | `CACHE_TTL_USER_PROFILE`, `CACHE_TTL_RBAC_PERMS`, `CACHE_TTL_COURSE_LISTING`, `CACHE_TTL_INSTITUTION`, `CACHE_TTL_SEARCH`, `CACHE_TTL_DISCOVERY`, `CACHE_TTL_ANALYTICS` | Cache expiration in seconds for user profiles (300s), RBAC (60s), search (30s), discovery (60s), analytics (300s). |
| **7. API Gateway (BFF)** | `GATEWAY_HOST`, `GATEWAY_PORT`, `GATEWAY_RATE_LIMIT_WINDOW_MS`, `GATEWAY_RATE_LIMIT_MAX`, `GATEWAY_RATE_LIMIT_DEFAULT`, `SERVER_SERVICE_URL`, `AI_SERVICE_URL`, `LIVE_SERVICE_URL`, `MARKETING_SERVICE_URL` | BFF ingress host/port, SlowAPI rate limit sliding window (60s), max requests (`300/minute`), and microservice proxy destination URLs. |
| **8. Live Virtual Classroom** | `LIVE_SERVICE_PORT`, `JOIN_TICKET_EXPIRE_SECONDS`, `MEDIA_PROVIDER`, `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `MAX_PARTICIPANTS_PER_CLASS`, `REACTION_BATCH_INTERVAL_MS`, `CHAT_RATE_LIMIT_PER_SEC`, `ATTENDANCE_MIN_PERCENTAGE_PRESENT`, `ATTENDANCE_MIN_PERCENTAGE_LATE` | Join ticket TTL (120s), media provider (`dev` vs `livekit`), reaction batch interval (200ms), chat throttle (0.5/s), and attendance thresholds (75% present, 50% late). |
| **9. AI Intelligence** | `AI_SERVICE_HOST`, `AI_SERVICE_PORT`, `AI_PROVIDER`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_RESOURCE_ENDPOINT`, `AZURE_AI_PROJECT_ENDPOINT`, `AZURE_OPENAI_DEPLOYMENT_NAME`, `AZURE_OPENAI_MODEL_NAME`, `AZURE_AI_API_VERSION`, `TAVILY_API_KEY`, `GEMINI_API_KEY`, `AI_MODEL_NAME`, `AI_TEMPERATURE`, `AI_MAX_OUTPUT_TOKENS`, `AI_RATE_LIMIT_PER_MINUTE` | AI port, active provider toggle (`azure` vs `gemini` vs `mock`), Azure AI Foundry / OpenAI endpoint, key, deployment (`gpt-5-mini`), Tavily search API key for web RAG, Gemini fallback, temperature, tokens, rate limits. |
| **10. Speech Transcription** | `OPENAI_API_KEY`, `WHISPER_MODEL`, `MAX_TRANSCRIPTION_FILE_SIZE_MB`, `TRANSCRIPTION_STORAGE_DIR` | Whisper API key, model (`whisper-1`), max media file upload size (100MB), local audio storage path. |
| **11. Payments** | `PAYMENT_PROVIDER`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Active payment processor (`mock` vs `razorpay` vs `stripe`) and gateway webhook signing keys. |
| **12. Media Storage** | `STORAGE_PROVIDER`, `UPLOAD_DIR`, `MAX_FILE_SIZE_MB`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME`, `S3_REGION` | Storage engine (`local` vs `r2` vs `s3`), upload limits (5GB), Cloudflare R2 / AWS S3 buckets and zero-RAM redirect CDN URLs. |
| **13. Certificates** | `CERTIFICATE_ISSUER`, `CERTIFICATE_BASE_URL` | Certificate authority name and public verification link endpoint. |
| **14. Social OAuth** | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` | Google OAuth credentials and callback URI. |
| **15. SMTP / Email** | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_TLS`, `EMAILS_FROM_EMAIL`, `EMAILS_FROM_NAME` | Transactional email host, port, credentials, and sender headers. |
| **16. Frontend & SSR** | `FRONTEND_URL`, `NEXT_PUBLIC_API_BASE_URL`, `INTERNAL_API_URL`, `API_GATEWAY_INTERNAL_URL`, `CORS_ORIGINS` | Client public URL, browser API endpoint, internal SSR gateway endpoint, Next.js rewrite target, CORS origin array. |
| **17. Ingress & Tunneling** | `NGINX_PORT`, `NGINX_SSL_PORT`, `NGROK_AUTHTOKEN`, `NGROK_DOMAIN` | Reverse proxy ingress ports (80/443), Ngrok auth token, and public static tunnel domain. |

### 3.3 Response Contract & Error Handling
All API endpoints must return the standardized response:
```json
// Success:
{ "success": true, "message": "...", "data": { ... }, "error": null }
// Error:
{ "success": false, "message": "...", "data": null, "error": { "code": "ERROR_CODE", "details": [...] } }
```
- Never catch raw broad `Exception` in controllers; raise domain exceptions (`NotFoundException`, `UnauthorizedException`, `ValidationException`, `ForbiddenException`).
- Global FastAPI exception handlers intercept custom exceptions, HTTP exceptions, and Pydantic validation errors to format them into the standard error response contract.

### 3.4 Gateway & Ingress Routing
- Frontend must never call internal services directly; traffic routes through Nginx (`:80`) → API Gateway (`:8080`) → Backend Service.
- Technology Stack: The API Gateway (BFF) must be written in **Python (FastAPI)** with `httpx` async proxying. Do NOT use Node.js for backend services or gateway components.
- Route prefixes:
  - `/api/v1/ai/*` $\rightarrow$ `ai-service:8001`
  - `/api/v1/live/*` $\rightarrow$ `live-service:8003`
  - `/api/v1/marketing/*` $\rightarrow$ `marketing-service:8002`
  - `/api/v1/*` (default) $\rightarrow$ `server-service:8000`
- Request Tracing: All requests passing through the Gateway must carry/inject `X-Request-ID` and forwarded claims (`X-User-ID`, `X-User-Email`).
- Public Tunneling: Ngrok integration MUST be maintained in `docker-compose.yml` for local public HTTPS tunneling and webhook testing, driven by `NGROK_AUTHTOKEN` in central `.env`.

### 3.5 Centralized Structured Logging & File Rotation
All backend microservices (`api-gateway`, `server-service`, `live-service`, `ai-service`, and any newly introduced services) MUST strictly adhere to the unified logging standard:
- **Shared Mount Directory**: Log files MUST write to `/var/log/learniox/` (mounted via the shared volume `app_logs` in `docker-compose.yml`), with local fallback to `./logs/` or OS temp directory when running standalone.
- **Concurrent File Rotation**: Use `ConcurrentRotatingFileHandler` writing to `/var/log/learniox/{service_name}.json.log`:
  - `maxBytes`: 25MB (26,214,400 bytes), `backupCount`: 10.
  - JSON format keys: `timestamp`, `level`, `service`, `request_id`, `user_id`, `path`, `duration_ms`, `message`, `exc_info`.
- **Dual Destination**: All loggers MUST stream to both JSON file and standard output (`StreamHandler`) so `docker compose logs -f` continues to function seamlessly.
- **Service Initialization**: Initialize via `setup_logging(service_name)` in `app/core/logging_config.py` at bootstrap in `main.py` / `lifespan`.

### 3.6 Distributed Tracing & Azure Application Insights (OpenTelemetry)
- **Telemetry Standard**: All microservices must support OpenTelemetry distributed tracing via `app/core/telemetry.py` calling `configure_azure_monitor()`.
- **Environment Driven**: Reads `APPLICATIONINSIGHTS_CONNECTION_STRING` from environment settings. If unconfigured or empty, services must cleanly fall back to local logging without failing bootstrap.
- **Full-Stack Auto-Instrumentation**:
  - `FastAPIInstrumentor.instrument_app(app)`
  - `HTTPXClientInstrumentor().instrument()` (traces inter-service HTTP calls)
  - `SQLAlchemyInstrumentor().instrument()` (traces async DB queries and transaction latency)
  - `RedisInstrumentor().instrument()` (traces cache, locks, and task queue operations)
- **Context & Correlation Propagation**:
  - Tracing context (`traceparent`, `tracestate`, `X-Request-ID`) must propagate seamlessly across the entire distributed request lifecycle:
    $$\text{Ingress Nginx} \longrightarrow \text{API Gateway} \longrightarrow \text{Downstream Service} \longrightarrow \text{DB / Redis / External API}$$

### 3.7 Invariants for Developing New Features Across the Platform
When designing, modifying, or creating any feature across the platform, engineers and AI agents MUST enforce the following:
1. **No Raw `print()` or Default `logging.basicConfig()`**:
   - Always acquire loggers using `logger = logging.getLogger("learniox.<service>.<module>")`.
   - Never log unhandled sensitive credentials (plain-text passwords, JWT tokens, Stripe/Razorpay private keys).
2. **Propagate Tracing Headers on Inter-Service Requests**:
   - When one microservice calls another (e.g. `server-service` calling `ai-service` or `live-service`), use an instrumented `httpx.AsyncClient` that forwards the inbound `X-Request-ID`, `X-User-ID`, and `traceparent` headers.
3. **Database Repository Operations**:
   - All database queries must execute through the Repository Layer via the instrumented SQLAlchemy async session so query execution times and traces are captured automatically.
4. **WebSocket & Long-Lived Hubs**:
   - Log connection lifecycle events (`connected`, `disconnected`, `reconnected`) with `session_id`, `user_id`, and `role`.
   - Use high-performance batched loops (e.g., 200ms sliding windows) for burst events (reactions, cursor pings) rather than writing unbuffered logs on every keystroke.
5. **Asynchronous Background & Task Queue Operations**:
   - When offloading work to background workers or Redis queues (e.g., `assessment:task:{task_id}`), include `request_id` and `user_id` inside the task payload so forensic log aggregation can tie background execution directly to the originating user request.
6. **Self-Healing Test-Driven Verification**:
   - Any new feature or router endpoint MUST be accompanied by corresponding Pytest unit/integration tests covering:
     - Happy path and business edge cases.
     - Role-based access control (RBAC) authorization rejection (HTTP 401/403).
     - Input validation and exception contracts (`APIResponse.fail`).
   - All tests must pass cleanly inside Docker before shipping (`docker compose exec <service> pytest tests/ -v`).
7. **Zero-Hardcoding Invariant for All Future Platform Features**:
   - Every threshold, timeout, batch window interval, rate limit, external service URL, retry attempt count, page size default, and toggle MUST be exposed as a configurable environment variable in Pydantic `BaseSettings` (`app/core/config.py`) and documented in both `.env` and `.env.example`.
   - Never write magic numbers or hardcoded endpoints directly into business logic or route controllers. All operational settings must be controllable via `.env` without code rebuilds.

---

## 4. Frontend Client Standards (`client-service`)
When building or extending the frontend client (`client-service`), ALWAYS adhere to these core technologies:
1. **Design System Aesthetic**: Strict high-contrast, minimalist architectural aesthetic (Inter typography, uppercase tracking accents, `rounded-none` flat corners, dark mode as default via `next-themes`).
2. **Component Library**: **Shadcn UI** (Radix UI primitives + Tailwind CSS utility classes).
3. **State Management**: **Redux Toolkit (RTK)** (`@reduxjs/toolkit`, `react-redux`) for global app state (auth session, user profile, active institution, theme).
4. **Data Fetching & Caching**: **TanStack React Query (v5)** (`@tanstack/react-query`) for all API server queries and mutations.
5. **Centralized HTTP Client**: Must use a centralized **Axios** instance (`apiClient`) targeting `http://localhost/api/v1` (Nginx Ingress/Gateway), equipped with automatic JWT Bearer injection and 401 token rotation interceptors.

---

## 5. Strategic Development Roadmap

When implementing new features, align with the four development phases:

### Phase 1: Core Web & Monetization Polish (Current Priority)
1. **Real Payment Integration**: Replace `MockPaymentProvider` with Stripe and Razorpay webhook handlers (`server-service`).
2. **Wire Studio Builder to Backend**: Connect `course-create-stepper.tsx` and `lecture-upload-modal.tsx` directly to `server-service` REST endpoints instead of local mock states.
3. **Cloud Video Pipeline**: Transition from local disk storage to Cloudflare R2 / AWS S3 + HLS adaptive streaming.

### Phase 2: AI Intelligence & Automation
1. **AI Studio Integration**: Connect the 14 assessment generator endpoints in `ai-service` to the Academy Studio so instructors can auto-generate quizzes.
2. **AI Doubt Resolver**: Ingest course transcripts and lecture notes into a vector store to power an in-classroom 24/7 AI tutor.
3. **Activate Marketing Service**: Implement lead capture forms, email drips, and campaign funnels in `marketing-service:8002`.

### Phase 3 & 4: Enterprise Scale
1. **Custom White-Label Domains**: Support custom subdomains/domains per institution (`academy.customdomain.com`).
2. **Live Interactive Classes**: WebRTC / Zoom Meeting SDK integration for live interactive batches.
3. **Platform Super-Admin Console**: `/admin/*` for moderation, KYC, and financial audit logs.
