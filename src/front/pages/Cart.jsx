import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Tag, Lock, ArrowLeft } from "lucide-react";
import { useCartLines } from "../hooks/useGlobalReducer";
import { CartLine, ShippingProgress } from "../components/CartDrawer";
import { Breadcrumbs, usePageTitle } from "../components/ui";
import { computeTotals, money, validateCoupon } from "../lib/pricing";
import { load, save } from "../lib/storage";

export function CouponBox({ subtotal, coupon, onChange }) {
    const [code, setCode] = useState(coupon || "");
    const [error, setError] = useState(null);
    const apply = e => {
        e.preventDefault();
        const res = validateCoupon(code, subtotal);
        if (!res || res.error) { setError(res?.error || "Introduce un código"); return; }
        setError(null);
        onChange(res.code);
    };
    if (coupon) {
        return (
            <div className="row-between small">
                <span className="badge badge-success"><Tag size={12} /> {coupon}</span>
                <button className="link-btn" onClick={() => { onChange(null); setCode(""); }}>Quitar</button>
            </div>
        );
    }
    return (
        <form onSubmit={apply} className="field">
            <div style={{ display: "flex", gap: 8 }}>
                <input className={`input ${error ? "invalid" : ""}`} style={{ height: 44 }} placeholder="Código de descuento" value={code} onChange={e => setCode(e.target.value)} aria-label="Código de descuento" />
                <button className="btn btn-outline btn-sm" style={{ height: 44 }} type="submit">Aplicar</button>
            </div>
            {error && <span className="error">{error}</span>}
        </form>
    );
}

export function Summary({ totals, children }) {
    return (
        <div className="stack" style={{ gap: 12 }}>
            <div className="summary-row"><span className="muted">Subtotal</span><span className="mono">{money(totals.subtotal)}</span></div>
            {totals.discount > 0 && <div className="summary-row" style={{ color: "var(--success)" }}><span>Descuento ({totals.coupon})</span><span className="mono">−{money(totals.discount)}</span></div>}
            <div className="summary-row"><span className="muted">Envío</span><span className="mono">{totals.shipping === 0 ? "Gratis" : money(totals.shipping)}</span></div>
            {children}
            <div className="summary-row total"><span>Total</span><span className="mono">{money(totals.total)}</span></div>
            <span className="tiny muted" style={{ textAlign: "right" }}>Incluye {money(totals.vat)} de IVA</span>
        </div>
    );
}

export default function Cart() {
    usePageTitle("Carrito");
    const lines = useCartLines();
    const navigate = useNavigate();
    const [coupon, setCoupon] = useState(() => load("td_coupon", null));
    const totals = computeTotals(lines, { coupon });
    const changeCoupon = c => { setCoupon(c); save("td_coupon", c); };

    return (
        <div className="container">
            <div className="page-head">
                <Breadcrumbs items={[{ label: "Inicio", to: "/" }, { label: "Carrito" }]} />
                <h1 className="display-2">Tu carrito</h1>
            </div>
            {lines.length === 0 ? (
                <div className="empty card">
                    <div className="ico"><ShoppingBag size={28} /></div>
                    <h2 className="h3">Tu carrito está vacío</h2>
                    <p className="muted">Aún no has añadido nada. ¡Hay mucho por descubrir!</p>
                    <Link to="/catalog" className="btn btn-primary">Explorar la tienda</Link>
                </div>
            ) : (
                <div className="two-col">
                    <div className="card card-pad">
                        <ShippingProgress subtotal={totals.subtotal} />
                        <div style={{ marginTop: 8 }}>{lines.map(l => <CartLine key={l.key} line={l} />)}</div>
                        <Link to="/catalog" className="btn btn-ghost btn-sm" style={{ marginTop: 16 }}><ArrowLeft size={16} /> Seguir comprando</Link>
                    </div>
                    <div className="card card-pad sticky-card stack">
                        <h2 className="h3">Resumen del pedido</h2>
                        <CouponBox subtotal={totals.subtotal} coupon={totals.coupon} onChange={changeCoupon} />
                        <Summary totals={totals} />
                        <button className="btn btn-accent btn-lg btn-block" onClick={() => navigate("/checkout")}><Lock size={16} /> Tramitar pedido</button>
                        <p className="tiny muted" style={{ textAlign: "center" }}>Prueba los códigos TECHDROP10 o BIENVENIDA</p>
                    </div>
                </div>
            )}
        </div>
    );
}
