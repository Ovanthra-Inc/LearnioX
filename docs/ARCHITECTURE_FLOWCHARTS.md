# LearnioX Project Architecture & System Flowcharts

This document provides a complete technical visualization of the LearnioX platform using Mermaid architecture diagrams and flowcharts.

---

## 1. System Ingress & Public Tunneling Topology

```mermaid
flowchart TD
    subgraph External["External World"]
        UserBrowser["User Browser / Client App"]
        Webhooks["Third-Party Webhooks (Stripe/Payment)"]
    end

    subgraph Tunneling["Public Tunneling Layer"]
        Ngrok["Ngrok Service (learniox-ngrok)\nTunnel: plus-veto-hence.ngrok-free.dev"]
    end

    subgraph Ingress["Ingress Proxy Layer"]
        Nginx["Nginx Ingress Reverse Proxy\n(learniox-nginx-ingress:80 / 443)"]
        UploadsVolume["Static Uploads Volume\n(/app/uploads)"]
    end

    subgraph AppLayer["Application Layer"]
        ClientApp["Client Service (Next.js 14 App)\n(learniox-client-service:3000)"]
        APIGateway["BFF API Gateway (FastAPI)\n(learniox-api-gateway:8080)"]
    end

    UserBrowser -->|Direct HTTP/HTTPS| Nginx
    Webhooks -->|HTTPS Webhook Call| Ngrok
    Ngrok -->|Port 80 Forwarding| Nginx

    Nginx -->|"Route '/' (HTML/JS)"| ClientApp
    Nginx -->|Route '/uploads/*| UploadsVolume
    Nginx -->|Route '/api/*| APIGateway
```

---

## 2. BFF API Gateway Request Lifecycle

```mermaid
sequenceDiagram
    autonumber
    participant Client as Frontend Client / External Request
    participant Gateway as API Gateway (api-gateway:8080)
    participant ReqIdMW as RequestIdMiddleware
    participant AuthMW as GatewayAuthClaimsMiddleware
    participant Redis as Redis Rate Limiter (redis:6379)
    participant Resolver as Service Registry Resolver
    participant Microservice as Target Microservice (server-service)

    Client->>Gateway: HTTP Request (Headers + JWT Bearer)
    Gateway->>ReqIdMW: Process Request
    ReqIdMW->>ReqIdMW: Inject/Generate X-Request-ID
    Gateway->>AuthMW: Process Auth Claims
    AuthMW->>AuthMW: Decode JWT Secret Key
    AuthMW->>AuthMW: Attach X-User-ID and X-User-Email
    Gateway->>Redis: Check IP & Rate Limits
    Redis-->>Gateway: Rate Limit Allowed
    Gateway->>Resolver: Resolve Path Prefix (/api/v1/*)
    Resolver-->>Gateway: Target: http://server-service:8000
    Gateway->>Microservice: Async Stream Request via httpx (Forward Headers)
    Microservice-->>Gateway: JSON API Response
    Gateway-->>Client: Streaming Response + Tracing Headers
```

---

## 3. Core Service Routing & Microservice Mesh

```mermaid
flowchart LR
    subgraph Gateway["BFF API Gateway (:8080)"]
        RouterRegistry["SERVICE_REGISTRY\nPath Matching Engine"]
    end

    subgraph Microservices["Backend Microservices"]
        ServerService["server-service (:8000)\nAuth, Courses, Payments,\nCurriculum, Storage, Users"]
        AIService["ai-service (:8001)\nAI Tutor, Summarizer,\nQuiz Generation"]
        MarketingService["marketing-service (:8002)\nLanding Pages, Emails,\nAnalytics"]
    end

    subgraph DataStore["Data Infrastructure"]
        Postgres[(PostgreSQL 16\nlearniox-postgres:5432)]
        RedisCache[(Redis 7\nlearniox-redis:6379)]
    end

    RouterRegistry -->|Prefix '/api/v1/ai'| AIService
    RouterRegistry -->|Prefix '/api/v1/marketing'| MarketingService
    RouterRegistry -->|Prefix '/api/v1/*' (Default)| ServerService

    ServerService -->|SQLAlchemy 2.0 Async Session| Postgres
    ServerService -->|Cache & Session Storage| RedisCache
    AIService -->|Cache Prompt Context| RedisCache
```

---

## 4. 5-Layer Backend Architecture Flowchart

