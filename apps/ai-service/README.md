# LearnioX AI Service (`ai-service`)

The **AI Service** is a dedicated microservice in the **LearnioX** platform responsible for AI tutoring, automated quiz generation, question synthesis, and content intelligence processing. Built with Python 3.11, FastAPI, SQLAlchemy 2.0 (Async), and Pydantic v2.

---

## 🤖 Capabilities & Domain Features

- **Automated Quiz Generation**: Synthesizes multiple-choice and short-answer assessment questions from course modules and lessons.
- **AI Tutor Assistant**: Provides conversational assistance and explanations for enrolled students.
- **Content Intelligence**: Analyzes lesson text and transcriptions to generate automated summaries and key takeaways.

---

## 🏗 Architecture & Stack

- **Framework**: Python 3.11 + FastAPI (Async ASGI)
- **Port**: `8001` (Internal Docker Network, proxied via Gateway `/api/v1/ai`)
- **Database**: PostgreSQL 16 via Async SQLAlchemy 2.0
- **Configuration**: `pydantic-settings` reading central `.env` at repo root

---

## 🚀 Running Locally with Docker

```bash
docker build -t learniox-ai-service .
docker run -p 8001:8001 --env-file ../../.env learniox-ai-service
```
