import { Link, useParams } from "react-router-dom";
import { Check } from "lucide-react";
import ProductArt from "../components/ProductArt";
import { usePageTitle } from "../components/ui";
import { money } from "../lib/pricing";
import { load } from "../lib/storage";
export default function OrderConfirmation() {
    usePageTitle("Pedido confirmado");
    const { id } = useParams();
    const last = load("td_last_order", null);
    const order = last && String(last.id) === String(id) ? last : null;

    return (
        <div className="container" style={{ maxWidth: 720, paddingTop: 64 }}>
            <div className="card card-pad" style={{ padding: 48, textAlign: "center" }}>
                <div className="success-icon"><Check size={40} strokeWidth={3} /></div>
                <h1 className="display-2" style={{ fontSize: 40 }}>¡Gracias por tu compra!</h1>
                <p className="lead" style={{ margin: "12px auto 0" }}>
                    Tu pedido <strong style={{ color: "var(--ink)" }}>#{id}</strong> está confirmado. Puedes seguir su estado en cualquier momento desde tu cuenta.
                </p>
                <div className="timeline" aria-label="Estado del pedido">
                    <div className="on"><span className="bar" />Pagado</div>
                    <div><span className="bar" />Preparando</div>
                    <div><span className="bar" />Enviado</div>
                    <div><span className="bar" />Entregado</div>
                </div>
                {order && (
                    <div className="stack" style={{ textAlign: "left", gap: 12, marginTop: 8 }}>
                        {order.items.map((it, i) => (
                            <div key={i} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                <div style={{ width: 52, height: 52, borderRadius: 12, overflow: "hidden", flex: "none" }}>
                                    {it.product && <ProductArt product={it.product} color={it.product.colors?.find(c => c.name === it.color)?.hex} />}
                                </div>
                                <span style={{ flex: 1 }} className="small"><strong>{it.name}</strong><br /><span className="muted">{it.quantity} × {money(it.unit_price)}</span></span>
                                <strong className="small mono">{money(it.unit_price * it.quantity)}</strong>
                            </div>
                        ))}
                        <div className="summary-row total"><span>Total pagado</span><span className="mono">{money(order.total)}</span></div>
                    </div>
                )}
                <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 32, flexWrap: "wrap" }}>
                    <Link to="/account?tab=orders" className="btn btn-primary">Ver mis pedidos</Link>
                    <Link to="/catalog" className="btn btn-outline">Seguir comprando</Link>
                </div>
            </div>
        </div>
    );
}