```mermaid
flowchart TD
    subgraph Layer1["1. API Router Layer (app/api/v1/endpoints/*.py)"]
        RouterEndpoint["FastAPI Endpoint Handler\n(e.g., POST /courses/{id}/enroll)"]
        Deps["Dependency Injection (deps.py)\n- DB Session\n- get_current_user\n- Service Factory"]
    end

    subgraph Layer2["2. Service Layer (app/services/*.py)"]
        BusinessLogic["Service Implementation\n(e.g., EnrollmentService.enroll_user)\n- Validates business rules\n- Computes pricing & discounts\n- Triggers domain events"]
    end

    subgraph Layer3["3. Repository Layer (app/repositories/*.py)"]
        DataRepository["Repository Implementation\n(e.g., EnrollmentRepository)\n- Async SQLAlchemy queries\n- DB transactions & atomic operations"]
    end

    subgraph Layer4["4. Model Layer (app/models/*.py)"]
        ORMModel["SQLAlchemy Declarative Models\n(User, Course, Enrollment, Payment)"]
    end

    subgraph Layer5["5. Database Engine"]
        PostgreSQL[("PostgreSQL 16 Database")]
    end

    RouterEndpoint --> Deps
    Deps --> BusinessLogic
    BusinessLogic --> DataRepository
    DataRepository --> ORMModel
    ORMModel --> PostgreSQL
```

---

## 5. Domain Specific Flowcharts

### 5.1 Authentication & JWT Token Lifecycle

```mermaid
flowchart TD
    Start([User Submit Credentials]) --> LoginEndpoint["POST /api/v1/auth/login"]
    LoginEndpoint --> ValidateInput{"Valid Email & Password?"}
    
    ValidateInput -- No --> Raise401["Raise UnauthorizedException (401)"]
    ValidateInput -- Yes --> QueryUser["UserRepository.get_by_email()"]
    
    QueryUser --> CheckActive{"User Exists & Active?"}
    CheckActive -- No --> Raise401
    CheckActive -- Yes --> VerifyPwd{"security.verify_password()"}
    
    VerifyPwd -- No --> Raise401
    VerifyPwd -- Yes --> GenerateTokens["Generate Access Token (JWT 30m)\nGenerate Refresh Token (Opaque UUID 30d)"]
    
    GenerateTokens --> SaveRefreshToken["TokenRepository.create_refresh_token()"]
    SaveRefreshToken --> ReturnResponse["Return Standardized APIResponse\n{ success: true, data: { access_token, refresh_token } }"]
```

---

### 5.2 Multi-Tenant Institution RBAC Flowchart

```mermaid
flowchart TD
    Req["Request to Protected Institution Action\n(e.g., POST /institutions/{id}/courses)"] --> CheckToken{"JWT Bearer Present?"}
    CheckToken -- No --> Unauth["401 Unauthorized"]
    CheckToken -- Yes --> GetUser["deps.get_current_user()"]
    
    GetUser --> GetMember["MemberRepository.get_by_user_and_institution()"]
    GetMember --> CheckMemberStatus{"Is Member Active?"}
    
    CheckMemberStatus -- No --> Forbidden["403 Forbidden (Not a member of Institution)"]
    CheckMemberStatus -- Yes --> GetRole["RoleRepository.get_by_id(member.role_id)"]
    
    GetRole --> CheckPerms{"Role HAS Required Permission?\n(e.g., 'course:create')"}
    CheckPerms -- No --> Forbidden
    CheckPerms -- Yes --> AllowAction["Execute Service Action"]
```

---

### 5.3 Course & Curriculum Builder Structure

```mermaid
flowchart TD
    Institution["Institution (Tenant)"] -->|1 : N| Course["Course"]
    Course -->|1 : N| Module["Module (Section)"]
    Module -->|1 : N| Lesson["Lesson"]
    
    Lesson -->|Type 1| VideoContent["Video Lesson\n(HLS / Storage URL)"]
    Lesson -->|Type 2| DocumentContent["Document Lesson\n(Markdown / PDF)"]
    Lesson -->|Type 3| QuizContent["Quiz Assessment"]
    Lesson -->|Type 4| AssignmentContent["Assignment Submission"]

    QuizContent -->|1 : N| Question["Question (MCQ / True-False / Text)"]
```

---

### 5.4 Quiz Attempt & Automated Grading Engine

