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
| **`api-gateway`** | `8080` | FastAPI BFF with Redis rate-limiting, edge JWT claims extraction (`X-User-ID`), and dynamic prefix routing. | Fully operational. |
| **`server-service`** | `8000` | **30 REST endpoints**, 15 services, 12 repositories, and 20+ database models. Full RBAC (30+ permissions across 7 roles: Owner, Admin, Instructor, Content Manager, Support, Finance, Marketing). | Payments use `MockPaymentProvider`; media storage is local disk (`/app/uploads`). |
| **`ai-service`** | `8001` | FastAPI service with Gemini AI integration. **14 assessment types** generated & evaluated (MCQ, Coding, Essay, Labs, etc.) + lecture transcription prototype. | Simulated dev fallback exists when API key is unset. |
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

### 3.2 Configuration & Environments
- Backend services must load configuration using **`pydantic-settings`**.
- All variables belong in the root `.env` file (`c:\Users\ashut\Devlopments\Ovanthra\LearnioX\.env`). Never hardcode secrets.

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
  - `/api/v1/marketing/*` $\rightarrow$ `marketing-service:8002`
  - `/api/v1/*` (default) $\rightarrow$ `server-service:8000`
- Request Tracing: All requests passing through the Gateway must carry/inject `X-Request-ID` and forwarded claims (`X-User-ID`, `X-User-Email`).
- Public Tunneling: Ngrok integration MUST be maintained in `docker-compose.yml` for local public HTTPS tunneling and webhook testing, driven by `NGROK_AUTHTOKEN` in central `.env`.

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
