"""
Endpoints de la API de TechDrop.
"""
import re
import time
from collections import defaultdict, deque
from functools import wraps

from flask import request, jsonify, Blueprint
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from flask_bcrypt import Bcrypt

from api.models import db, User, Product, Category, Order, OrderItem
from api.pricing import compute_totals

api = Blueprint('api', __name__)
bcrypt = Bcrypt()

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
ORDER_STATUSES = {"paid", "processing", "shipped", "delivered", "cancelled"}


def error(message, status=400):
    return jsonify({"error": message}), status


def body():
    return request.get_json(silent=True) or {}


# Limitador sencillo en memoria para frenar ataques de fuerza bruta al login.
_attempts = defaultdict(deque)


def rate_limited(key, limit=10, window=300):
    now = time.time()
    hits = _attempts[key]
    while hits and hits[0] < now - window:
        hits.popleft()
    if len(hits) >= limit:
        return True
    hits.append(now)
    return False


def current_user():
    return db.session.get(User, int(get_jwt_identity()))


def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user = current_user()
        if not user or not user.is_admin:
            return error("Solo administradores", 403)
        return fn(*args, **kwargs)
    return wrapper


# ─────────────────────────────────────────
# HEALTH
# ─────────────────────────────────────────

@api.route('/health', methods=['GET'])
def health():
    try:
        db.session.execute(db.text("SELECT 1"))
        return jsonify({"status": "ok", "database": "ok", "products": Product.query.count()}), 200
    except Exception:
        db.session.rollback()
        return jsonify({"status": "degraded", "database": "error"}), 503


# ─────────────────────────────────────────
# AUTH
# ─────────────────────────────────────────

@api.route('/auth/register', methods=['POST'])
def register():
    data = body()
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if len(name) < 2:
        return error("Escribe tu nombre")
    if not EMAIL_RE.match(email):
        return error("Email no válido")
    if len(password) < 8:
        return error("La contraseña debe tener al menos 8 caracteres")
    if User.query.filter_by(email=email).first():
        return error("Ya existe una cuenta con este email")

    user = User(email=email, name=name[:100],
                password=bcrypt.generate_password_hash(password).decode('utf-8'))
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.serialize()}), 201


@api.route('/auth/login', methods=['POST'])
def login():
    data = body()
    email = (data.get('email') or '').strip().lower()
    if rate_limited(f"login:{request.remote_addr}:{email}"):
        return error("Demasiados intentos. Espera unos minutos.", 429)

    user = User.query.filter_by(email=email).first()
    if not user or not user.is_active or not bcrypt.check_password_hash(user.password, data.get('password') or ''):
        return error("Email o contraseña incorrectos", 401)

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.serialize()}), 200


@api.route('/auth/me', methods=['GET'])
@jwt_required()
def me():
    user = current_user()
    if not user:
        return error("Usuario no encontrado", 404)
    return jsonify(user.serialize()), 200


# ─────────────────────────────────────────
# CATALOG
# ─────────────────────────────────────────

@api.route('/categories', methods=['GET'])
def get_categories():
    return jsonify([c.serialize() for c in Category.query.order_by(Category.id).all()]), 200


@api.route('/products', methods=['GET'])
def get_products():
    query = Product.query
    category = request.args.get('category')
    if category:
        query = query.join(Category).filter(Category.slug == category)
    if request.args.get('featured') == 'true':
        query = query.filter_by(is_featured=True)
    q = (request.args.get('q') or '').strip()
    if q:
        like = f"%{q}%"
        query = query.filter(db.or_(Product.name.ilike(like), Product.brand.ilike(like)))
    return jsonify([p.serialize() for p in query.order_by(Product.id).all()]), 200


