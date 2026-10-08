# Comprehensive System Audit & Architectural Review: LearnioX

---

## 1. Executive Understanding: Vision, Objectives & Mental Model

### 1.1 The Core Thesis
**LearnioX** is a **Multi-Tenant Ed-Tech Operating System & Discovery Marketplace**. It unifies five disparate models into a single distributed topology:
$$\text{LearnioX} = \text{YouTube (Frictionless Discovery)} + \text{Udemy (Marketplace Commerce)} + \text{Graphy/Teachmint (Academy Studio)} + \text{Patreon (Tiered Memberships)} + \text{AI Operations}$$

* **Primary Motto:** *"A single educator or creator should be able to run an entire online coaching institution autonomously with the power of AI, automation, and integrated business tools."*
* **Tenant Unit = Institution ("Academy"):** A channel is not merely an individual creator profile; it is an **Institution Workspace** with an isolated tenant boundary, custom branding, granular Role-Based Access Control (RBAC), multi-module curriculum authoring, private/public enrollment, community channels, and revenue collection.

---

### 1.2 The Four Distinct Product Zones

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             LEARNIOX PRODUCT ZONES                               │
├─────────────────────────┬────────────────────────────────────────────────────────┤
│ Zone 1: Public          │ Zero-login marketplace, SEO feeds, preview lectures,  │
│ Discovery (Unauthed)    │ directory by institution slug (/c/[slug] or /courses). │
├─────────────────────────┼────────────────────────────────────────────────────────┤
│ Zone 2: Learner         │ Authenticated student cockpit (/dashboard, /registered,│
│ Classroom (Authed)      │ /courses/[id]/learn): player, notes, Q&A, certs.       │
├─────────────────────────┼────────────────────────────────────────────────────────┤
│ Zone 3: Academy         │ YouTube Studio-like cockpit (/institution/[id]):       │
│ Studio (Creator)        │ uploader, curriculum stepper, live control, Discord.   │
├─────────────────────────┼────────────────────────────────────────────────────────┤
│ Zone 4: Microservice    │ AI 14-type assessment generator & grader, Whisper STT, │
│ Intelligence Mesh       │ Live Virtual Classroom WebSockets, BFF routing.        │
└─────────────────────────┴────────────────────────────────────────────────────────┘
```

---

## 2. Infrastructure, Gateway & Ingress Flow Analysis

### 2.1 Ingress & Routing Topology (`docker-compose.yml` & `apps/nginx/conf.d/default.conf`)

```
                                  Client Browser
                                        │
                                        ▼
                      ┌───────────────────────────────────┐
                      │    Nginx Reverse Proxy (:80)      │
                      └─┬───────────────┬───────────────┬─┘
                        │               │               │
       /api/v1/live/ws/ │               │ /api/         │ / & /uploads
                        ▼               ▼               ▼
                 ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
                 │ live-service│ │ api-gateway │ │client-serv. │
                 │   (:8003)   │ │   (:8080)   │ │  & Storage  │
                 └─────────────┘ └──────┬──────┘ └─────────────┘
                                        │
                   ┌────────────────────┼────────────────────┐
                   ▼                    ▼                    ▼
           ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
           │server-service│     │  ai-service  │     │ live-service │
           │   (:8000)    │     │   (:8001)    │     │   (:8003)    │
           └──────────────┘     └──────────────┘     └──────────────┘
