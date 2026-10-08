import uuid
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import httpx

from app.core.exceptions import AppException
from app.models.assessment import AssessmentType
from app.services.assessment_service import AssessmentService


@pytest.fixture
def mock_db():
    session = AsyncMock()
    session.flush = AsyncMock()
    return session


@pytest.fixture
def assessment_service(mock_db):
    service = AssessmentService(db=mock_db)
    service.repo = MagicMock()
    return service


@pytest.mark.asyncio
async def test_ai_grading_network_failure_raises_app_exception(assessment_service):
    assignment_id = uuid.uuid4()
    submission_id = uuid.uuid4()
    user_id = uuid.uuid4()

    fake_assignment = MagicMock()
    fake_assignment.id = assignment_id
    fake_assignment.assessment_type = AssessmentType.CODING_QUESTION
    fake_assignment.total_marks = 100
    fake_assignment.description = "Implement binary search"
    fake_assignment.rubric_guidelines = None
    fake_assignment.reference_solution = None

    fake_submission = MagicMock()
    fake_submission.id = submission_id
    fake_submission.assignment_id = assignment_id
    fake_submission.user_id = user_id
    fake_submission.content = "def binary_search(arr, x): pass"

    assessment_service.repo.get_assignment_by_id = AsyncMock(return_value=fake_assignment)
    assessment_service.repo.get_submission_by_id = AsyncMock(return_value=fake_submission)
    assessment_service.repo.grade_submission = AsyncMock()

    # Simulate httpx network failure connecting to AI service
    with patch("httpx.AsyncClient.post", side_effect=httpx.ConnectError("Connection refused")):
        with pytest.raises(AppException) as exc_info:
            await assessment_service.evaluate_submission_with_ai(submission_id, user_id)

        assert exc_info.value.status_code == 503
        assert exc_info.value.error_code == "AI_SERVICE_UNAVAILABLE"
        # Confirm that the submission was NOT graded with a fake 80% score
        assessment_service.repo.grade_submission.assert_not_called()


@pytest.mark.asyncio
async def test_ai_grading_http_error_raises_app_exception(assessment_service):
    assignment_id = uuid.uuid4()
    submission_id = uuid.uuid4()
    user_id = uuid.uuid4()

    fake_assignment = MagicMock()
    fake_assignment.id = assignment_id
    fake_assignment.assessment_type = AssessmentType.LONG_ANSWER_ESSAY
    fake_assignment.total_marks = 50
    fake_assignment.description = "Essay on LLMs"
    fake_assignment.rubric_guidelines = None
    fake_assignment.reference_solution = None

    fake_submission = MagicMock()
    fake_submission.id = submission_id
    fake_submission.assignment_id = assignment_id
    fake_submission.user_id = user_id
    fake_submission.content = "Essay content..."

    assessment_service.repo.get_assignment_by_id = AsyncMock(return_value=fake_assignment)
    assessment_service.repo.get_submission_by_id = AsyncMock(return_value=fake_submission)
    assessment_service.repo.grade_submission = AsyncMock()

    mock_resp = MagicMock()
    mock_resp.status_code = 500
    mock_resp.text = "Internal AI Error"

    with patch("httpx.AsyncClient.post", return_value=mock_resp):
        with pytest.raises(AppException) as exc_info:
            await assessment_service.evaluate_submission_with_ai(submission_id, user_id)

        assert exc_info.value.status_code == 502
        assert exc_info.value.error_code == "AI_EVALUATION_FAILED"
        # Confirm that the submission was NOT graded with a fake 80% score
        assessment_service.repo.grade_submission.assert_not_called()
