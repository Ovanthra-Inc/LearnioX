from datetime import datetime, timezone
from typing import List, Optional, Tuple
from uuid import UUID
from sqlalchemy import func, select, and_, delete, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import NotFoundException

from app.models.assessment import (
    Assignment,
    AssignmentStatus,
    AssignmentSubmission,
    AttemptStatus,
    QuestionType,
    Quiz,
    QuizAnswer,
    QuizAttempt,
    QuizOption,
    QuizQuestion,
    QuizStatus,
    SubmissionStatus,
)
from app.schemas.assessment import OptionRequest, SubmitAnswerItem


class AssessmentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    # Quiz Operations
    async def create_quiz(
        self,
        lesson_id: UUID,
        title: str,
        description: Optional[str] = None,
        passing_marks: int = 0,
        total_marks: int = 0,
        time_limit: int = 0,
        attempt_limit: int = 0,
        shuffle_questions: bool = False,
        show_result: bool = True,
        created_by: Optional[UUID] = None,
    ) -> Quiz:
        quiz = Quiz(
            lesson_id=lesson_id,
            title=title.strip(),
            description=description,
            passing_marks=passing_marks,
            total_marks=total_marks,
            time_limit=time_limit,
            attempt_limit=attempt_limit,
            shuffle_questions=shuffle_questions,
            show_result=show_result,
            status=QuizStatus.DRAFT,
            created_by=created_by,
        )
        self.db.add(quiz)
        await self.db.flush()
        await self.db.refresh(quiz)
        return quiz

    async def get_quiz_by_id(self, quiz_id: UUID) -> Optional[Quiz]:
        res = await self.db.execute(select(Quiz).where(Quiz.id == quiz_id))
        return res.scalars().first()

    async def list_quizzes(self, lesson_id: UUID) -> List[Quiz]:
        res = await self.db.execute(
            select(Quiz).where(Quiz.lesson_id == lesson_id).order_by(Quiz.created_at.asc())
        )
        return list(res.scalars().all())

    async def update_quiz(self, quiz: Quiz, update_dict: dict) -> Quiz:
        for k, v in update_dict.items():
            if v is not None:
                setattr(quiz, k, v)
        await self.db.flush()
        await self.db.refresh(quiz)
        return quiz

    async def delete_quiz(self, quiz_id: UUID) -> bool:
        quiz = await self.get_quiz_by_id(quiz_id)
        if not quiz:
            return False
        await self.db.delete(quiz)
        await self.db.flush()
        return True

    # Question & Option Operations
    async def create_question(
        self,
        quiz_id: UUID,
        question_text: str,
        question_type: QuestionType = QuestionType.MCQ,
        marks: int = 1,
        explanation: Optional[str] = None,
        options: Optional[List[OptionRequest]] = None,
    ) -> QuizQuestion:
        max_pos_res = await self.db.execute(
            select(func.coalesce(func.max(QuizQuestion.position), 0)).where(
                QuizQuestion.quiz_id == quiz_id
            )
        )
        max_pos = max_pos_res.scalar_one()

        question = QuizQuestion(
            quiz_id=quiz_id,
            question=question_text.strip(),
            question_type=question_type,
            marks=marks,
            position=max_pos + 1,
            explanation=explanation,
        )
        self.db.add(question)
        await self.db.flush()
        await self.db.refresh(question)

        if options:
            for opt in options:
                option = QuizOption(
                    question_id=question.id,
                    option_text=opt.option_text.strip(),
                    is_correct=opt.is_correct,
                )
                self.db.add(option)
            await self.db.flush()

        # Recalculate Quiz total_marks
        total_m_res = await self.db.execute(
            select(func.coalesce(func.sum(QuizQuestion.marks), 0)).where(
                QuizQuestion.quiz_id == quiz_id
            )
        )
        total_marks = total_m_res.scalar_one()
        quiz = await self.get_quiz_by_id(quiz_id)
        if quiz:
            quiz.total_marks = total_marks
            await self.db.flush()

        return question

    async def get_question_by_id(self, question_id: UUID) -> Optional[QuizQuestion]:
        res = await self.db.execute(
            select(QuizQuestion).where(QuizQuestion.id == question_id)
        )
        return res.scalars().first()

    async def list_questions(self, quiz_id: UUID) -> List[QuizQuestion]:
        res = await self.db.execute(
            select(QuizQuestion)
            .where(QuizQuestion.quiz_id == quiz_id)
            .order_by(QuizQuestion.position.asc())
        )
        return list(res.scalars().all())

    async def list_options(self, question_id: UUID) -> List[QuizOption]:
        res = await self.db.execute(
            select(QuizOption).where(QuizOption.question_id == question_id)
        )
        return list(res.scalars().all())

    async def update_question(self, question: QuizQuestion, update_dict: dict) -> QuizQuestion:
        for k, v in update_dict.items():
            if v is not None:
                setattr(question, k, v)
        await self.db.flush()
        await self.db.refresh(question)
        return question

    async def delete_question(self, question_id: UUID) -> bool:
        q = await self.get_question_by_id(question_id)
        if not q:
            return False
        quiz_id = q.quiz_id
        await self.db.delete(q)
        await self.db.flush()

        # Recalculate Quiz total_marks
        total_m_res = await self.db.execute(
            select(func.coalesce(func.sum(QuizQuestion.marks), 0)).where(
                QuizQuestion.quiz_id == quiz_id
            )
        )
        total_marks = total_m_res.scalar_one()
        quiz = await self.get_quiz_by_id(quiz_id)
        if quiz:
            quiz.total_marks = total_marks
            await self.db.flush()
        return True

    async def reorder_questions(self, quiz_id: UUID, question_ids: List[UUID]) -> bool:
        for index, q_id in enumerate(question_ids, start=1):
            await self.db.execute(
                update(QuizQuestion)
                .where(
                    and_(
                        QuizQuestion.id == q_id,
                        QuizQuestion.quiz_id == quiz_id,
                    )
                )
                .values(position=index)
            )
        await self.db.flush()
        return True

    async def add_option(
        self, question_id: UUID, option_text: str, is_correct: bool = False
    ) -> QuizOption:
        option = QuizOption(
            question_id=question_id,
            option_text=option_text.strip(),
            is_correct=is_correct,
        )
        self.db.add(option)
        await self.db.flush()
        await self.db.refresh(option)
        return option

    async def get_option_by_id(self, option_id: UUID) -> Optional[QuizOption]:
        res = await self.db.execute(
            select(QuizOption).where(QuizOption.id == option_id)
        )
        return res.scalars().first()

    async def update_option(
        self, option: QuizOption, option_text: Optional[str] = None, is_correct: Optional[bool] = None
    ) -> QuizOption:
        if option_text is not None:
            option.option_text = option_text.strip()
        if is_correct is not None:
            option.is_correct = is_correct
        await self.db.flush()
        await self.db.refresh(option)
        return option

    async def delete_option(self, option_id: UUID) -> bool:
        opt = await self.get_option_by_id(option_id)
        if not opt:
            return False
        await self.db.delete(opt)
        await self.db.flush()
        return True

    # Attempt & Auto-Grading Operations
    async def count_user_attempts(self, user_id: UUID, quiz_id: UUID) -> int:
        res = await self.db.execute(
            select(func.count(QuizAttempt.id)).where(
                and_(QuizAttempt.user_id == user_id, QuizAttempt.quiz_id == quiz_id)
            )
        )
        return res.scalar_one()

    async def create_attempt(
        self, user_id: UUID, quiz_id: UUID, total_marks: int
    ) -> QuizAttempt:
        attempt = QuizAttempt(
            quiz_id=quiz_id,
            user_id=user_id,
            score=0,
            total_marks=total_marks,
            percentage=0.0,
            status=AttemptStatus.STARTED,
            started_at=datetime.now(timezone.utc),
        )
        self.db.add(attempt)
        await self.db.flush()
        await self.db.refresh(attempt)
        return attempt

    async def get_attempt_by_id(self, attempt_id: UUID) -> Optional[QuizAttempt]:
        res = await self.db.execute(
            select(QuizAttempt).where(QuizAttempt.id == attempt_id)
        )
        return res.scalars().first()

    async def list_user_attempts(
        self,
        user_id: UUID,
        quiz_id: Optional[UUID] = None,
        limit: int = 100,
    ) -> List[QuizAttempt]:
        # HIGH-12: Added quiz_id filter and limit to prevent unbounded queries
        conditions = [QuizAttempt.user_id == user_id]
        if quiz_id:
            conditions.append(QuizAttempt.quiz_id == quiz_id)
        res = await self.db.execute(
            select(QuizAttempt)
            .where(and_(*conditions))
            .order_by(QuizAttempt.started_at.desc())
            .limit(limit)
        )
        return list(res.scalars().all())

    async def evaluate_and_submit_attempt(
        self, attempt_id: UUID, answers: List[SubmitAnswerItem]
    ) -> QuizAttempt:
        attempt = await self.get_attempt_by_id(attempt_id)
        if not attempt:
            # MED-12: Use domain exception, not raw ValueError
            raise NotFoundException(
                message="Quiz attempt not found", error_code="ATTEMPT_NOT_FOUND"
            )

        questions = await self.list_questions(attempt.quiz_id)
        question_map = {q.id: q for q in questions}

        total_score = 0
        quiz_total_marks = sum(q.marks for q in questions)

        # HIGH-06: Bulk-load ALL relevant options in one query — eliminates N+1
        answer_option_ids = [item.option_id for item in answers if item.option_id]
        option_map: dict = {}
        if answer_option_ids:
            opts_res = await self.db.execute(
                select(QuizOption).where(QuizOption.id.in_(answer_option_ids))
            )
            option_map = {o.id: o for o in opts_res.scalars().all()}

        for item in answers:
            question = question_map.get(item.question_id)
            if not question:
                continue

            marks_awarded = 0

            if question.question_type in [QuestionType.MCQ, QuestionType.TRUE_FALSE, QuestionType.MULTIPLE]:
                if item.option_id:
                    # Use pre-loaded map — no extra DB round-trip
                    opt = option_map.get(item.option_id)
                    if opt and opt.is_correct and opt.question_id == question.id:
                        marks_awarded = question.marks

            total_score += marks_awarded

            answer = QuizAnswer(
                attempt_id=attempt_id,
                question_id=item.question_id,
                selected_option_id=item.option_id,
                text_answer=item.text_answer,
                marks_awarded=marks_awarded,
            )
            self.db.add(answer)

        percentage = round((total_score / quiz_total_marks) * 100.0, 2) if quiz_total_marks > 0 else 0.0

        attempt.score = total_score
        attempt.total_marks = quiz_total_marks
        attempt.percentage = percentage
        attempt.status = AttemptStatus.EVALUATED
        attempt.submitted_at = datetime.now(timezone.utc)

        await self.db.flush()
        await self.db.refresh(attempt)
        return attempt

    async def get_attempt_answers(self, attempt_id: UUID) -> List[QuizAnswer]:
        res = await self.db.execute(
            select(QuizAnswer).where(QuizAnswer.attempt_id == attempt_id)
        )
        return list(res.scalars().all())

    # Assignment Operations
    async def create_assignment(
        self,
        lesson_id: UUID,
        title: str,
        description: str,
        total_marks: int,
        due_date: datetime,
        allow_late_submission: bool = False,
        assessment_type: AssessmentType = AssessmentType.CODING_QUESTION,
        rubric_guidelines: Optional[str] = None,
        reference_solution: Optional[str] = None,
    ) -> Assignment:
        assignment = Assignment(
            lesson_id=lesson_id,
            title=title.strip(),
            description=description.strip(),
            assessment_type=assessment_type,
            rubric_guidelines=rubric_guidelines.strip() if rubric_guidelines else None,
            reference_solution=reference_solution.strip() if reference_solution else None,
            total_marks=total_marks,
            due_date=due_date,
            allow_late_submission=allow_late_submission,
            status=AssignmentStatus.DRAFT,
        )
        self.db.add(assignment)
        await self.db.flush()
        await self.db.refresh(assignment)
        return assignment

    async def get_assignment_by_id(self, assignment_id: UUID) -> Optional[Assignment]:
        res = await self.db.execute(
            select(Assignment).where(Assignment.id == assignment_id)
        )
        return res.scalars().first()

    async def list_assignments(self, lesson_id: UUID) -> List[Assignment]:
        res = await self.db.execute(
            select(Assignment)
            .where(Assignment.lesson_id == lesson_id)
            .order_by(Assignment.created_at.asc())
        )
        return list(res.scalars().all())

    async def update_assignment(
        self, assignment: Assignment, update_dict: dict
    ) -> Assignment:
        for k, v in update_dict.items():
            if v is not None:
                setattr(assignment, k, v)
        await self.db.flush()
        await self.db.refresh(assignment)
        return assignment

    async def delete_assignment(self, assignment_id: UUID) -> bool:
        assign = await self.get_assignment_by_id(assignment_id)
        if not assign:
            return False
        await self.db.delete(assign)
        await self.db.flush()
        return True

    # Submission Operations
    async def create_submission(
        self,
        assignment_id: UUID,
        student_id: UUID,
        file_id: Optional[UUID] = None,
        remarks: Optional[str] = None,
    ) -> AssignmentSubmission:
        res = await self.db.execute(
            select(AssignmentSubmission).where(
                and_(
                    AssignmentSubmission.assignment_id == assignment_id,
                    AssignmentSubmission.student_id == student_id,
                )
            )
        )
        sub = res.scalars().first()

        if not sub:
            sub = AssignmentSubmission(
                assignment_id=assignment_id,
                student_id=student_id,
                file_id=file_id,
                remarks=remarks,
                status=SubmissionStatus.SUBMITTED,
                submitted_at=datetime.now(timezone.utc),
            )
            self.db.add(sub)
        else:
            sub.file_id = file_id
            sub.remarks = remarks
            sub.status = SubmissionStatus.SUBMITTED
            sub.submitted_at = datetime.now(timezone.utc)

        await self.db.flush()
        await self.db.refresh(sub)
        return sub

    async def get_submission_by_id(self, submission_id: UUID) -> Optional[AssignmentSubmission]:
        res = await self.db.execute(
            select(AssignmentSubmission).where(AssignmentSubmission.id == submission_id)
        )
        return res.scalars().first()

    async def list_submissions(self, assignment_id: UUID) -> List[AssignmentSubmission]:
        res = await self.db.execute(
            select(AssignmentSubmission)
            .where(AssignmentSubmission.assignment_id == assignment_id)
            .order_by(AssignmentSubmission.submitted_at.desc())
        )
        return list(res.scalars().all())

    async def list_user_submissions(self, student_id: UUID) -> List[AssignmentSubmission]:
        res = await self.db.execute(
            select(AssignmentSubmission)
            .where(AssignmentSubmission.student_id == student_id)
            .order_by(AssignmentSubmission.submitted_at.desc())
        )
        return list(res.scalars().all())

    async def grade_submission(
        self, submission: AssignmentSubmission, marks: int, feedback: str
    ) -> AssignmentSubmission:
        submission.marks = marks
        submission.feedback = feedback.strip()
        submission.status = SubmissionStatus.GRADED
        submission.graded_at = datetime.now(timezone.utc)
        await self.db.flush()
        await self.db.refresh(submission)
        return submission

    async def review_submission(
        self, submission: AssignmentSubmission
    ) -> AssignmentSubmission:
        submission.status = SubmissionStatus.UNDER_REVIEW
        await self.db.flush()
        await self.db.refresh(submission)
        return submission

    # Statistics
    async def get_quiz_statistics(self, quiz_id: UUID) -> dict:
        quiz = await self.get_quiz_by_id(quiz_id)
        passing_marks = quiz.passing_marks if quiz else 0

        attempts_res = await self.db.execute(
            select(func.count(QuizAttempt.id)).where(QuizAttempt.quiz_id == quiz_id)
        )
        attempts = attempts_res.scalar_one()

        passed_res = await self.db.execute(
            select(func.count(QuizAttempt.id)).where(
                and_(QuizAttempt.quiz_id == quiz_id, QuizAttempt.score >= passing_marks)
            )
        )
        passed = passed_res.scalar_one()

        avg_score_res = await self.db.execute(
            select(func.coalesce(func.avg(QuizAttempt.score), 0.0)).where(
                QuizAttempt.quiz_id == quiz_id
            )
        )
        avg_score = round(avg_score_res.scalar_one(), 2)

        return {
            "attempts": attempts,
            "passed": passed,
            "failed": max(0, attempts - passed),
            "average_score": avg_score,
        }

    async def get_assignment_statistics(self, assignment_id: UUID) -> dict:
        submitted_res = await self.db.execute(
            select(func.count(AssignmentSubmission.id)).where(
                AssignmentSubmission.assignment_id == assignment_id
            )
        )
        submitted = submitted_res.scalar_one()

        graded_res = await self.db.execute(
            select(func.count(AssignmentSubmission.id)).where(
                and_(
                    AssignmentSubmission.assignment_id == assignment_id,
                    AssignmentSubmission.status == SubmissionStatus.GRADED,
                )
            )
        )
        graded = graded_res.scalar_one()

        avg_marks_res = await self.db.execute(
            select(func.coalesce(func.avg(AssignmentSubmission.marks), 0.0)).where(
                and_(
                    AssignmentSubmission.assignment_id == assignment_id,
                    AssignmentSubmission.status == SubmissionStatus.GRADED,
                )
            )
        )
        avg_marks = round(avg_marks_res.scalar_one(), 2)

        return {
            "submitted": submitted,
            "graded": graded,
            "pending": max(0, submitted - graded),
            "average_marks": avg_marks,
        }