@api.route('/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    product = db.session.get(Product, product_id)
    if not product:
        return error("Producto no encontrado", 404)
    return jsonify(product.serialize()), 200


def apply_product_data(product, data):
    if 'name' in data:
        name = (data.get('name') or '').strip()
        if not name:
            raise ValueError("El nombre es obligatorio")
        product.name = name[:200]
    if 'price' in data:
        price = float(data['price'])
        if price <= 0:
            raise ValueError("El precio debe ser mayor que 0")
        product.price = price
    if 'compare_at_price' in data:
        cap = data.get('compare_at_price')
        product.compare_at_price = float(cap) if cap not in (None, "") else None
    if 'stock' in data:
        stock = int(data['stock'])
        if stock < 0:
            raise ValueError("El stock no puede ser negativo")
        product.stock = stock
    for field in ('slug', 'brand', 'description', 'badge'):
        if field in data:
            setattr(product, field, data[field])
    for field in ('is_featured', 'is_new'):
        if field in data:
            setattr(product, field, bool(data[field]))
    for field in ('rating', 'reviews_count'):
        if field in data and data[field] is not None:
            setattr(product, field, data[field])
    if 'category' in data:
        category = Category.query.filter_by(slug=data['category']).first()
        if not category:
            raise ValueError("Categoría no válida")
        product.category_id = category.id
    details = dict(product.details or {})
    for key in Product.DETAIL_FIELDS:
        if key in data:
            details[key] = data[key]
    product.details = details


@api.route('/products', methods=['POST'])
@admin_required
def create_product():
    product = Product()
    try:
        data = body()
        if 'name' not in data or 'price' not in data:
            raise ValueError("Nombre y precio son obligatorios")
        apply_product_data(product, data)
    except (ValueError, TypeError) as e:
        return error(str(e))
    db.session.add(product)
    db.session.commit()
    return jsonify(product.serialize()), 201


@api.route('/products/<int:product_id>', methods=['PUT'])
@admin_required
def update_product(product_id):
    product = db.session.get(Product, product_id)
    if not product:
        return error("Producto no encontrado", 404)
    try:
        apply_product_data(product, body())
    except (ValueError, TypeError) as e:
        db.session.rollback()
        return error(str(e))
    db.session.commit()
    return jsonify(product.serialize()), 200


@api.route('/products/<int:product_id>', methods=['DELETE'])
@admin_required
def delete_product(product_id):
    product = db.session.get(Product, product_id)
    if not product:
        return error("Producto no encontrado", 404)
    # Los pedidos antiguos conservan nombre y precio aunque el producto desaparezca.
    OrderItem.query.filter_by(product_id=product.id).update({"product_id": None})
    db.session.delete(product)
    db.session.commit()
    return jsonify({"message": "Producto eliminado"}), 200


# ─────────────────────────────────────────
# ORDERS
# ─────────────────────────────────────────

@api.route('/orders', methods=['POST'])
@jwt_required()
def create_order():
    user = current_user()
    data = body()
    items = data.get('items') or []
    address = data.get('shipping_address') or {}

    if not isinstance(items, list) or not items:
        return error("El carrito está vacío")
    for field in ('name', 'street', 'city', 'zip'):
        if not str(address.get(field) or '').strip():
            return error("La dirección de envío está incompleta")

    lines = []
    for item in items:
        try:
            quantity = int(item.get('quantity', 0))
            product_id = int(item.get('product_id'))
        except (TypeError, ValueError):
            return error("Producto no válido")
        if quantity < 1 or quantity > 99:
            return error("Cantidad no válida")
        # Bloqueamos la fila para que dos compras simultáneas no vendan el mismo stock.
        product = db.session.query(Product).filter_by(id=product_id).with_for_update().first()
        if not product:
            return error("Un producto del carrito ya no existe")
        if product.stock < quantity:
            db.session.rollback()
            return error(f"Solo quedan {product.stock} unidades de {product.name}")
        lines.append((product, quantity, item))

    totals = compute_totals([(p.price, q) for p, q, _ in lines],
                            coupon=data.get('coupon'),
                            shipping_method=data.get('shipping_method', 'standard'))

    order = Order(
        user_id=user.id,
        status="paid",
        shipping_method="express" if data.get('shipping_method') == "express" else "standard",
        shipping_address={k: str(address.get(k, ''))[:200] for k in ('name', 'phone', 'street', 'city', 'zip', 'province')},
        **totals,
    )
    db.session.add(order)
    db.session.flush()

    for product, quantity, item in lines:
        db.session.add(OrderItem(
            order_id=order.id,
            product_id=product.id,
            name=product.name,
            color=(item.get('color') or None),
            option=(item.get('option') or None),
            quantity=quantity,
            unit_price=product.price,
        ))
        product.stock -= quantity

    db.session.commit()
    return jsonify(order.serialize()), 201


@api.route('/orders', methods=['GET'])
@jwt_required()
def get_orders():
    orders = Order.query.filter_by(user_id=int(get_jwt_identity())).order_by(Order.created_at.desc()).all()
    return jsonify([o.serialize() for o in orders]), 200


# ─────────────────────────────────────────
# ADMIN
# ─────────────────────────────────────────

@api.route('/admin/orders', methods=['GET'])
@admin_required
def admin_orders():
    orders = Order.query.order_by(Order.created_at.desc()).all()
    return jsonify([o.serialize() for o in orders]), 200


@api.route('/admin/orders/<int:order_id>', methods=['PUT'])
@admin_required
def admin_update_order(order_id):
    order = db.session.get(Order, order_id)
    if not order:
        return error("Pedido no encontrado", 404)
    status = body().get('status')
    if status not in ORDER_STATUSES:
        return error("Estado no válido")
    if status == "cancelled" and order.status != "cancelled":
        # Devolvemos el stock al cancelar.
        for item in order.items:
            if item.product:
                item.product.stock += item.quantity
    order.status = status
    db.session.commit()
    return jsonify(order.serialize()), 200


@api.route('/admin/users', methods=['GET'])
@admin_required
def get_users():
    return jsonify([u.serialize() for u in User.query.order_by(User.id).all()]), 200
