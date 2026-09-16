from typing import Any, List, Optional


class AIServiceException(Exception):
    """Base exception for AI Microservice."""

    def __init__(
        self,
        message: str,
        code: str = "AI_SERVICE_ERROR",
        details: Optional[List[Any]] = None,
        status_code: int = 500,
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.details = details or []
        self.status_code = status_code


class AIProviderException(AIServiceException):
    """Raised when upstream LLM/Transcription providers (Gemini, Whisper) fail."""

    def __init__(
        self,
        message: str,
        provider: str = "unknown",
        details: Optional[List[Any]] = None,
    ):
        super().__init__(
            message=f"AI Provider '{provider}' error: {message}",
            code="AI_PROVIDER_ERROR",
            details=details,
            status_code=502,
        )


class ValidationException(AIServiceException):
    """Raised when input parameters or media files fail validation."""

    def __init__(self, message: str, details: Optional[List[Any]] = None):
        super().__init__(
            message=message,
            code="VALIDATION_ERROR",
            details=details,
            status_code=400,
        )


class ResourceNotFoundException(AIServiceException):
    """Raised when an AI job or media asset is not found."""

    def __init__(self, message: str, resource_id: Optional[str] = None):
        super().__init__(
            message=message,
            code="NOT_FOUND",
            details=[{"resource_id": resource_id}] if resource_id else [],
            status_code=404,
        )


class RateLimitExceededException(AIServiceException):
    """Raised when user exceeds AI token/generation request quota."""

    def __init__(self, message: str = "AI generation rate limit exceeded"):
        super().__init__(
            message=message,
            code="RATE_LIMIT_EXCEEDED",
            status_code=429,
        )