```

1. **Traffic Segregation in Nginx:**
   * `/api/v1/live/ws/` bypasses the API Gateway and proxies directly to `live_service_upstream` (`live-service:8003`) with `Upgrade` and `Connection: "upgrade"` headers and a 24-hour timeout (`proxy_read_timeout 86400s`).
   * `/api/` proxies to `api_gateway_upstream` (`api-gateway:8080`) with `X-Request-ID` and standard proxy headers.
   * `/uploads/` serves static assets directly from `/app/uploads` via volume mount.
   * Root `/` passes to `client_service_upstream` (`client-service:3000`).

2. **API Gateway Flow (`apps/api-gateway/app/`):**
   * **Middleware 1 (SlowAPI):** Global rate limiter defaults to 300 requests/minute, backed by Redis (`redis://redis:6379`) with in-memory fallback.
   * **Middleware 2 (`GatewayAuthClaimsMiddleware`):** Edge JWT inspection using `SECRET_KEY`. If a valid `Bearer <token>` is present, it extracts `sub` and `email` and populates `request.state.user_id` and `request.state.user_email`.
   * **Middleware 3 (`GatewayRequestIDMiddleware`):** Generates a server-side UUIDv4 and injects it as `X-Request-ID`.
   * **Dynamic Proxying (`proxy.py`):**
     * Checks an in-memory **Circuit Breaker** (threshold: 5 failures, 30s recovery timeout).
     * Injects `x-user-id`, `x-user-email`, and `x-request-id` into downstream request headers.
     * Strips hop-by-hop headers (`date`, `server`, `transfer-encoding`, `content-length`, `connection`) to prevent stream duplication.
     * Route resolution order:
       1. `/api/v1/ai` $\rightarrow$ `AI_SERVICE_URL` (`ai-service:8001`)
       2. `/api/v1/marketing` $\rightarrow$ `MARKETING_SERVICE_URL` (`marketing-service:8002`)
       3. `/api/v1/live` $\rightarrow$ `LIVE_SERVICE_URL` (`live-service:8003`)
       4. `/api/v1` (Default fallback) $\rightarrow$ `SERVER_SERVICE_URL` (`server-service:8000`)

---

## 3. End-to-End Implementation Flow Analysis

### 3.1 Authentication & Session Lifecycle (`server-service`)

```
   Client POST /auth/login (or Google OAuth)
                     │
                     ▼
       AuthService.authenticate_with_password()
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
   Verify Password       Audit Log (UserAuthAudit)
         │
         ▼
   Generate Access Token (30m JWT) & Refresh Token (30d UUID hash)
         │
         ▼
   Store Refresh Token Hash in PostgreSQL (refresh_tokens)
         │
         ▼
   Response: JSON envelope + Dual HttpOnly Cookies (access_token, refresh_token)
```

* **Dual-Cookie + Bearer Redundancy:**
  * `set_auth_cookies()` in `app/core/security.py` sets `access_token` (`max_age=900s`) and `refresh_token` (`max_age=7d`, `SameSite=Lax`, `HttpOnly=True`).
  * In `apps/server-service/app/api/deps.py`: `get_current_user()` inspects `Authorization: Bearer <token>` first, then falls back to `request.cookies.get("access_token")`.
* **Cache-Aside User Profile:**
  * Checks Redis at key `user:{user_id}:profile`. If present, returns cached user data; on miss, queries PostgreSQL `users` table and caches the record for 300 seconds (`CACHE_TTL_USER_PROFILE`).
* **Silent Token Rotation Interceptor (`apps/client-service/src/lib/api/client.ts`):**
  * When any protected request returns HTTP 401, an Axios response interceptor intercepts the failure.
  * A mutex queue (`isRefreshing` flag and `failedQueue`) holds concurrent failing requests while a single `/auth/refresh` call executes.
  * On success, tokens in `localStorage` update, queued requests retry with the new token, and processing resumes without a page reload.

---

### 3.2 Access Control & Multi-Tenant Authorization Engine