```mermaid
sequenceDiagram
    autonumber
    participant Student as Learner Client
    participant QuizAPI as Quizzes Endpoint (/quizzes)
    participant AssessService as AssessmentService
    participant AssessRepo as AssessmentRepository
    participant DB as PostgreSQL DB

    Student->>QuizAPI: POST /quizzes/{id}/attempts (Start Quiz)
    QuizAPI->>AssessService: start_quiz_attempt(user_id, quiz_id)
    AssessService->>AssessRepo: create_attempt(status=IN_PROGRESS)
    AssessRepo->>DB: INSERT INTO quiz_attempts
    DB-->>Student: Return QuizAttempt JSON (Questions without correct answers)

    Student->>QuizAPI: POST /attempts/{attempt_id}/submit (Answers List)
    QuizAPI->>AssessService: submit_quiz(attempt_id, answers)
    AssessService->>AssessService: Evaluate each answer against correct option
    AssessService->>AssessService: Calculate Score % & Pass/Fail Status
    AssessService->>AssessRepo: update_attempt(score, passed=True/False)
    AssessRepo->>DB: UPDATE quiz_attempts & INSERT quiz_answers
    AssessService-->>Student: Return Attempt Result & Explanation
```

---

### 5.5 Payment Checkout & Webhook Instant Access Grant

```mermaid
sequenceDiagram
    autonumber
    participant Learner as Learner Client
    participant PaymentAPI as Payments Endpoint
    participant PayService as PaymentService
    participant CouponRepo as PaymentRepository (Coupons)
    participant PayGateway as Payment Gateway (Stripe/Razorpay)
    participant EnrollService as EnrollmentService

    Learner->>PaymentAPI: POST /payments/checkout (course_id, coupon_code)
    PaymentAPI->>PayService: create_checkout_session()
    alt Coupon Provided
        PayService->>CouponRepo: get_coupon(coupon_code)
        CouponRepo-->>PayService: Return Discount %
    end
    PayService->>PayGateway: Create External Order / Session
    PayGateway-->>Learner: Redirect to Checkout URL

    Note over Learner, PayGateway: Learner Completes Payment

    PayGateway->>PaymentAPI: POST /payments/webhook (HMAC Signed Signature)
    PaymentAPI->>PayService: handle_webhook(payload, signature)
    PayService->>PayService: Verify HMAC SHA256 Signature
    PayService->>EnrollService: enroll_user(user_id, course_id)
    EnrollService->>EnrollService: Grant Instant Access & Init LessonProgress
    PayService-->>PayGateway: 200 OK Response
```

---

### 5.6 File Storage & Upload Pipeline

```mermaid
flowchart TD
    ClientUpload["Client File Upload Request\n(POST /api/v1/storage/upload)"] --> Gateway["API Gateway"]
    Gateway --> StorageEndpoint["Storage Endpoint"]
    
    StorageEndpoint --> StorageService["StorageService.upload_file()"]
    StorageService --> ValidateFile{"Validate Size & Extension\n(Max 5GB, Image/Video/Doc)"}
    
    ValidateFile -- Invalid --> Error400["400 Bad Request (Invalid File Type)"]
    ValidateFile -- Valid --> ComputeHash["Compute File SHA-256 Checksum"]
    
    ComputeHash --> SaveDisk["Save File to Server Volume\n(/app/uploads/YYYY/MM/filename.ext)"]
    SaveDisk --> CreateDBRecord["StorageRepository.create_file()\n(Save Metadata & Path)"]
    CreateDBRecord --> ReturnURL["Return Accessible File URL\n(http://localhost/uploads/...)"]
```

---

## 6. Frontend Client State & Data Synchronization (`client-service`)

```mermaid
flowchart TD
    subgraph ReactUI["Next.js 14 React Frontend (client-service)"]
        Component["React UI Component\n(e.g., CourseCatalog, QuizViewer)"]
        ReduxStore["Redux Toolkit Global Store\n- authSlice (Session, User, Token)\n- institutionSlice (Active Tenant)"]
        ReactQuery["TanStack React Query v5\n- Query Caching\n- Optimistic Mutations"]
    end

    subgraph AxiosClient["Centralized Axios HTTP Client (lib/api.ts)"]
        AxiosInstance["Axios Instance\nBase URL: /api/v1"]
        RequestInterceptor["Request Interceptor\nInject 'Authorization: Bearer <Token>'"]
        ResponseInterceptor["Response Interceptor\nCatch 401 & Auto Refresh Token"]
    end

    subgraph ServerTarget["Ingress / Gateway Target"]
        GatewayTarget["Nginx Ingress / API Gateway\nhttp://localhost/api/v1"]
    end

    Component -->|Dispatch Action| ReduxStore
    Component -->|Execute Query / Mutation| ReactQuery
    ReactQuery -->|Fetch Data| AxiosInstance
    AxiosInstance --> RequestInterceptor
    RequestInterceptor --> GatewayTarget
    GatewayTarget -->|401 Token Expired| ResponseInterceptor
    ResponseInterceptor -->|Call /auth/refresh| GatewayTarget
```
