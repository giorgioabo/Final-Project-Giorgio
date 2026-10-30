import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { User, Package, Heart, LogOut, LayoutDashboard, PackageOpen, ChevronDown } from "lucide-react";
import useGlobalReducer from "../hooks/useGlobalReducer";
import ProductArt from "../components/ProductArt";
import ProductCard from "../components/ProductCard";
import { Avatar, usePageTitle } from "../components/ui";
import { api, ORDER_STATUSES } from "../lib/api";
import { money } from "../lib/pricing";

export function StatusBadge({ status }) {
    const s = ORDER_STATUSES[status] || { label: status, tone: "neutral" };
    return <span className={`badge badge-${s.tone === "accent" ? "accent" : s.tone}`}>{s.label}</span>;
}

const STEP_ORDER = ["paid", "processing", "shipped", "delivered"];

function OrderCard({ order }) {
    const [open, setOpen] = useState(false);
    const reached = STEP_ORDER.indexOf(order.status);
    return (
        <div className="order-card">
            <div className="head">
                <div>
                    <strong>Pedido #{order.id}</strong>
                    <span className="tiny muted" style={{ display: "block" }}>{new Date(order.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</span>
                </div>
                <StatusBadge status={order.status} />
            </div>
            <div className="row-between">
                <div className="order-thumbs">
                    {order.items.slice(0, 4).map((it, i) => (
                        <div key={i}>{it.product && <ProductArt product={it.product} color={it.product.colors?.find(c => c.name === it.color)?.hex} />}</div>
                    ))}
                </div>
                <div style={{ textAlign: "right" }}>
                    <strong className="mono">{money(order.total)}</strong>
                    <span className="tiny muted" style={{ display: "block" }}>{order.items.reduce((n, i) => n + i.quantity, 0)} artículos</span>
                </div>
            </div>
            {order.status !== "cancelled" && (
                <div className="timeline" style={{ margin: 0 }}>
                    {STEP_ORDER.map((s, i) => <div key={s} className={i <= reached ? "on" : ""}><span className="bar" />{ORDER_STATUSES[s].label}</div>)}
                </div>
            )}
            <button className="link-btn" style={{ justifySelf: "start", display: "inline-flex", gap: 4, alignItems: "center" }} onClick={() => setOpen(o => !o)}>
                {open ? "Ocultar detalles" : "Ver detalles"} <ChevronDown size={14} style={{ transform: open ? "rotate(180deg)" : "none" }} />
            </button>
            {open && (
                <div className="stack" style={{ gap: 8 }}>
                    {order.items.map((it, i) => (
                        <div key={i} className="summary-row small"><span>{it.quantity} × {it.name}{it.color ? ` · ${it.color}` : ""}</span><span className="mono">{money(it.unit_price * it.quantity)}</span></div>
                    ))}
                    {order.discount > 0 && <div className="summary-row small" style={{ color: "var(--success)" }}><span>Descuento</span><span className="mono">−{money(order.discount)}</span></div>}
                    <div className="summary-row small"><span className="muted">Envío</span><span className="mono">{order.shipping ? money(order.shipping) : "Gratis"}</span></div>
                    {order.shipping_address && (
                        <p className="tiny muted">Enviado a {order.shipping_address.name}, {order.shipping_address.street}, {order.shipping_address.zip} {order.shipping_address.city}</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default function Account() {
    usePageTitle("Mi cuenta");
    const { store, actions } = useGlobalReducer();
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const tab = params.get("tab") || "profile";
    const [orders, setOrders] = useState(null);

    useEffect(() => {
        if (store.mode && !store.user && tab !== "wishlist") navigate("/login?next=/account", { replace: true });
    }, [store.mode, store.user, tab]);

    useEffect(() => {
        if (!store.user) return;
        api.myOrders().then(setOrders).catch(() => setOrders([]));
    }, [store.user, store.mode]);

    const wish = store.products.filter(p => store.wishlist.includes(p.id));
    const spent = (orders || []).reduce((s, o) => s + o.total, 0);

    const TABS = [
        ["profile", "Resumen", User],
        ["orders", "Mis pedidos", Package],
        ["wishlist", "Favoritos", Heart],
    ];

    return (
        <div className="container">
            <div className="page-head">
                <h1 className="display-2">{store.user ? `Hola, ${store.user.name.split(" ")[0]}` : "Tus favoritos"}</h1>
            </div>
            <div className="dash">
                <nav className="side-nav" aria-label="Cuenta">
                    {TABS.map(([k, label, Icon]) => (
                        <button key={k} className={tab === k ? "active" : ""} onClick={() => setParams({ tab: k })}><Icon size={18} /> {label}</button>
                    ))}
                    {store.user?.is_admin && <Link to="/admin"><LayoutDashboard size={18} /> Administración</Link>}
                    {store.user && <button onClick={() => { actions.signOut(); navigate("/"); }}><LogOut size={18} /> Cerrar sesión</button>}
                </nav>

                <div>
                    {tab === "profile" && store.user && (
                        <div className="stack" style={{ gap: 24 }}>
                            <div className="card card-pad" style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
                                <Avatar name={store.user.name} size={72} />
                                <div style={{ flex: 1 }}>
                                    <h2 className="h3">{store.user.name}</h2>
                                    <p className="muted small">{store.user.email}</p>
                                </div>
                                {store.user.is_admin && <span className="badge badge-dark">Administrador</span>}
                            </div>
                            <div className="kpis" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                                <div className="kpi"><span className="label"><Package size={16} /> Pedidos</span><span className="value">{orders ? orders.length : "–"}</span></div>
                                <div className="kpi"><span className="label">Total gastado</span><span className="value">{money(spent)}</span></div>
                                <div className="kpi"><span className="label"><Heart size={16} /> Favoritos</span><span className="value">{store.wishlist.length}</span></div>
                            </div>
                            {orders?.[0] && (
                                <div className="stack">
                                    <div className="row-between"><h3 className="h3">Último pedido</h3><button className="link-btn" onClick={() => setParams({ tab: "orders" })}>Ver todos</button></div>
                                    <OrderCard order={orders[0]} />
                                </div>
                            )}
                        </div>
                    )}

                    {tab === "orders" && store.user && (
                        <div className="stack">
                            {orders === null && [0, 1].map(i => <div key={i} className="skeleton" style={{ height: 180 }} />)}
                            {orders?.length === 0 && (
                                <div className="empty card">
                                    <div className="ico"><PackageOpen size={28} /></div>
                                    <h2 className="h3">Aún no tienes pedidos</h2>
                                    <p className="muted">Cuando compres algo, podrás seguirlo desde aquí.</p>
                                    <Link to="/catalog" className="btn btn-primary">Empezar a comprar</Link>
                                </div>
                            )}
                            {orders?.map(o => <OrderCard key={o.id} order={o} />)}
                        </div>
                    )}

                    {tab === "wishlist" && (
                        wish.length === 0 ? (
                            <div className="empty card">
                                <div className="ico"><Heart size={28} /></div>
                                <h2 className="h3">Tu lista de favoritos está vacía</h2>
                                <p className="muted">Toca el corazón de cualquier producto para guardarlo.</p>
                                <Link to="/catalog" className="btn btn-primary">Descubrir productos</Link>
                            </div>
                        ) : (
                            <div className="product-grid cols-3">{wish.map(p => <ProductCard key={p.id} product={p} />)}</div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