```
       Incoming Request (e.g., GET /lessons/{id}/content)
                               │
                               ▼
               AccessService.can_access_lesson()
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
   Is Lesson Free Preview?               Is Lesson Visibility PUBLIC?
        │ (YES)                               │ (YES)
        ▼                                     ▼
   ALLOW (Public)                        ALLOW (Public)
            │ (NO)                                │ (NO)
            └──────────────────┬──────────────────┘
                               │
                               ▼
                    Is User Authenticated?
                               │ (YES)
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
   Institution Owner/Team?              Has Purchased Course?
        │ (YES)                               │ (YES)
        ▼                                     ▼
   ALLOW (Team Access)                   ALLOW (Purchased)
            │ (NO)                                │ (NO)
            └──────────────────┬──────────────────┘
                               │
                               ▼
                Active Membership Plan for Course?
                               │ (YES)
                               ▼
                         ALLOW (Member)
                               │ (NO)
                               ▼
                     DENY (HTTP 403 Forbidden)
```

* **Database Multi-Tenancy (`apps/server-service/app/models/`):**
  * `Course.slug` has a composite unique constraint `uq_course_slug_per_institution` (`institution_id`, `slug`). Different institutions can use identical URL slugs (e.g., `full-stack-microservices`).
  * `Institution.slug` is globally unique for top-level routing (`/institution/slug/[slug]`).
* **Hierarchical RBAC Resolution (`RoleRepository.get_member_effective_permissions`):**
  * If `institution.owner_id == user.id`, the engine grants all permissions in `PERMISSIONS_CATALOG` immediately without querying roles.
  * For other members, it joins `member_roles` $\rightarrow$ `roles` $\rightarrow$ `role_permissions` $\rightarrow$ `permissions`, compiles the effective permission set, and caches it in Redis under `inst:{institution_id}:member:{user_id}:perms` for 60 seconds (`CACHE_TTL_RBAC_PERMS`).

---

### 3.3 Course Authoring & Curriculum Hierarchy

The LMS domain implements a strict four-tier hierarchy:
$$\text{Institution} \longrightarrow \text{Course} \longrightarrow \text{CourseModule} \longrightarrow \text{Lesson} \longrightarrow \text{LessonContent / LessonResource}$$

* **Lesson Types:** `VIDEO`, `PDF`, `QUIZ`, `ASSIGNMENT`, `LIVE`, `LINK`.
* **Access Rules:**
  * `Lesson.is_preview == True`: Viewable by unauthenticated guests.
  * `Lesson.visibility`: `PUBLIC`, `ENROLLED`, `MEMBERSHIP`, `PRIVATE`.
  * `Course.status`: `DRAFT`, `PUBLISHED`, `ARCHIVED`. A course cannot be published unless it has at least one module, one lesson, and a valid description.
* **Content Decoupling:**
  * Files are never stored directly in curriculum tables. Media is uploaded first to the Storage Service (`FileRecord`), and the resulting `file_id` is linked to `LessonContent` or `LessonResource`.

---

### 3.4 Commerce, Payments & Order Reconciliation

* **Idempotent Purchase Initialization (`PaymentService.initiate_course_purchase`):**
  * Employs a distributed Redis lock: `purchase:{user_id}:{course_id}` (15-second TTL) to prevent race conditions during rapid double-clicks.
  * Database lock: `select(CoursePurchase)...with_for_update()` ensures duplicate purchases cannot commit concurrently.
  * `payments` table features `idempotency_key` and `provider_order_id`.
* **Coupon Concurrency Safeguard:**
  * `PaymentRepository.increment_coupon_usage()` performs an atomic update with conditional verification:
    ```sql
    UPDATE coupons
    SET used_count = used_count + 1
    WHERE id = :coupon_id AND (max_usage = 0 OR used_count < max_usage)
    RETURNING id;
    ```
    If another request exhausts the coupon concurrently, the update returns `None` and raises a `409 ConflictException`.
* **Provider Lifecycle & Webhook Verification:**
  * In production, webhooks enforce HMAC-SHA256 signature checks:
    * Razorpay: `X-Razorpay-Signature` against `RAZORPAY_WEBHOOK_SECRET`.
    * Stripe: `Stripe-Signature` against `STRIPE_WEBHOOK_SECRET`.
  * Webhook handlers confirm payments, record purchases, and enroll users automatically upon receiving `order.paid` / `payment_intent.succeeded`.
  * Refund handlers (`refund.processed` / `charge.refunded`) automatically revoke student enrollments and flag payment records as `REFUNDED`.

