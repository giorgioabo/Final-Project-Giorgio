import { cloneElement, useEffect, useId, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Lock, Loader2, Info } from "lucide-react";
import useGlobalReducer, { useCartLines } from "../hooks/useGlobalReducer";
import ProductArt from "../components/ProductArt";
import { CouponBox, Summary } from "./Cart";
import { usePageTitle } from "../components/ui";
import { api } from "../lib/api";
import { computeTotals, money, SHIPPING_COST, EXPRESS_COST, FREE_SHIPPING_FROM } from "../lib/pricing";
import { load, save } from "../lib/storage";

const STEPS = ["Envío", "Pago", "Confirmación"];

// Validación de tarjeta con el algoritmo de Luhn (modo demo: no se cobra nada).
function luhn(num) {
    const digits = num.replace(/\D/g, "");
    if (digits.length < 13) return false;
    let sum = 0;
    for (let i = 0; i < digits.length; i++) {
        let d = Number(digits[digits.length - 1 - i]);
        if (i % 2) { d *= 2; if (d > 9) d -= 9; }
        sum += d;
    }
    return sum % 10 === 0;
}

function Field({ label, error, children, full }) {
    const id = useId();
    return (
        <div className={`field ${full ? "full" : ""}`}>
            <label htmlFor={id}>{label}</label>
            {cloneElement(children, { id, "aria-invalid": Boolean(error) })}
            {error && <span className="error">{error}</span>}
        </div>
    );
}

