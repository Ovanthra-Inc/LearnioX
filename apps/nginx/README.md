# LearnioX Nginx Ingress (`nginx-ingress`)

The **Nginx Ingress** service acts as the primary HTTP reverse proxy and edge router (`:80`) for the **LearnioX** platform. It manages client traffic routing, static asset caching, Gzip compression, WebSocket upgrades, media storage serving, and proxying to downstream container services.

---

## 🔀 Traffic Routing Rules

| Path Pattern | Upstream Destination | Description |
| :--- | :--- | :--- |
| `/api/v1/` | `http://api-gateway:8080` | Routes API requests to the Python FastAPI BFF API Gateway |
| `/uploads/` | `/app/uploads` (Mounted Volume) | Serves persistent user uploads, branding media, and static assets |
| `/` | `http://client-service:3000` | Routes web app traffic to Next.js standalone container |

---

## ⚙️ Performance & Proxy Configuration

- **Buffer Tuning**: `proxy_buffer_size 128k`, `proxy_buffers 4 256k`, `proxy_busy_buffers_size 256k`
- **Compression**: Gzip enabled for text, JSON, CSS, JavaScript, and SVG assets
- **Timeouts**: `proxy_connect_timeout 60s`, `proxy_send_timeout 60s`, `proxy_read_timeout 60s`
- **Headers**: Injects `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`, and passes `Upgrade` headers for WebSocket connections

---

## 🚀 Running Locally with Docker

```bash
docker build -t learniox-nginx .
docker run -p 80:80 learniox-nginx
```
