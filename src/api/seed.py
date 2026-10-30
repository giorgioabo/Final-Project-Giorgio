"""
Carga el catálogo propio (src/catalog/catalog.json) en la base de datos.
Se ejecuta al arrancar: si la base de datos está vacía (nueva, reiniciada o
recreada), la tienda vuelve a tener todos sus productos sin intervención manual.
"""
import json
import os

from api.models import db, Category, Product, User

CATALOG_PATH = os.path.join(os.path.dirname(__file__), "..", "catalog", "catalog.json")


def load_catalog():
    with open(CATALOG_PATH, encoding="utf-8") as f:
        return json.load(f)


def seed_catalog():
    if Product.query.first():
        return False
    data = load_catalog()
    by_slug = {}
    for c in data["categories"]:
        category = Category.query.filter_by(slug=c["slug"]).first()
        if not category:
            category = Category(name=c["name"], slug=c["slug"], tagline=c.get("tagline"))
            db.session.add(category)
        by_slug[c["slug"]] = category
    db.session.flush()

    for p in data["products"]:
        db.session.add(Product(
            id=p["id"],
            slug=p["slug"],
            name=p["name"],
            brand=p["brand"],
            description=p["description"],
            price=p["price"],
            compare_at_price=p.get("compare_at_price"),
            stock=p["stock"],
            rating=p.get("rating", 0),
            reviews_count=p.get("reviews_count", 0),
            badge=p.get("badge"),
            is_featured=p.get("is_featured", False),
            is_new=p.get("is_new", False),
            details={key: p.get(key) for key in Product.DETAIL_FIELDS},
            category_id=by_slug[p["category"]].id,
        ))
    db.session.commit()
    _sync_sequence()
    return True


def _sync_sequence():
    # En PostgreSQL insertamos ids explícitos: avanzamos la secuencia para los productos nuevos.
    if db.engine.dialect.name == "postgresql":
        db.session.execute(db.text(
            "SELECT setval(pg_get_serial_sequence('product', 'id'), (SELECT MAX(id) FROM product))"))
        db.session.commit()


def seed_admin(bcrypt):
    """Crea el administrador a partir de ADMIN_EMAIL / ADMIN_PASSWORD (nunca con credenciales fijas)."""
    email = (os.getenv("ADMIN_EMAIL") or "").strip().lower()
    password = os.getenv("ADMIN_PASSWORD") or ""
    if not email or len(password) < 8:
        return False
    user = User.query.filter_by(email=email).first()
    if user:
        if not user.is_admin:
            user.is_admin = True
            db.session.commit()
        return False
    db.session.add(User(
        email=email,
        name=os.getenv("ADMIN_NAME", "Administrador"),
        password=bcrypt.generate_password_hash(password).decode("utf-8"),
        is_admin=True,
    ))
    db.session.commit()
    return True