---

### 3.5 Real-Time Virtual Classroom & Signaling (`live-service`)

The `live-service` operates independently on port `8003` with dedicated PostgreSQL and Redis integration:

1. **Join Ticket Generation (`POST /live/classrooms/{id}/join-ticket`):**
   * Issues a signed HMAC JWT containing `classroom_id`, `session_id`, `role`, and `admission_status` with a 120-second expiration.
   * If the user is the instructor, `role = HOST` and `admission_status = ADMITTED`.
   * If waiting room policy is active, students receive `admission_status = WAITING`.
2. **WebSocket Hub (`/api/v1/live/ws/{session_id}`):**
   * Validates the join ticket JWT before accepting the connection.
   * Maintains active connections in memory and fans out messages cluster-wide using Redis Pub/Sub (`classroom:{session_id}:events`).
   * **Reaction Storm Mitigation:** Ephemeral reaction bursts (`👏`, `🔥`, `❤️`) are buffered in memory and flushed as an aggregate batch every 200ms (`_reaction_flusher_loop`).
3. **Automated Attendance Reconciliation:**
   * When the host ends a session (`POST /live/sessions/{id}/end`), `reconcile_attendance()` computes cumulative participation seconds for each student.
   * Compares total time against session duration:
     * $\ge 75\% \rightarrow \text{PRESENT}$
     * $50\% - 74\% \rightarrow \text{LATE}$
     * $10\% - 49\% \rightarrow \text{PARTIAL}$
     * $< 10\% \rightarrow \text{ABSENT}$
   * Persists results directly into `attendance_records`.

---

### 3.6 AI Assessment & Transcription Microservice (`ai-service`)

The `ai-service` on port `8001` supports 14 distinct assessment types:
`MCQ`, `TRUE_FALSE`, `MULTIPLE_SELECT`, `FILL_IN_BLANK`, `SHORT_ANSWER`, `LONG_ANSWER_ESSAY`, `CODING_QUESTION`, `FILE_UPLOAD_ASSIGNMENT`, `MATCHING`, `ORDERING`, `CASE_STUDY`, `PROJECT`, `PRACTICAL_LAB`, `COURSE_FINAL_EXAM`.

* **Provider Abstraction (`GeminiLLMProvider` vs `MockLLMProvider`):**
  * When `GEMINI_API_KEY` is present, it uses `gemini-1.5-flash` with strict JSON schema outputs (`response_mime_type: "application/json"`).
  * If no API key is set, it falls back to a deterministic simulation provider, keeping the system functional during local development.
* **Audio Extraction & Transcription:**
  * `audio_utils.py` uses `ffmpeg` and `ffprobe` to validate uploaded audio/video files, probe durations, and extract 16kHz mono audio tracks before dispatching them to OpenAI Whisper or local fallbacks.

---

## 4. Discrepancy & Condition Matrix: Public vs. Authenticated State

This audit identifies condition mismatches between backend security rules and frontend display states.

### Summary Matrix

