"""
Reglas de precios. Deben coincidir con src/front/lib/pricing.js.
"""

FREE_SHIPPING_FROM = 99
SHIPPING_COST = 4.99
EXPRESS_COST = 9.99

COUPONS = {
    "TECHDROP10": {"type": "percent", "value": 10},
    "BIENVENIDA": {"type": "fixed", "value": 15, "min": 100},
}


def _round(n):
    return round(n + 1e-9, 2)


def compute_totals(lines, coupon=None, shipping_method="standard"):
    """lines: lista de (precio_unitario, cantidad)."""
    subtotal = _round(sum(price * qty for price, qty in lines))
    applied = None
    discount = 0.0
    if coupon:
        rule = COUPONS.get(coupon.strip().upper())
        if rule and subtotal >= rule.get("min", 0):
            applied = coupon.strip().upper()
            discount = subtotal * rule["value"] / 100 if rule["type"] == "percent" else rule["value"]
    discount = _round(min(discount, subtotal))
    after = subtotal - discount
    if not lines:
        shipping = 0.0
    elif shipping_method == "express":
        shipping = EXPRESS_COST
    else:
        shipping = 0.0 if after >= FREE_SHIPPING_FROM else SHIPPING_COST
    return {
        "subtotal": subtotal,
        "discount": discount,
        "shipping": shipping,
        "total": _round(after + shipping),
        "coupon": applied,
    }
