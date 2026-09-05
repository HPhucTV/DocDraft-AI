from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from .config import settings

# Paths that do not require internal secret authentication
PUBLIC_PATHS = {
    "/health",
    "/docs",
    "/redoc",
    "/openapi.json",
    "/favicon.ico",
}


class InternalSecretMiddleware(BaseHTTPMiddleware):
    """
    Middleware verifying the X-Internal-Secret token on every internal request.
    Blocks any unauthorized or external access with HTTP 403 Forbidden.
    """

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        path = request.url.path

        # Allow public health check and OpenAPI documentation endpoints
        if path in PUBLIC_PATHS or path.startswith("/docs") or path.startswith("/static"):
            return await call_next(request)

        secret = request.headers.get("X-Internal-Secret")
        if not secret or secret != settings.INTERNAL_SECRET_KEY:
            return JSONResponse(
                status_code=403,
                content={
                    "error": "Forbidden",
                    "detail": "Invalid or missing X-Internal-Secret header. Internal access only.",
                },
            )

        return await call_next(request)
