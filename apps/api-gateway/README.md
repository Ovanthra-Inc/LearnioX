# LearnioX API Gateway (`api-gateway`)

The **API Gateway** acts as the Backend-For-Frontend (BFF) proxy and centralized ingress router for the **LearnioX** microservice ecosystem. Written in **Python (FastAPI)** with `httpx` async proxying, it validates incoming requests, injects request tracing headers (`X-Request-ID`, `X-User-ID`, `X-User-Email`), routes requests to target microservices, and cleanses proxy response headers.

---

## 🛠 Features & Responsibilities

1. **Centralized Routing Table**: Matches `/api/v1` routes to target internal Docker microservices:
   - `/api/v1/ai` → `ai-service:8001`
   - `/api/v1/marketing` → `marketing-service:8002`
   - `/api/v1/*` → `server-service:8000` (Core Backend Fallback)
2. **Request Tracing**: Injects unique UUID `X-Request-ID` and forwards authenticated claim headers (`X-User-ID`, `X-User-Email`).
3. **Response Header Cleansing**: Filters out hop-by-hop headers (`date`, `server`, `transfer-encoding`, `content-length`) before passing stream responses to Nginx Ingress, preventing duplicate header log warnings.
4. **Resilience & Health Monitoring**: Exposes gateway health status at `/health` and `/gateway/routes`.

---

## 🚀 Running Locally with Docker

```bash
docker build -t learniox-api-gateway .
docker run -p 8080:8080 --env-file ../../.env learniox-api-gateway
```