| Feature / Route | Current Backend State | Current Frontend Behavior | Expected Product Behavior | Status / Defect |
| :--- | :--- | :--- | :--- | :--- |
| **Course Details (`/courses/[id]`)** | Publicly accessible; displays public curriculum TOC. | Fetches course detail. Clicking "Preview" or "Register" checks authentication. | Guest users should browse syllabus and preview lessons without redirection. | 🟢 **Matched** |
| **Lesson Watch Page (`/courses/[id]/learn`)** | `AccessService.can_access_lesson()` allows preview lessons for unauthenticated users. | `/institution/slug/[slug]/courses/[courseId]/learn` enforces `if (!isAuthenticated) router.replace('/login')`. | Guest users should be able to view free preview lessons without being forced to log in. | 🔴 **Mismatched (Client locks out guests)** |
| **Catalog Listing (`/courses`)** | `GET /courses` requires no auth; filters out unpublished drafts for guests. | Renders catalog with local fallback mock data. | Fully browsable without login. | 🟢 **Matched** |
| **Navigation Sidebar (`AppSidebar`)** | N/A | When unauthenticated, shows: Home (`/`), Discover (`/courses`), Institutions (`/institution`). When authenticated, adds: Registered (`/registered`), Community (`/community`), Settings. | Matches guest vs. student discovery model. | 🟢 **Matched** |
| **Community Hub (`/community`)** | Backend supports public free channels (`isFreeAccessible=True`). | Forces immediate redirect: `if (!isAuthenticated) router.replace('/login?redirect=/community')`. | Public preview channels should be viewable in read-only mode by unauthenticated guests. | 🟡 **Partially Mismatched** |
| **Classroom Live (`/live/[classId]`)** | Backend allows guest join tickets (`GUEST` role). | Forces redirect: `if (!isAuthenticated) router.replace('/login')`. | If `classroom.settings.guest_allowed == True`, guest access should prompt for a display name rather than forcing login. | 🟡 **Partially Mismatched** |
| **Institution Profile (`/institution/slug/[slug]`)** | Publicly accessible via `GET /institutions/slug/{slug}`. | Displays public landing page without authentication requirements. | Fully browsable by anyone. | 🟢 **Matched** |
| **Institution Workspace (`/institution/[id]`)** | Protected: requires active member or owner status in the institution. | Redirects unauthenticated users to `/login`. Renders YouTube Studio & Discord views for authenticated members. | Only accessible to institution team members. | 🟢 **Matched** |
| **Course Authoring (`CourseCreateStepper`)** | Protected: requires `course.create` permission. | `handlePublishCourse` creates the course, modules, and lessons via API, but hardcodes `isFree=True` and mock categories. | Form selections should reflect real API categories and pricing tiers. | 🟡 **Needs Data Alignment** |
| **Payment Checkout (`/courses/[id]`)** | `POST /courses/{id}/checkout` initializes a payment order; `POST /purchases/verify` confirms it. | Attempts Razorpay flow when `provider === 'RAZORPAY'`, with fallback to mock checkout. | Correctly matches provider configurations. | 🟢 **Matched** |

---

## 5. Architectural & Implementation Gaps

### 1. Hardcoded Redirection on Free Preview Lessons
* **File:** `apps/client-service/src/app/institution/slug/[slug]/courses/[courseId]/learn/page.tsx`
* **Problem:**
  ```typescript
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace(`/login?redirect=...`);
    }
  }, [isAuthLoading, isAuthenticated, router]);
  ```
  The backend `AccessService.can_access_lesson()` explicitly allows unauthenticated users to watch preview lessons (`if lesson.is_preview: return LessonAccessResponse(allowed=True)`). However, the frontend route immediately redirects unauthenticated users to `/login`.
* **Fix Required:** Allow guests into the learning interface. Display locked states and an "Enroll to Continue" prompt only when they attempt to select non-preview lessons.

---

### 2. Marketing Service Inactive in Docker Compose
* **Files:** `docker-compose.yml`, `apps/api-gateway/app/registry/routes.py`
* **Problem:** `apps/marketing-service/` contains only a `README.md` and `.dockerignore`. It has no `Dockerfile`, `requirements.txt`, or application code, and is not defined in `docker-compose.yml`. Despite this, `api-gateway` defines a routing entry for it:
  ```python
  ServiceRoute(
      path_prefix="/api/v1/marketing",
      target=settings.MARKETING_SERVICE_URL,
      name="marketing-service",
  )
  ```
  Any request sent to `/api/v1/marketing/*` will fail with an HTTP 502 Bad Gateway error through the proxy.
