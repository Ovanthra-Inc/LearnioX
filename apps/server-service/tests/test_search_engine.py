import uuid
from datetime import datetime, timezone
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock
import pytest

from app.services.search_service import SearchService


@pytest.fixture
def mock_db():
    session = AsyncMock()
    return session


@pytest.fixture
def search_service(mock_db):
    service = SearchService(db=mock_db)
    service.repo = MagicMock()
    return service


@pytest.mark.asyncio
async def test_search_courses_with_facets_and_special_chars(search_service):
    """Test course search with keyword containing special chars and multi-facet filtering."""
    course_id = uuid.uuid4()
    cat_id = uuid.uuid4()
    inst_id = uuid.uuid4()

    fake_course_data = [
        {
            "id": course_id,
            "title": "Fullstack Microservices with FastAPI & Docker",
            "subtitle": "Production-ready engineering",
            "description": "Learn async architectures and high-concurrency systems",
            "institution_id": inst_id,
            "institution_name": "LearnioX Academy",
            "category_id": cat_id,
            "category_name": "Backend Development",
            "price": Decimal("49.99"),
            "currency": "USD",
            "level": "INTERMEDIATE",
            "access_type": "PAID",
            "enrollment_count": 150,
            "avg_rating": 4.9,
            "review_count": 42,
            "created_at": datetime.now(timezone.utc),
        }
    ]

    search_service.repo.search_courses = AsyncMock(return_value=(fake_course_data, 1))

    # Search with special search operator characters that must not break
    res = await search_service.search_courses(
        q="FastAPI & Docker | Microservices!",
        category_id=cat_id,
        institution_id=inst_id,
        level="INTERMEDIATE",
        access_type="PAID",
        min_price=Decimal("10.00"),
        max_price=Decimal("100.00"),
        sort_by="popular",
        page=1,
        limit=20,
    )

    assert res.total == 1
    assert len(res.items) == 1
    assert res.items[0].id == course_id
    assert res.items[0].title == "Fullstack Microservices with FastAPI & Docker"
    assert res.items[0].enrollment_count == 150
    assert res.total_pages == 1

    search_service.repo.search_courses.assert_called_once_with(
        q="FastAPI & Docker | Microservices!",
        category_id=cat_id,
        tag_id=None,
        institution_id=inst_id,
        level="INTERMEDIATE",
        access_type="PAID",
        min_price=Decimal("10.00"),
        max_price=Decimal("100.00"),
        sort_by="popular",
        page=1,
        limit=20,
    )


@pytest.mark.asyncio
async def test_search_institutions_and_teachers(search_service):
    """Test institution and instructor search with pagination."""
    inst_id = uuid.uuid4()
    user_id = uuid.uuid4()

    fake_institutions = [
        {
            "id": inst_id,
            "name": "MIT OpenCourse",
            "slug": "mit-opencourse",
            "tagline": "World class engineering",
            "course_count": 25,
            "member_count": 1200,
            "created_at": datetime.now(timezone.utc),
        }
    ]
    fake_teachers = [
        {
            "user_id": user_id,
            "name": "Prof. Turing",
            "email": "turing@mit.edu",
            "institution_id": inst_id,
            "institution_name": "MIT OpenCourse",
            "role_name": "Instructor",
        }
    ]

    search_service.repo.search_institutions = AsyncMock(return_value=(fake_institutions, 1))
    search_service.repo.search_teachers = AsyncMock(return_value=(fake_teachers, 1))

    inst_res = await search_service.search_institutions(q="MIT", page=1, limit=10)
    assert inst_res.total == 1
    assert inst_res.items[0].name == "MIT OpenCourse"

    teacher_res = await search_service.search_teachers(q="Turing", institution_id=inst_id, page=1, limit=10)
    assert teacher_res.total == 1
    assert teacher_res.items[0].name == "Prof. Turing"


@pytest.mark.asyncio
async def test_global_search_aggregation(search_service):
    """Test unified multi-domain global search aggregation."""
    search_service.repo.search_courses = AsyncMock(return_value=([], 0))
    search_service.repo.search_institutions = AsyncMock(return_value=([], 0))
    search_service.repo.search_teachers = AsyncMock(return_value=([], 0))

    res = await search_service.global_search(q="Python")
    assert res.total_courses == 0
    assert res.total_institutions == 0
    assert res.total_teachers == 0
    assert isinstance(res.courses, list)
    assert isinstance(res.institutions, list)
    assert isinstance(res.teachers, list)


@pytest.mark.asyncio
async def test_search_suggestions_autocomplete(search_service):
    """Test instant keyword autocomplete suggestions across courses, institutions, and tags."""
    fake_suggestions = {
        "courses": ["Python for Beginners", "Advanced Python Concurrency"],
        "institutions": ["Python Software Foundation"],
        "tags": ["python", "asyncio", "fastapi"],
    }
    search_service.repo.get_suggestions = AsyncMock(return_value=fake_suggestions)

    suggs = await search_service.get_suggestions("pyth")
    assert len(suggs.courses) == 2
    assert len(suggs.institutions) == 1
    assert len(suggs.tags) == 3
    assert "Python for Beginners" in suggs.courses
