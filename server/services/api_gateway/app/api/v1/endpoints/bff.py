"""
BFF (Backend-For-Frontend) endpoints.
Aggregates multiple service calls into single optimised responses.
"""
import uuid
from fastapi import APIRouter, Header, HTTPException, Query, Request, status
from fastapi.responses import JSONResponse
from app.core.config import get_settings
from app.clients.http_client import proxy_get

settings = get_settings()
router = APIRouter()


async def _get_json(url: str, token: str | None = None, user_id: str | None = None) -> dict:
    headers = {}
    if token:
        headers["authorization"] = f"Bearer {token}"
    if user_id:
        headers["x-user-id"] = user_id
    try:
        resp = await proxy_get(url, headers=headers)
        if resp.status_code == 200:
            return resp.json().get("data", {})
    except Exception:
        pass
    return {}


# ─────────────────────────────────────────────────────────────────────────────
# PUBLIC
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/bff/public/home")
async def public_home(request: Request):
    """Aggregated public home page data."""
    courses_data = await _get_json(f"{settings.COURSE_SERVICE_URL}/api/v1/public/courses?limit=6")
    return {
        "success": True,
        "data": {
            "featured_courses": courses_data if isinstance(courses_data, list) else [],
            "trending_courses": [],
            "trending_institutions": [],
            "categories": [],
        },
    }


@router.get("/bff/public/courses/{slug}")
async def public_course_detail(slug: str, request: Request):
    """Aggregated course detail page."""
    course = await _get_json(f"{settings.COURSE_SERVICE_URL}/api/v1/courses/slug/{slug}")
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    course_id = course.get("id")
    curriculum = await _get_json(f"{settings.LESSON_SERVICE_URL}/api/v1/public/courses/{course_id}/curriculum-preview")
    reviews = await _get_json(f"{settings.REVIEW_SERVICE_URL}/api/v1/reviews/courses/{course_id}/summary")

    return {
        "success": True,
        "data": {
            "course": course,
            "curriculum_preview": curriculum,
            "reviews_summary": reviews,
        },
    }


@router.get("/bff/public/search")
async def public_search(q: str = Query(...), page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100)):
    result = await _get_json(f"{settings.SEARCH_SERVICE_URL}/api/v1/search?q={q}&page={page}&limit={limit}")
    return {"success": True, "data": result}


# ─────────────────────────────────────────────────────────────────────────────
# AUTHENTICATED
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/bff/learner/dashboard")
async def learner_dashboard(request: Request):
    """Learner home dashboard — profile, enrollments, continue-learning, notifications."""
    user_id = request.headers.get("x-user-id")
    token = request.headers.get("authorization", "").replace("Bearer ", "")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthenticated")

    profile, enrollments, continue_learning, notifications = await _gather(
        _get_json(f"{settings.USER_SERVICE_URL}/api/v1/users/me/profile", token=token),
        _get_json(f"{settings.ENROLLMENT_SERVICE_URL}/api/v1/users/me/enrollments", token=token, user_id=user_id),
        _get_json(f"{settings.PROGRESS_SERVICE_URL}/api/v1/progress/continue-learning", token=token, user_id=user_id),
        _get_json(f"{settings.NOTIFICATION_SERVICE_URL}/api/v1/notifications/me", token=token, user_id=user_id),
    )
    return {
        "success": True,
        "data": {
            "profile": profile,
            "enrolled_courses": enrollments,
            "continue_learning": continue_learning,
            "notifications": notifications,
        },
    }


@router.get("/bff/studio/dashboard")
async def studio_dashboard(institution_id: uuid.UUID = Query(...), request: Request = None):
    """Institution studio dashboard — metrics, recent enrollments, course performance."""
    user_id = request.headers.get("x-user-id") if request else None
    institution = await _get_json(f"{settings.INSTITUTION_SERVICE_URL}/api/v1/institutions/{institution_id}")
    analytics = await _get_json(f"{settings.ANALYTICS_SERVICE_URL}/api/v1/analytics/institutions/{institution_id}")
    enrollments = await _get_json(
        f"{settings.ENROLLMENT_SERVICE_URL}/api/v1/courses/enrollments?institution_id={institution_id}&limit=10"
    )
    return {
        "success": True,
        "data": {
            "institution": institution,
            "metrics": analytics,
            "recent_enrollments": enrollments,
        },
    }


import asyncio

async def _gather(*awaitables):
    """Concurrent gather — runs all service calls in parallel."""
    results = await asyncio.gather(*awaitables, return_exceptions=True)
    # Replace exceptions with empty dict so one failing service doesn't kill the page
    return [r if not isinstance(r, Exception) else {} for r in results]


@router.get("/health")
async def health():
    return {"success": True, "data": {"status": "healthy", "service": "api_gateway"}}
