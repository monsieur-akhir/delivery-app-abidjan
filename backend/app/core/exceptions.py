from fastapi import HTTPException, status

class NotFoundError(HTTPException):
    def __init__(self, detail: str = "Ressource non trouvée"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)

class ForbiddenError(HTTPException):
    def __init__(self, detail: str = "Accès interdit"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)

class BadRequestError(HTTPException):
    def __init__(self, detail: str = "Requête invalide"):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)

class UnauthorizedError(HTTPException):
    def __init__(self, detail: str = "Non autorisé"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )

class ConflictError(HTTPException):
    def __init__(self, detail: str = "Conflit de ressources"):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail)

class PaymentRequiredError(HTTPException):
    def __init__(self, detail: str = "Paiement requis"):
        super().__init__(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail=detail)
