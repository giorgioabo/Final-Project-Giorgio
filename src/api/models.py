from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import String, Boolean, Float, Integer, ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone

db = SQLAlchemy()


class User(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(
        String(120), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean(), default=True)
    is_admin: Mapped[bool] = mapped_column(Boolean(), default=False)
    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc))

    orders: Mapped[list["Order"]] = relationship(
        back_populates="user", cascade="all, delete-orphan")

    def serialize(self):
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "is_admin": self.is_admin,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Category(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    tagline: Mapped[str] = mapped_column(String(200), nullable=True)

    products: Mapped[list["Product"]] = relationship(back_populates="category")

    def serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "tagline": self.tagline,
        }


class Product(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(200), nullable=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    brand: Mapped[str] = mapped_column(String(80), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    compare_at_price: Mapped[float] = mapped_column(Float, nullable=True)
    stock: Mapped[int] = mapped_column(Integer, default=0)
    rating: Mapped[float] = mapped_column(Float, default=0)
    reviews_count: Mapped[int] = mapped_column(Integer, default=0)
    badge: Mapped[str] = mapped_column(String(40), nullable=True)
    is_featured: Mapped[bool] = mapped_column(Boolean(), default=False)
    is_new: Mapped[bool] = mapped_column(Boolean(), default=False)
    # Contenido enriquecido: resumen, características, especificaciones, colores,
    # versiones e ilustración. Se guarda como JSON para no multiplicar tablas.
    details: Mapped[dict] = mapped_column(JSON, default=dict)
    category_id: Mapped[int] = mapped_column(
        ForeignKey("category.id"), nullable=True)

    category: Mapped["Category"] = relationship(back_populates="products")
    order_items: Mapped[list["OrderItem"]] = relationship(
        back_populates="product")

    DETAIL_FIELDS = ("short", "features", "specs", "colors", "options", "art")

    def serialize(self):
        details = self.details or {}
        return {
            "id": self.id,
            "slug": self.slug,
            "name": self.name,
            "brand": self.brand,
            "description": self.description,
            "price": self.price,
            "compare_at_price": self.compare_at_price,
            "stock": self.stock,
            "rating": self.rating,
            "reviews_count": self.reviews_count,
            "badge": self.badge,
            "is_featured": self.is_featured,
            "is_new": self.is_new,
            "category": self.category.slug if self.category else None,
            **{key: details.get(key) for key in self.DETAIL_FIELDS if details.get(key) is not None},
        }


class Order(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc))
    subtotal: Mapped[float] = mapped_column(Float, default=0)
    discount: Mapped[float] = mapped_column(Float, default=0)
    shipping: Mapped[float] = mapped_column(Float, default=0)
    total: Mapped[float] = mapped_column(Float, nullable=False)
    coupon: Mapped[str] = mapped_column(String(40), nullable=True)
    shipping_method: Mapped[str] = mapped_column(String(20), default="standard")
    shipping_address: Mapped[dict] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="paid")
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"), nullable=False)

    user: Mapped["User"] = relationship(back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order", cascade="all, delete-orphan")

    def serialize(self):
        return {
            "id": self.id,
            "created_at": self.created_at.isoformat(),
            "subtotal": self.subtotal,
            "discount": self.discount,
            "shipping": self.shipping,
            "total": self.total,
            "coupon": self.coupon,
            "shipping_method": self.shipping_method,
            "shipping_address": self.shipping_address,
            "status": self.status,
            "user": {"id": self.user.id, "name": self.user.name, "email": self.user.email},
            "items": [item.serialize() for item in self.items],
        }


class OrderItem(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[float] = mapped_column(Float, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=True)
    color: Mapped[str] = mapped_column(String(80), nullable=True)
    option: Mapped[str] = mapped_column(String(80), nullable=True)
    product_id: Mapped[int] = mapped_column(
        ForeignKey("product.id"), nullable=True)
    order_id: Mapped[int] = mapped_column(
        ForeignKey("order.id"), nullable=False)

    product: Mapped["Product"] = relationship(back_populates="order_items")
    order: Mapped["Order"] = relationship(back_populates="items")

    def serialize(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "name": self.name,
            "color": self.color,
            "option": self.option,
            "quantity": self.quantity,
            "unit_price": self.unit_price,
            "product": self.product.serialize() if self.product else None,
        }
