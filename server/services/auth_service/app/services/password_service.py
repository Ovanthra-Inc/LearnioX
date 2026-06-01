from app.utils.password import hash_password, verify_password


class PasswordService:
    @staticmethod
    def hash(password: str) -> str:
        return hash_password(password)

    @staticmethod
    def verify(plain_password: str, hashed_password: str) -> bool:
        return verify_password(plain_password, hashed_password)
