import pytest
import json
from unittest.mock import patch, AsyncMock
from httpx import AsyncClient
from app.modules.assessments.types import AssessmentType, get_all_assessment_types_meta
from app.providers import get_llm_provider
from app.providers.mock import MockLLMProvider


@pytest.mark.asyncio
async def test_get_all_supported_assessment_types(async_client: AsyncClient):
    """Verifies that all 14 creator-selectable assessment types are returned with rich metadata."""
    response = await async_client.get("/api/v1/ai/assessments/types")
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["data"] is not None
    data = payload["data"]
    assert len(data) == 14

    returned_types = {item["type"] for item in data}
    expected_types = {t.value for t in AssessmentType}
    assert returned_types == expected_types

    # Verify category and difficulty metadata exist on each item
    for item in data:
        assert "label" in item
        assert "difficulty" in item
        assert "category" in item


@pytest.mark.asyncio
async def test_mock_llm_fallback_when_gemini_unset(monkeypatch):
    """Ensures deterministic MockLLMProvider is active when GEMINI_API_KEY is empty."""
    from app.core.config import settings

    monkeypatch.setattr(settings, "GEMINI_API_KEY", "")
    provider = get_llm_provider()
    assert isinstance(provider, MockLLMProvider)
    assert provider.provider_name == "mock"
    assert provider.is_configured is True

    text = await provider.generate_text("Explain binary trees")
    assert "simulated AI response" in text or "LearnioX" in text

    json_resp = await provider.generate_json("Generate quiz")
    assert isinstance(json_resp, dict)
    assert json_resp.get("mock") is True


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "assessment_type",
    [
        AssessmentType.MCQ,
        AssessmentType.CODING_QUESTION,
        AssessmentType.MATCHING,
        AssessmentType.ORDERING,
        AssessmentType.TRUE_FALSE,
        AssessmentType.CASE_STUDY,
        AssessmentType.LONG_ANSWER_ESSAY,
        AssessmentType.PRACTICAL_LAB,
        AssessmentType.PROJECT,
    ],
)
async def test_generation_across_assessment_types(
    async_client: AsyncClient, assessment_type: AssessmentType
):
    """Tests generating assessment items across diverse assessment types with offline simulation fallback."""
    payload = {
        "assessment_type": assessment_type.value,
        "topic": "Distributed Consensus & Raft",
        "difficulty": "MEDIUM",
        "count": 2,
        "total_marks": 100,
        "include_rubric": True,
        "include_reference_solution": True,
    }

    response = await async_client.post("/api/v1/ai/assessments/generate", json=payload)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is True
    data = res_data["data"]
    assert data["assessment_type"] == assessment_type.value
    assert data["count"] == 2
    items = data["items"]
    assert len(items) == 2

    first_item = items[0]
    assert "title" in first_item
    assert "instructions" in first_item

    # Verify type-specific attributes
    if assessment_type == AssessmentType.MCQ:
        assert first_item["options"] is not None
        assert len(first_item["options"]) >= 4
        assert first_item["correct_option_id"] is not None
    elif assessment_type == AssessmentType.CODING_QUESTION:
        assert first_item["starter_code"] is not None
        assert first_item["test_cases"] is not None
        assert len(first_item["test_cases"]) > 0
    elif assessment_type == AssessmentType.MATCHING:
        assert first_item["matching_pairs"] is not None
        assert len(first_item["matching_pairs"]) > 0
    elif assessment_type == AssessmentType.ORDERING:
        assert first_item["unordered_steps"] is not None
        assert first_item["correct_step_order"] is not None
    elif assessment_type == AssessmentType.TRUE_FALSE:
        assert first_item["correct_boolean"] is not None
    elif assessment_type == AssessmentType.CASE_STUDY:
        assert first_item["scenario"] is not None
        assert first_item["sub_questions"] is not None


@pytest.mark.asyncio
async def test_grading_coding_submission(async_client: AsyncClient):
    """Tests automated evaluation and rubric scoring for a coding submission."""
    req_payload = {
        "assessment_type": AssessmentType.CODING_QUESTION.value,
        "title": "Reverse Linked List in-place",
        "instructions": "Implement optimal function reverse_list(head) with O(1) extra space.",
        "student_submission": """
def reverse_list(head):
    prev = None
    curr = head
    while curr:
        nxt = curr.next
        curr.next = prev
        prev = curr
        curr = nxt
    return prev
""",
        "total_marks": 100,
        "rubric_guidelines": "Evaluate time complexity O(N) and space complexity O(1).",
    }

    response = await async_client.post("/api/v1/ai/assessments/grade", json=req_payload)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is True
    data = res_data["data"]
    assert data["assessment_type"] == AssessmentType.CODING_QUESTION.value
    assert data["score"] > 70
    assert data["passed"] is True
    assert len(data["rubric_breakdown"]) > 0
    assert len(data["strengths"]) > 0


@pytest.mark.asyncio
async def test_grading_blank_submission_penalty(async_client: AsyncClient):
    """Tests that blank or trivial submissions receive a failing grade and penalization."""
    req_payload = {
        "assessment_type": AssessmentType.LONG_ANSWER_ESSAY.value,
        "title": "Explain ACID Properties in Relational Databases",
        "instructions": "Discuss Atomicity, Consistency, Isolation, and Durability.",
        "student_submission": "",
        "total_marks": 100,
    }

    response = await async_client.post("/api/v1/ai/assessments/grade", json=req_payload)
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["passed"] is False
    assert data["score"] < 50


@pytest.mark.asyncio
async def test_redis_task_status_polling_not_found(async_client: AsyncClient):
    """Tests polling a task ID that does not exist in Redis."""
    response = await async_client.get("/api/v1/ai/assessments/tasks/unknown-task-id-999")
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is False
    assert res_data["error"]["code"] == "TASK_NOT_FOUND"


@pytest.mark.asyncio
async def test_redis_task_status_polling_success(async_client: AsyncClient):
    """Tests polling a task ID that exists in Redis cache."""
    mock_task_data = {
        "task_id": "test-task-123",
        "status": "COMPLETED",
        "progress_percentage": 100,
        "score": 92,
        "passed": True,
    }

    mock_redis = AsyncMock()
    mock_redis.get.return_value = json.dumps(mock_task_data)
    mock_redis.aclose = AsyncMock()

    with patch("redis.asyncio.Redis.from_url", return_value=mock_redis):
        response = await async_client.get("/api/v1/ai/assessments/tasks/test-task-123")
        assert response.status_code == 200
        res_data = response.json()
        assert res_data["success"] is True
        assert res_data["data"]["status"] == "COMPLETED"
        assert res_data["data"]["score"] == 92
