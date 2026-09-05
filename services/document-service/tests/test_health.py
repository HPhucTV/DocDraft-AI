from starlette.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint_publicly_accessible():
    """Verify that /health is reachable without X-Internal-Secret header."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "document-service"
    assert "version" in data
    assert "chrome_available" in data
    assert "uptime_seconds" in data
