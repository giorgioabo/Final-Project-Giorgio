// Reglas de precios compartidas por el carrito, el checkout y el modo local.
// El backend aplica exactamente las mismas reglas en src/api/pricing.py.

export const FREE_SHIPPING_FROM = 99;
export const SHIPPING_COST = 4.99;
export const EXPRESS_COST = 9.99;
export const VAT_RATE = 0.21;

export const COUPONS = {
    TECHDROP10: { label: "10% de descuento", type: "percent", value: 10 },
    BIENVENIDA: { label: "15 € de descuento en pedidos de +100 €", type: "fixed", value: 15, min: 100 },
};

const round = n => Math.round(n * 100) / 100;

export function validateCoupon(code, subtotal) {
    if (!code) return null;
    const coupon = COUPONS[code.trim().toUpperCase()];
    if (!coupon) return { error: "Este cupón no existe" };
    if (coupon.min && subtotal < coupon.min) return { error: `Válido en pedidos desde ${coupon.min} €` };
    return { code: code.trim().toUpperCase(), ...coupon };
}

export function computeTotals(lines, { coupon, shipping = "standard" } = {}) {
    const subtotal = round(lines.reduce((sum, l) => sum + l.price * l.quantity, 0));
    const valid = coupon ? validateCoupon(coupon, subtotal) : null;
    let discount = 0;
    if (valid && !valid.error) {
        discount = valid.type === "percent" ? subtotal * valid.value / 100 : valid.value;
    }
    discount = round(Math.min(discount, subtotal));
    const afterDiscount = subtotal - discount;
    let shippingCost = 0;
    if (lines.length) {
        if (shipping === "express") shippingCost = EXPRESS_COST;
        else shippingCost = afterDiscount >= FREE_SHIPPING_FROM ? 0 : SHIPPING_COST;
    }
    const total = round(afterDiscount + shippingCost);
    const vat = round(total - total / (1 + VAT_RATE));
    return { subtotal, discount, shipping: shippingCost, total, vat, coupon: valid && !valid.error ? valid.code : null };
}

// "1.099 €" para importes redondos y "4,99 €" cuando hay céntimos.
const eurWhole = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0, useGrouping: "always" });
const eurCents = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2, useGrouping: "always" });
export const money = n => {
    const v = round(n || 0);
    return (Number.isInteger(v) ? eurWhole : eurCents).format(v);
};
