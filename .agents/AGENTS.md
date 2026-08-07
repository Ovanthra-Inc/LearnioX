# LearnioX Project Architecture & Coding Guidelines

## 1. Centralized Environment Configuration
- All backend services must use **`pydantic-settings`** to load configuration variables.
- All configuration keys must be declared in the central environment file located at the repository root: `c:\Users\ashut\Devlopments\Ovanthra\LearnioX\.env`.
- Hardcoding secrets, database URLs, or API keys in individual service code is strictly prohibited.

## 2. API Versioning Standard
- Every API endpoint must be versioned under `/api/v<N>` (e.g. `/api/v1/auth`, `/api/v1/users`).
- Future non-breaking and breaking API evolutions must be isolated into new router sub-modules (e.g. `app/api/v2`).

## 3. Consistent Standardized Response Contract
All API endpoints across services must wrap responses in a predictable JSON structure:

```json
{
  "success": true,
  "message": "Human readable status message",
  "data": { ... },
  "error": null
}
```

For errors:
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

## 4. Exception & Error Handling Strategy
- Controllers/Routers must not catch broad `Exception`s directly into unformatted raw responses.
- Raise custom domain exceptions (`AppException`, `UnauthorizedException`, `NotFoundException`, `ForbiddenException`, `ValidationException`).
- Global FastAPI exception handlers intercept custom exceptions, HTTP exceptions, and Pydantic validation errors to format them into the standard error response contract.

## 5. Layered Architecture Pattern
Services must adhere to the clear separation of concerns:
1. **API Router Layer (`app/api/`)**: Validates HTTP input, delegates to business services, returns standardized responses.
2. **Service Layer (`app/services/`)**: Implements pure business logic, security validations, and token generation.
3. **Repository Layer (`app/repositories/`)**: Encapsulates DB queries using SQLAlchemy 2.0 async sessions.
4. **Model Layer (`app/models/`)**: Declarative SQLAlchemy models.
5. **Schema Layer (`app/schemas/`)**: Pydantic models for data transfer (DTOs).

## 6. Gateway & Infrastructure Architecture Standards
- **Ingress & Proxy Topology**: Client requests must route through **Nginx Ingress Proxy** (`:80`) → **Python BFF API Gateway** (`apps/api-gateway` on `:8080`) → Backend Microservices (`server-service:8000`, `ai-service:8001`, `marketing-service:8002`, etc.). Direct access to backend microservices from outside the Docker network is prohibited in production.
- **Python Technology Stack for Gateway**: The API Gateway (BFF) must be written in **Python (FastAPI)** with `httpx` async proxying. Do NOT use Node.js for backend services or gateway components.
- **Public Tunneling**: Ngrok integration MUST be maintained in `docker-compose.yml` for local public HTTPS tunneling and webhook testing, driven by `NGROK_AUTHTOKEN` in central `.env`.
- **Request Tracing**: All requests passing through the Gateway must carry/inject `X-Request-ID` and forwarded claims (`X-User-ID`, `X-User-Email`).

## 7. Frontend Client Architecture Standards
When building or extending the frontend client (`client-service`), ALWAYS adhere to these core technologies:
1. **Component Library**: **Shadcn UI** (Radix UI primitives + Tailwind CSS utility classes).
2. **Theming**: **Dark & Light Mode** support (`next-themes` / ThemeProvider) with dark mode as default.
3. **State Management**: **Redux Toolkit (RTK)** (`@reduxjs/toolkit`, `react-redux`) for global app state (auth session, user profile, active institution, theme).
4. **Data Fetching & Caching**: **TanStack React Query (v5)** (`@tanstack/react-query`) for all API server queries and mutations.
5. **Centralized HTTP Client**: Must use a centralized **Axios** instance (`apiClient`) targeting `http://localhost/api/v1` (Nginx Ingress/Gateway), equipped with automatic JWT Bearer injection and 401 token rotation interceptors.
