import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { X, ShoppingBag, Minus, Plus, Truck } from "lucide-react";
import useGlobalReducer, { useCartLines } from "../hooks/useGlobalReducer";
import ProductArt from "./ProductArt";
import { computeTotals, money, FREE_SHIPPING_FROM } from "../lib/pricing";

export function ShippingProgress({ subtotal }) {
    const left = FREE_SHIPPING_FROM - subtotal;
    const pct = Math.min(100, (subtotal / FREE_SHIPPING_FROM) * 100);
    return (
        <div className="ship-progress">
            <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Truck size={16} />
                {left > 0 ? <>Te faltan <strong>{money(left)}</strong> para el envío gratis</> : <strong>¡Tienes envío gratis!</strong>}
            </span>
            <div className="track"><div className="fill" style={{ width: `${pct}%` }} /></div>
        </div>
    );
}

export function CartLine({ line }) {
    const { dispatch } = useGlobalReducer();
    const { product } = line;
    const color = product.colors?.find(c => c.name === line.color);
    const setQty = quantity => dispatch({ type: "UPDATE_CART_QTY", payload: { key: line.key, quantity } });
    return (
        <div className="line">
            <Link to={`/product/${product.id}/${product.slug}`} className="thumb"><ProductArt product={product} color={color?.hex} /></Link>
            <div>
                <div className="top">
                    <div>
                        <h4>{product.name}</h4>
                        <span className="tiny muted">{[line.color, line.option].filter(Boolean).join(" · ")}</span>
                    </div>
                    <strong className="small mono">{money(product.price * line.quantity)}</strong>
                </div>
                <div className="bottom">
                    <div className="qty sm">
                        <button aria-label="Quitar uno" onClick={() => setQty(line.quantity - 1)}><Minus size={14} /></button>
                        <span className="small">{line.quantity}</span>
                        <button aria-label="Añadir uno" disabled={line.quantity >= product.stock} onClick={() => setQty(line.quantity + 1)}><Plus size={14} /></button>
                    </div>
                    <button className="link-btn" onClick={() => dispatch({ type: "REMOVE_FROM_CART", payload: line.key })}>Eliminar</button>
                </div>
            </div>
        </div>
    );
}

export default function CartDrawer() {
    const { store, dispatch } = useGlobalReducer();
    const lines = useCartLines();
    const navigate = useNavigate();
    const totals = computeTotals(lines);
    const close = () => dispatch({ type: "TOGGLE_CART", payload: false });

    useEffect(() => {
        if (!store.cartOpen) return;
        const onKey = e => e.key === "Escape" && close();
        document.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
    }, [store.cartOpen]);

    if (!store.cartOpen) return null;

    return (
        <>
            <div className="backdrop" onClick={close} />
            <aside className="drawer" role="dialog" aria-modal="true" aria-label="Carrito">
                <div className="drawer-head">
                    <h3 className="h3">Tu carrito <span className="muted" style={{ fontWeight: 400 }}>({lines.reduce((n, l) => n + l.quantity, 0)})</span></h3>
                    <button className="icon-btn" onClick={close} aria-label="Cerrar carrito"><X size={20} /></button>
                </div>
                {lines.length === 0 ? (
                    <div className="empty" style={{ flex: 1, alignContent: "center" }}>
                        <div className="ico"><ShoppingBag size={28} /></div>
                        <h3 className="h3">Tu carrito está vacío</h3>
                        <p className="muted small">Descubre lo último en tecnología.</p>
                        <button className="btn btn-primary" onClick={() => { close(); navigate("/catalog"); }}>Explorar la tienda</button>
                    </div>
                ) : (
                    <>
                        <div style={{ padding: "16px 24px 0" }}><ShippingProgress subtotal={totals.subtotal} /></div>
                        <div className="drawer-body">
                            {lines.map(l => <CartLine key={l.key} line={l} />)}
                        </div>
                        <div className="drawer-foot">
                            <div className="summary-row"><span className="muted">Subtotal</span><strong className="mono">{money(totals.subtotal)}</strong></div>
                            <div className="summary-row"><span className="muted">Envío</span><span className="mono">{totals.shipping === 0 ? "Gratis" : money(totals.shipping)}</span></div>
                            <button className="btn btn-accent btn-lg btn-block" onClick={() => { close(); navigate("/checkout"); }}>
                                Finalizar compra · {money(totals.total)}
                            </button>
                            <button className="btn btn-ghost btn-block" onClick={() => { close(); navigate("/cart"); }}>Ver carrito completo</button>
                        </div>
                    </>
                )}
            </aside>
        </>
    );
}