* **Fix Required:** Either remove `/api/v1/marketing` from `api-gateway/app/registry/routes.py` until the service is implemented, or build the minimal microservice scaffolding with a valid `/health` endpoint.

---

### 3. Nginx Container Ingress Healthcheck Dependency Mismatch
* **File:** `apps/nginx/Dockerfile`
* **Problem:** The container's health check is configured as:
  ```dockerfile
  HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
      CMD curl -f http://localhost/api/v1/live/health || exit 1
  ```
  Nginx proxies `/api/v1/live/health` to `api-gateway:8080`, which in turn routes to `live-service:8003`. If `live-service` is slow to start, Nginx will report as unhealthy even if its own core proxy service is running normally.
* **Fix Required:** Change the health check in `apps/nginx/Dockerfile` to point to Nginx's native endpoint: `http://localhost/health`.

---

### 4. Client Video Player Static Mock vs. Real Binary Stream
* **File:** `apps/client-service/src/app/institution/slug/[slug]/courses/[courseId]/learn/page.tsx`
* **Problem:** The video player component renders a static placeholder thumbnail with an overlaid Play button rather than an HTML5 `<video>` element pointing to the backend streaming endpoint:
  ```
  /api/v1/storage/files/{file_id}/preview
  ```
  The backend already supports HTTP 206 Partial Content range requests, but the frontend player does not currently consume the stream.
* **Fix Required:** Update the media player to render `<video src="/api/v1/storage/files/${activeContent.file_id}/preview" controls />` with timeupdate progress heartbeats dispatched to `/api/v1/lessons/{id}/progress`.

---

### 5. Discord-Style Community WebSocket Wiring
* **Files:** `apps/client-service/src/app/community/page.tsx`, `apps/client-service/src/components/community/telegram-chat-area.tsx`
* **Problem:** The community interface maintains chat state in local React state (`useCommunity` hook with seed arrays). While `live-service` provides a WebSocket connection hub on port `8003` for virtual classrooms, the broader community channels do not yet broadcast over a persistent WebSocket connection.
* **Fix Required:** Connect `useCommunity` to a persistent WebSocket channel topic (e.g., `/ws/community/{channelId}`) so messages synchronize across multiple connected clients in real time.

---

## 6. Verification & Validation Guidance

To verify current system behaviors locally:

### 1. Ingress & Routing Verification
```bash
# Verify Nginx native health
curl -s http://localhost/health
# Response: {"status":"healthy","service":"nginx-ingress"}

# Verify API Gateway proxying
curl -s http://localhost/api/v1/health
# Response: {"success":true,"data":{"service":"server-service"}}

# Verify Live Virtual Classroom
curl -s http://localhost/api/v1/live/health
# Response: {"success":true,"data":{"service":"live-service"}}

# Verify AI Service
curl -s http://localhost/api/v1/ai/health
# Response: {"success":true,"data":{"service":"ai-service"}}
```

### 2. Backend Automated Test Suite
From the root directory:
```bash
docker compose exec server-service pytest tests/ -v
```
All unit and integration tests (covering payment processing, curriculum multitenancy, and AI fallback behavior) should pass without errors.

---

## 7. Review Checklist for Next Steps

* [ ] **Unblock Guest Previews:** Modify `learn/page.tsx` to remove the unauthenticated redirect check when a lesson has `is_preview: true`.
* [ ] **Retire Inactive Route Entry:** Remove the unused `marketing-service` route from `apps/api-gateway/app/registry/routes.py` until the service is built.
* [ ] **Update Nginx Health Check:** Change `http://localhost/api/v1/live/health` to `http://localhost/health` in `apps/nginx/Dockerfile`.
* [ ] **Wire Real Video Streaming:** Connect the learning dashboard player to `/api/v1/storage/files/{id}/preview` and attach progress updates to `useLearningProgress`.
* [ ] **Synchronize Studio Forms:** Align category selectors and pricing fields in `CourseCreateStepper` with the backend's `/categories` endpoint and supported billing models.