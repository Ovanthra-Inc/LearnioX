# LearnioX Marketing Service (`marketing-service`)

The **Marketing Service** is a microservice in the **LearnioX** platform responsible for managing promotional landing pages, lead conversion tracking, marketing campaign metrics, and email notification dispatches. Built with Python 3.11, FastAPI, SQLAlchemy 2.0 (Async), and Pydantic v2.

---

## 📢 Domain Features

- **Marketing Landing Pages**: Manages landing page content, campaign hero sections, and promotional banners.
- **Lead Capture & Conversions**: Tracks user registrations, email subscriptions, and campaign conversion rates.
- **Email Notifications**: Handles email dispatch queues for marketing updates and platform announcements.

---

## 🏗 Architecture & Stack

- **Framework**: Python 3.11 + FastAPI (Async ASGI)
- **Port**: `8002` (Internal Docker Network, proxied via Gateway `/api/v1/marketing`)
- **Database**: PostgreSQL 16 via Async SQLAlchemy 2.0
- **Configuration**: `pydantic-settings` reading central `.env` at repo root

---

## 🚀 Running Locally with Docker

```bash
docker build -t learniox-marketing-service .
docker run -p 8002:8002 --env-file ../../.env learniox-marketing-service
```