export default function Checkout() {
    usePageTitle("Finalizar compra");
    const { store, dispatch, actions } = useGlobalReducer();
    const lines = useCartLines();
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [coupon, setCoupon] = useState(() => load("td_coupon", null));
    const [method, setMethod] = useState("standard");
    const [address, setAddress] = useState(() => load("td_address", { name: store.user?.name || "", phone: "", street: "", city: "", zip: "", province: "" }));
    const [card, setCard] = useState({ number: "", name: "", exp: "", cvc: "" });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [serverError, setServerError] = useState(null);

    const totals = computeTotals(lines, { coupon, shipping: method });

    useEffect(() => {
        if (!store.user && store.mode) navigate("/login?next=/checkout", { replace: true });
    }, [store.user, store.mode]);

    if (lines.length === 0) {
        return (
            <div className="container empty" style={{ minHeight: "60vh" }}>
                <h1 className="h3">No hay nada que pagar todavía</h1>
                <Link to="/catalog" className="btn btn-primary">Ir a la tienda</Link>
            </div>
        );
    }

    const setA = k => e => setAddress(a => ({ ...a, [k]: e.target.value }));
    const setC = k => e => {
        let v = e.target.value;
        if (k === "number") v = v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
        if (k === "exp") v = v.replace(/\D/g, "").slice(0, 4).replace(/^(\d{2})(\d)/, "$1/$2");
        if (k === "cvc") v = v.replace(/\D/g, "").slice(0, 4);
        setCard(c => ({ ...c, [k]: v }));
    };

    const validateAddress = () => {
        const e = {};
        if (address.name.trim().length < 3) e.name = "Escribe tu nombre completo";
        if (!/^[+\d\s]{9,15}$/.test(address.phone.trim())) e.phone = "Teléfono no válido";
        if (address.street.trim().length < 5) e.street = "Escribe la dirección";
        if (address.city.trim().length < 2) e.city = "Escribe la ciudad";
        if (!/^\d{5}$/.test(address.zip.trim())) e.zip = "Código postal de 5 dígitos";
        if (address.province.trim().length < 2) e.province = "Escribe la provincia";
        setErrors(e);
        return !Object.keys(e).length;
    };

    const validateCard = () => {
        const e = {};
        if (!luhn(card.number)) e.number = "Número de tarjeta no válido";
        if (card.name.trim().length < 3) e.cname = "Nombre del titular";
        const [mm, yy] = card.exp.split("/").map(Number);
        const now = new Date();
        if (!mm || mm > 12 || !yy || new Date(2000 + yy, mm) <= now) e.exp = "Fecha no válida";
        if (!/^\d{3,4}$/.test(card.cvc)) e.cvc = "CVC no válido";
        setErrors(e);
        return !Object.keys(e).length;
    };

    const next = e => {
        e.preventDefault();
        if (validateAddress()) { save("td_address", address); setStep(1); window.scrollTo({ top: 0, behavior: "smooth" }); }
    };

    const pay = async e => {
        e.preventDefault();
        if (!validateCard()) return;
        setSubmitting(true);
        setServerError(null);
        try {
            const order = await api.createOrder({
                items: lines.map(l => ({ product_id: l.product_id, quantity: l.quantity, color: l.color, option: l.option })),
                shipping: address,
                coupon: totals.coupon,
                shippingMethod: method,
            });
            dispatch({ type: "CLEAR_CART" });
            save("td_coupon", null);
            // Refrescamos el stock tras la compra.
            api.products().then(p => dispatch({ type: "SET_PRODUCTS", payload: p })).catch(() => {});
            save("td_last_order", order);
            navigate(`/order-confirmation/${order.id}`, { replace: true });
        } catch (err) {
            setServerError(err.message);
            actions.toast(err.message, "danger");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="container" style={{ paddingTop: 40 }}>
            <div className="steps" aria-label="Progreso">
                {STEPS.map((s, i) => (
                    <span key={s} style={{ display: "contents" }}>
                        {i > 0 && <span className="step-sep" />}
                        <span className={`step ${i === step ? "active" : ""} ${i < step ? "done" : ""}`}>
                            <span className="n">{i < step ? <Check size={14} /> : i + 1}</span>{s}
                        </span>
                    </span>
                ))}
            </div>

            <div className="two-col">
                <div className="card card-pad">
                    {step === 0 && (
                        <form onSubmit={next} className="stack" style={{ gap: 24 }} noValidate>
                            <h1 className="h3" style={{ fontSize: 26 }}>Dirección de envío</h1>
                            <div className="form-grid">
                                <Field label="Nombre completo" error={errors.name}><input className={`input ${errors.name ? "invalid" : ""}`} value={address.name} onChange={setA("name")} autoComplete="name" /></Field>
                                <Field label="Teléfono" error={errors.phone}><input className={`input ${errors.phone ? "invalid" : ""}`} value={address.phone} onChange={setA("phone")} autoComplete="tel" placeholder="600 123 456" /></Field>
                                <Field label="Dirección" error={errors.street} full><input className={`input ${errors.street ? "invalid" : ""}`} value={address.street} onChange={setA("street")} autoComplete="street-address" placeholder="Calle, número, piso" /></Field>
                                <Field label="Ciudad" error={errors.city}><input className={`input ${errors.city ? "invalid" : ""}`} value={address.city} onChange={setA("city")} autoComplete="address-level2" /></Field>
                                <Field label="Código postal" error={errors.zip}><input className={`input ${errors.zip ? "invalid" : ""}`} value={address.zip} onChange={setA("zip")} autoComplete="postal-code" inputMode="numeric" /></Field>
                                <Field label="Provincia" error={errors.province} full><input className={`input ${errors.province ? "invalid" : ""}`} value={address.province} onChange={setA("province")} autoComplete="address-level1" /></Field>
                            </div>
                            <div className="stack" style={{ gap: 10 }}>
                                <h2 className="h3" style={{ fontSize: 18 }}>Método de envío</h2>
                                <label className={`radio-card ${method === "standard" ? "active" : ""}`}>
                                    <input type="radio" name="ship" checked={method === "standard"} onChange={() => setMethod("standard")} />
                                    <span style={{ flex: 1 }}><strong className="small" style={{ display: "block" }}>Estándar · 24-48 h</strong><span className="tiny muted">Gratis desde {FREE_SHIPPING_FROM} €</span></span>
                                    <strong className="small">{totals.subtotal - totals.discount >= FREE_SHIPPING_FROM ? "Gratis" : money(SHIPPING_COST)}</strong>
                                </label>
                                <label className={`radio-card ${method === "express" ? "active" : ""}`}>
                                    <input type="radio" name="ship" checked={method === "express"} onChange={() => setMethod("express")} />
                                    <span style={{ flex: 1 }}><strong className="small" style={{ display: "block" }}>Express · Mañana antes de las 14:00</strong><span className="tiny muted">Pedidos realizados antes de las 18:00</span></span>
                                    <strong className="small">{money(EXPRESS_COST)}</strong>
                                </label>
                            </div>
                            <button className="btn btn-primary btn-lg" type="submit">Continuar al pago</button>
                        </form>
                    )}

                    {step === 1 && (
                        <form onSubmit={pay} className="stack" style={{ gap: 24 }} noValidate>
                            <div className="row-between">
                                <h1 className="h3" style={{ fontSize: 26 }}>Pago</h1>
                                <button type="button" className="link-btn" onClick={() => setStep(0)}>Editar envío</button>
                            </div>
                            <div className="demo-banner"><Info size={16} /> Pago de demostración: no se realiza ningún cargo. Usa la tarjeta de prueba 4242 4242 4242 4242.</div>
                            <div className="card-preview" aria-hidden>
                                <div className="row-between"><span className="chip-gold" /><strong style={{ fontFamily: "var(--display)" }}>TechDrop Pay</strong></div>
                                <span className="num">{card.number || "•••• •••• •••• ••••"}</span>
                                <div className="row-between tiny"><span>{card.name.toUpperCase() || "NOMBRE DEL TITULAR"}</span><span>{card.exp || "MM/AA"}</span></div>
                            </div>
                            <div className="form-grid">
                                <Field label="Número de tarjeta" error={errors.number} full><input className={`input ${errors.number ? "invalid" : ""}`} value={card.number} onChange={setC("number")} inputMode="numeric" autoComplete="cc-number" placeholder="1234 5678 9012 3456" /></Field>
                                <Field label="Titular" error={errors.cname} full><input className={`input ${errors.cname ? "invalid" : ""}`} value={card.name} onChange={setC("name")} autoComplete="cc-name" /></Field>
                                <Field label="Caducidad" error={errors.exp}><input className={`input ${errors.exp ? "invalid" : ""}`} value={card.exp} onChange={setC("exp")} inputMode="numeric" autoComplete="cc-exp" placeholder="MM/AA" /></Field>
                                <Field label="CVC" error={errors.cvc}><input className={`input ${errors.cvc ? "invalid" : ""}`} value={card.cvc} onChange={setC("cvc")} inputMode="numeric" autoComplete="cc-csc" placeholder="123" /></Field>
                            </div>
                            {serverError && <div className="alert alert-danger">{serverError}</div>}
                            <button className="btn btn-accent btn-lg" type="submit" disabled={submitting}>
                                {submitting ? <><Loader2 size={18} className="spin" /> Procesando…</> : <><Lock size={16} /> Pagar {money(totals.total)}</>}
                            </button>
                        </form>
                    )}
                </div>

                <aside className="card card-pad sticky-card stack">
                    <h2 className="h3">Tu pedido</h2>
                    <div className="stack" style={{ gap: 12 }}>
                        {lines.map(l => (
                            <div key={l.key} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                <div style={{ width: 56, height: 56, borderRadius: 12, overflow: "hidden", position: "relative", flex: "none" }}>
                                    <ProductArt product={l.product} color={l.product.colors.find(c => c.name === l.color)?.hex} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <strong className="small" style={{ display: "block" }}>{l.product.name}</strong>
                                    <span className="tiny muted">{l.quantity} × {money(l.price)}</span>
                                </div>
                                <strong className="small mono">{money(l.price * l.quantity)}</strong>
                            </div>
                        ))}
                    </div>
                    <CouponBox subtotal={totals.subtotal} coupon={totals.coupon} onChange={c => { setCoupon(c); save("td_coupon", c); }} />
                    <Summary totals={totals} />
                </aside>
            </div>
        </div>
    );
}
