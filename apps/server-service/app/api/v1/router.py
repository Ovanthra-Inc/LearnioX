from fastapi import APIRouter
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.users import router as users_router
from app.api.v1.endpoints.storage import router as storage_router
from app.api.v1.endpoints.institutions import router as institutions_router
from app.api.v1.endpoints.members import router as members_router
from app.api.v1.endpoints.invites import router as invites_router
from app.api.v1.endpoints.roles import router as roles_router
from app.api.v1.endpoints.permissions import router as permissions_router
from app.api.v1.endpoints.courses import router as courses_router
from app.api.v1.endpoints.categories import router as categories_router
from app.api.v1.endpoints.tags import router as tags_router
from app.api.v1.endpoints.modules import router as modules_router
from app.api.v1.endpoints.lessons import router as lessons_router
from app.api.v1.endpoints.curriculum import router as curriculum_router
from app.api.v1.endpoints.enrollments import router as enrollments_router
from app.api.v1.endpoints.learning import router as learning_router
from app.api.v1.endpoints.bookmarks import router as bookmarks_router
from app.api.v1.endpoints.quizzes import router as quizzes_router
from app.api.v1.endpoints.questions import router as questions_router
from app.api.v1.endpoints.attempts import router as attempts_router
from app.api.v1.endpoints.assignments import router as assignments_router
from app.api.v1.endpoints.submissions import router as submissions_router
from app.api.v1.endpoints.memberships import router as memberships_router
from app.api.v1.endpoints.purchases import router as purchases_router
from app.api.v1.endpoints.payments import router as payments_router
from app.api.v1.endpoints.coupons import router as coupons_router
from app.api.v1.endpoints.access import router as access_router
from app.api.v1.endpoints.search import router as search_router
from app.api.v1.endpoints.discovery_courses import router as discovery_courses_router
from app.api.v1.endpoints.discovery_institutions import router as discovery_institutions_router

api_v1_router = APIRouter()
api_v1_router.include_router(auth_router)
api_v1_router.include_router(users_router)
api_v1_router.include_router(storage_router)
api_v1_router.include_router(discovery_institutions_router)
api_v1_router.include_router(institutions_router)
api_v1_router.include_router(members_router)
api_v1_router.include_router(invites_router)
api_v1_router.include_router(roles_router)
api_v1_router.include_router(permissions_router)
api_v1_router.include_router(discovery_courses_router)
api_v1_router.include_router(courses_router)
api_v1_router.include_router(categories_router)
api_v1_router.include_router(tags_router)
api_v1_router.include_router(modules_router)
api_v1_router.include_router(lessons_router)
api_v1_router.include_router(curriculum_router)
api_v1_router.include_router(enrollments_router)
api_v1_router.include_router(learning_router)
api_v1_router.include_router(bookmarks_router)
api_v1_router.include_router(quizzes_router)
api_v1_router.include_router(questions_router)
api_v1_router.include_router(attempts_router)
api_v1_router.include_router(assignments_router)
api_v1_router.include_router(submissions_router)
api_v1_router.include_router(memberships_router)
api_v1_router.include_router(purchases_router)
api_v1_router.include_router(payments_router)
api_v1_router.include_router(coupons_router)
api_v1_router.include_router(access_router)
api_v1_router.include_router(search_router)
