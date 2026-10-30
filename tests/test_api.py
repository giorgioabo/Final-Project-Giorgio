"""
Pruebas de la API. Ejecutar desde la raíz del proyecto con:  pytest -q
Cada ejecución usa una base de datos SQLite temporal.
"""
import importlib
import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "sqlite:///" + str(tmp_path / "test.db"))
    monkeypatch.setenv("JWT_SECRET_KEY", "test-secret")
    monkeypatch.setenv("ADMIN_EMAIL", "admin@test.dev")
    monkeypatch.setenv("ADMIN_PASSWORD", "admin-password")
    import app as app_module
    from api.models import db
    app_module = importlib.reload(app_module)
    app = app_module.app
    app.config["TESTING"] = True
    with app.app_context():
        yield app.test_client()
        db.session.remove()
        db.drop_all()


def register(client, email="ana@test.dev"):
    res = client.post("/api/auth/register", json={"name": "Ana", "email": email, "password": "password123"})
    return res.get_json()["token"]


def auth(token):
    return {"Authorization": f"Bearer {token}"}


ADDRESS = {"name": "Ana Pérez", "phone": "600123456", "street": "Calle Mayor 1", "city": "Madrid", "zip": "28013", "province": "Madrid"}


def test_health_and_seeded_catalog(client):
    health = client.get("/api/health").get_json()
    assert health["database"] == "ok"
    assert health["products"] == 24
    products = client.get("/api/products").get_json()
    assert products[0]["name"] == "Nova X1 Pro"
    assert products[0]["category"] == "smartphones"
    assert products[0]["colors"] and products[0]["art"]["kind"] == "phone"


def test_register_validates_input(client):
    assert client.post("/api/auth/register", json={"name": "A", "email": "x", "password": "1"}).status_code == 400
    register(client)
    dup = client.post("/api/auth/register", json={"name": "Ana", "email": "ANA@test.dev", "password": "password123"})
    assert dup.status_code == 400


def test_order_applies_pricing_and_reduces_stock(client):
    token = register(client)
    before = client.get("/api/products/8").get_json()["stock"]
    res = client.post("/api/orders", headers=auth(token), json={
        "items": [{"product_id": 8, "quantity": 2, "color": "Blanco"}],
        "shipping_address": ADDRESS, "coupon": "techdrop10",
    })
    assert res.status_code == 201
    order = res.get_json()
    assert order["subtotal"] == 398
    assert order["discount"] == 39.8
    assert order["shipping"] == 0
    assert order["total"] == 358.2
    assert order["coupon"] == "TECHDROP10"
    assert client.get("/api/products/8").get_json()["stock"] == before - 2
    assert len(client.get("/api/orders", headers=auth(token)).get_json()) == 1


def test_order_rejects_out_of_stock_and_bad_quantities(client):
    token = register(client)
    out = client.post("/api/orders", headers=auth(token), json={"items": [{"product_id": 9, "quantity": 1}], "shipping_address": ADDRESS})
    assert out.status_code == 400
    neg = client.post("/api/orders", headers=auth(token), json={"items": [{"product_id": 1, "quantity": -3}], "shipping_address": ADDRESS})
    assert neg.status_code == 400


def test_admin_endpoints_require_admin(client):
    token = register(client)
    assert client.get("/api/admin/orders", headers=auth(token)).status_code == 403
    assert client.post("/api/products", headers=auth(token), json={"name": "X", "price": 1}).status_code == 403

    admin = client.post("/api/auth/login", json={"email": "admin@test.dev", "password": "admin-password"}).get_json()["token"]
    created = client.post("/api/products", headers=auth(admin), json={"name": "Nuevo", "price": 10, "category": "audio", "art": {"kind": "speaker"}})
    assert created.status_code == 201
    assert created.get_json()["id"] == 25


def test_admin_can_save_product_as_sent_by_the_frontend(client):
    admin = client.post("/api/auth/login", json={"email": "admin@test.dev", "password": "admin-password"}).get_json()["token"]
    product = client.get("/api/products/4").get_json()
    # El panel envía el producto completo, con campos de solo lectura incluidos.
    payload = {**product, "categoryName": "Portátiles", "price": 1399, "stock": 3, "colors": [{"name": "Plata", "hex": "#ffffff"}]}
    res = client.put("/api/products/4", headers=auth(admin), json=payload)
    assert res.status_code == 200
    saved = res.get_json()
    assert saved["price"] == 1399 and saved["stock"] == 3
    assert saved["colors"][0]["hex"] == "#ffffff"
    assert saved["specs"] == product["specs"]


def test_cancelling_order_restores_stock(client):
    token = register(client)
    admin = client.post("/api/auth/login", json={"email": "admin@test.dev", "password": "admin-password"}).get_json()["token"]
    order = client.post("/api/orders", headers=auth(token), json={"items": [{"product_id": 1, "quantity": 1}], "shipping_address": ADDRESS}).get_json()
    stock = client.get("/api/products/1").get_json()["stock"]
    res = client.put(f"/api/admin/orders/{order['id']}", headers=auth(admin), json={"status": "cancelled"})
    assert res.status_code == 200
    assert client.get("/api/products/1").get_json()["stock"] == stock + 1
