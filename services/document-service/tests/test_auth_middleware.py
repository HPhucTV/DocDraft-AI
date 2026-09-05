from starlette.testclient import TestClient
from app.main import app
from app.config import settings

client = TestClient(app)


def test_protected_endpoint_without_secret_returns_403():
    """Endpoints other than public paths must return 403 when header is missing."""
    payload = {
        "draft_id": "test-123",
        "title": "Văn bản thử nghiệm",
        "content_json": {"type": "doc", "content": []},
    }
    response = client.post("/export/docx", json=payload)
    assert response.status_code == 403
    assert "Invalid or missing X-Internal-Secret" in response.json()["detail"]


def test_protected_endpoint_with_invalid_secret_returns_403():
    """Endpoints must reject requests with wrong secret."""
    payload = {
        "draft_id": "test-123",
        "title": "Văn bản thử nghiệm",
        "content_json": {"type": "doc", "content": []},
    }
    response = client.post(
        "/export/docx",
        json=payload,
        headers={"X-Internal-Secret": "invalid_wrong_secret_123"},
    )
    assert response.status_code == 403
    assert response.json()["error"] == "Forbidden"


def test_protected_endpoint_with_valid_secret_succeeds():
    """Endpoints accept requests with correct X-Internal-Secret."""
    payload = {
        "draft_id": "test-123",
        "title": "Văn bản thử nghiệm",
        "content_json": {"type": "doc", "content": []},
    }
    response = client.post(
        "/export/docx",
        json=payload,
        headers={"X-Internal-Secret": settings.INTERNAL_SECRET_KEY},
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == (
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
    assert len(response.content) > 0


def test_openapi_documentation_paths_bypass_secret():
    """OpenAPI JSON and documentation must be accessible without secret."""
    response = client.get("/openapi.json")
    assert response.status_code == 200
