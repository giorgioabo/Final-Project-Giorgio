import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingCart, Users, Plus, Pencil, Trash2, X, Search, TrendingUp, Euro, AlertTriangle, RotateCcw, Info, Upload, ImageOff } from "lucide-react";
import useGlobalReducer from "../hooks/useGlobalReducer";
import ProductArt from "../components/ProductArt";
import { Avatar, usePageTitle } from "../components/ui";
import { StatusBadge } from "./Account";
import { api, getMode, ORDER_STATUSES } from "../lib/api";
import { CATEGORIES, BRANDS } from "../lib/catalog";
import { money } from "../lib/pricing";

const ART_KINDS = ["phone", "tablet", "laptop", "monitor", "headphones", "headset", "earbuds", "speaker", "controller", "handheld", "watch", "band", "keyboard", "mouse", "charger", "camera", "dock"];
const BG_PRESETS = [["#f1ece4", "#e2d6c4"], ["#e6f3ec", "#cfe7da"], ["#e4e2f2", "#cdc8ea"], ["#e1e8f5", "#c5d3ee"], ["#fdeee4", "#fbd8c3"], ["#eceef2", "#d8dce4"]];

function RevenueChart({ orders }) {
    const days = useMemo(() => {
        const out = [];
        for (let i = 13; i >= 0; i--) {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            d.setDate(d.getDate() - i);
            out.push({ d, total: 0 });
        }
        orders.filter(o => o.status !== "cancelled").forEach(o => {
            const od = new Date(o.created_at);
            od.setHours(0, 0, 0, 0);
            const slot = out.find(x => x.d.getTime() === od.getTime());
            if (slot) slot.total += o.total;
        });
        return out;
    }, [orders]);
    const max = Math.max(100, ...days.map(d => d.total));
    const W = 700, H = 220, P = 28;
    const x = i => P + (i * (W - P * 2)) / (days.length - 1);
    const y = v => H - P - (v / max) * (H - P * 2);
    const path = days.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d.total)}`).join(" ");
    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Ingresos de los últimos 14 días">
            <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#ff5b1f" stopOpacity=".25" />
                    <stop offset="1" stopColor="#ff5b1f" stopOpacity="0" />
                </linearGradient>
            </defs>
            {[0, 0.5, 1].map(t => (
                <g key={t}>
                    <line x1={P} x2={W - P} y1={y(max * t)} y2={y(max * t)} stroke="#e6e3dc" strokeDasharray="4 4" />
                    <text x={P} y={y(max * t) - 6} fontSize="11" fill="#6d6d77">{money(max * t).replace(",00", "")}</text>
                </g>
            ))}
            <path d={`${path} L${x(days.length - 1)},${H - P} L${x(0)},${H - P} Z`} fill="url(#rev)" />
            <path d={path} fill="none" stroke="#ff5b1f" strokeWidth="2.5" strokeLinejoin="round" />
            {days.map((d, i) => (
                <g key={i}>
                    <circle cx={x(i)} cy={y(d.total)} r={d.total ? 4 : 0} fill="#ff5b1f" />
                    {i % 2 === 0 && <text x={x(i)} y={H - 6} fontSize="11" fill="#6d6d77" textAnchor="middle">{d.d.getDate()}/{d.d.getMonth() + 1}</text>}
                </g>
            ))}
        </svg>
    );
}

const EMPTY = { name: "", brand: "Nova", category: "smartphones", price: "", compare_at_price: "", stock: "", short: "", description: "", is_featured: false, is_new: true, color: "#2b2d31", art: "phone", bg: 0 };

function ProductModal({ product, onClose, onSaved }) {
    const { actions } = useGlobalReducer();
    const [form, setForm] = useState(() => product ? {
        ...EMPTY, ...product,
        compare_at_price: product.compare_at_price ?? "",
        color: product.colors?.[0]?.hex || "#2b2d31",
        art: product.art?.kind || "phone",
        // -1 = conservar el fondo original del producto hasta que se elija otro.
        bg: BG_PRESETS.findIndex(b => b[0] === product.art?.bg?.[0]),
    } : EMPTY);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const canUpload = getMode() === "remote";
    const set = k => e => setForm(f => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

    const preview = {
        id: product?.id || 99,
        name: form.name,
        art: { kind: form.art, bg: product && form.bg === -1 ? product.art.bg : BG_PRESETS[form.bg] },
        colors: [{ name: "Principal", hex: form.color }],
        image: form.image,
    };

    const uploadPhoto = async e => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        setUploading(true);
        setError(null);
        try {
            const { url } = await api.uploadImage(file);
            setForm(f => ({ ...f, image: url }));
        } catch (err) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    const save = async e => {
        e.preventDefault();
        if (!form.name.trim() || !(Number(form.price) > 0)) return setError("Nombre y un precio mayor que 0 son obligatorios");
        if (form.compare_at_price && Number(form.compare_at_price) <= Number(form.price)) return setError("El precio anterior debe ser mayor que el actual");
        setSaving(true);
        setError(null);
        const colors = product?.colors?.length ? [{ ...product.colors[0], hex: form.color }, ...product.colors.slice(1)] : [{ name: "Principal", hex: form.color }];
        const payload = {
            ...(product || {}),
            name: form.name.trim(),
            slug: form.name.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
            brand: form.brand,
            category: form.category,
            price: Number(form.price),
            compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
            stock: parseInt(form.stock) || 0,
            short: form.short,
            description: form.description,
            is_featured: form.is_featured,
            is_new: form.is_new,
            colors,
            art: preview.art,
            image: form.image || null,
            rating: product?.rating ?? 0,
            reviews_count: product?.reviews_count ?? 0,
            features: product?.features ?? [],
            specs: product?.specs ?? {},
            options: product?.options ?? [],
        };
        try {
            const saved = await api.saveProduct(payload);
            onSaved(saved);
            actions.toast(product ? "Producto actualizado" : "Producto creado");
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-wrap" role="dialog" aria-modal="true">
            <div className="backdrop" onClick={onClose} />
            <form className="modal" onSubmit={save} noValidate>
                <div className="modal-head">
                    <h2 className="h3">{product ? "Editar producto" : "Nuevo producto"}</h2>
                    <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar"><X size={20} /></button>
                </div>
                <div className="modal-body stack" style={{ gap: 20 }}>
                    {error && <div className="alert alert-danger">{error}</div>}
                    <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 20, alignItems: "start" }}>
                        <div style={{ borderRadius: 20, overflow: "hidden", aspectRatio: 1 }}><ProductArt product={preview} /></div>
                        <div className="stack" style={{ gap: 12 }}>
                            {canUpload && (
                                <div className="field"><label>Foto</label>
                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                        <label className="btn btn-ghost btn-sm" style={{ cursor: uploading ? "wait" : "pointer" }}>
                                            <Upload size={16} /> {uploading ? "Subiendo…" : form.image ? "Cambiar foto" : "Subir foto"}
                                            <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={uploadPhoto} disabled={uploading} hidden />
                                        </label>
                                        {form.image && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setForm(f => ({ ...f, image: null }))}><ImageOff size={16} /> Quitar</button>}
                                    </div>
                                    <span className="tiny muted">JPG, PNG, WebP o AVIF · máx. 5 MB. Sin foto se usa la ilustración.</span>
                                </div>
                            )}
                            <div className="field"><label>Ilustración</label>
                                <select className="select" value={form.art} onChange={set("art")}>{ART_KINDS.map(k => <option key={k}>{k}</option>)}</select>
                            </div>
                            <div style={{ display: "flex", gap: 12, alignItems: "end", flexWrap: "wrap" }}>
                                <div className="field"><label>Color</label><input type="color" value={form.color} onChange={set("color")} style={{ width: 56, height: 44, border: 0, background: "none", padding: 0 }} /></div>
                                <div className="field"><label>Fondo</label>
                                    <div style={{ display: "flex", gap: 6 }}>
                                        {BG_PRESETS.map((b, i) => (
                                            <button type="button" key={i} onClick={() => setForm(f => ({ ...f, bg: i }))} aria-label={`Fondo ${i + 1}`}
                                                style={{ width: 32, height: 32, borderRadius: 999, background: `linear-gradient(135deg, ${b[0]}, ${b[1]})`, border: form.bg === i ? "2px solid var(--ink)" : "1px solid var(--line-strong)" }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="form-grid">
                        <div className="field full"><label>Nombre</label><input className="input" value={form.name} onChange={set("name")} /></div>
                        <div className="field"><label>Marca</label><select className="select" value={form.brand} onChange={set("brand")}>{BRANDS.map(b => <option key={b}>{b}</option>)}</select></div>
                        <div className="field"><label>Categoría</label><select className="select" value={form.category} onChange={set("category")}>{CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></div>
                        <div className="field"><label>Precio (€)</label><input className="input" type="number" min="0" step="0.01" value={form.price} onChange={set("price")} /></div>
                        <div className="field"><label>Precio anterior (opcional)</label><input className="input" type="number" min="0" step="0.01" value={form.compare_at_price} onChange={set("compare_at_price")} /></div>
                        <div className="field"><label>Stock</label><input className="input" type="number" min="0" value={form.stock} onChange={set("stock")} /></div>
                        <div className="field" style={{ alignContent: "end", gap: 10 }}>
                            <label className="checkbox"><input type="checkbox" checked={form.is_featured} onChange={set("is_featured")} /> Destacado</label>
                            <label className="checkbox"><input type="checkbox" checked={form.is_new} onChange={set("is_new")} /> Novedad</label>
                        </div>
                        <div className="field full"><label>Resumen</label><input className="input" value={form.short} onChange={set("short")} maxLength={140} /></div>
                        <div className="field full"><label>Descripción</label><textarea className="textarea" value={form.description} onChange={set("description")} /></div>
                    </div>
                </div>
                <div className="modal-foot">
                    <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Guardando…" : "Guardar producto"}</button>
                </div>
            </form>
        </div>
    );
}

export default function Admin() {
    usePageTitle("Administración");
    const { store, dispatch, actions } = useGlobalReducer();
    const navigate = useNavigate();
    const [tab, setTab] = useState("dashboard");
    const [orders, setOrders] = useState([]);
    const [users, setUsers] = useState([]);
    const [editing, setEditing] = useState(null);
    const [q, setQ] = useState("");

    useEffect(() => {
        if (store.mode && !store.user?.is_admin) navigate("/login?next=/admin", { replace: true });
    }, [store.mode, store.user]);

    const loadAll = () => {
        api.allOrders().then(setOrders).catch(() => setOrders([]));
        api.users().then(setUsers).catch(() => setUsers([]));
    };
    useEffect(() => { if (store.user?.is_admin) loadAll(); }, [store.user, store.mode]);

    if (!store.user?.is_admin) return <div style={{ minHeight: "60vh" }} />;

    const products = store.products.filter(p => `${p.name} ${p.brand}`.toLowerCase().includes(q.toLowerCase()));
    const valid = orders.filter(o => o.status !== "cancelled");
    const revenue = valid.reduce((s, o) => s + o.total, 0);
    const lowStock = store.products.filter(p => p.stock <= 5).sort((a, b) => a.stock - b.stock);
    const sold = {};
    valid.forEach(o => o.items.forEach(i => { sold[i.product_id] = (sold[i.product_id] || 0) + i.quantity; }));
    const top = Object.entries(sold).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, n]) => ({ product: store.products.find(p => p.id === Number(id)), n })).filter(x => x.product);

    const remove = async p => {
        if (!window.confirm(`¿Eliminar "${p.name}" del catálogo?`)) return;
        try {
            await api.deleteProduct(p.id);
            dispatch({ type: "REMOVE_PRODUCT", payload: p.id });
            actions.toast("Producto eliminado", "neutral");
        } catch (err) {
            actions.toast(err.message, "danger");
        }
    };

    const setStatus = async (order, status) => {
        try {
            const updated = await api.updateOrderStatus(order.id, status);
            setOrders(os => os.map(o => (o.id === order.id ? { ...o, ...updated } : o)));
            actions.toast(`Pedido #${order.id}: ${ORDER_STATUSES[status].label}`);
        } catch (err) {
            actions.toast(err.message, "danger");
        }
    };

    const resetDemo = async () => {
        if (!window.confirm("Esto restaura el catálogo original y borra pedidos y usuarios de esta demo en tu navegador. ¿Continuar?")) return;
        await api.resetDemo();
        dispatch({ type: "SET_PRODUCTS", payload: await api.products() });
        actions.signOut();
        navigate("/");
    };

    const TABS = [["dashboard", "Resumen", LayoutDashboard], ["products", "Productos", Package], ["orders", "Pedidos", ShoppingCart], ["users", "Clientes", Users]];

    return (
        <div className="container">
            <div className="page-head row-between">
                <div>
                    <span className="eyebrow">Panel de administración</span>
                    <h1 className="display-2" style={{ marginTop: 8 }}>{TABS.find(t => t[0] === tab)[1]}</h1>
                </div>
                {tab === "products" && <button className="btn btn-primary" onClick={() => setEditing("new")}><Plus size={18} /> Nuevo producto</button>}
            </div>
            {store.mode === "local" && (
                <div className="demo-banner" style={{ marginBottom: 24, justifyContent: "space-between", flexWrap: "wrap" }}>
                    <span style={{ display: "flex", gap: 8, alignItems: "center" }}><Info size={16} /> Modo demo: los cambios se guardan solo en tu navegador.</span>
                    <button className="link-btn" style={{ color: "inherit", display: "inline-flex", gap: 4, alignItems: "center" }} onClick={resetDemo}><RotateCcw size={14} /> Restablecer demo</button>
                </div>
            )}
            <div className="dash">
                <nav className="side-nav" aria-label="Administración">
                    {TABS.map(([k, label, Icon]) => <button key={k} className={tab === k ? "active" : ""} onClick={() => setTab(k)}><Icon size={18} /> {label}</button>)}
                </nav>

                <div className="stack" style={{ gap: 24 }}>
                    {tab === "dashboard" && (
                        <>
                            <div className="kpis">
                                <div className="kpi"><span className="label"><Euro size={16} /> Ingresos</span><span className="value">{money(revenue)}</span></div>
                                <div className="kpi"><span className="label"><ShoppingCart size={16} /> Pedidos</span><span className="value">{orders.length}</span></div>
                                <div className="kpi"><span className="label"><TrendingUp size={16} /> Ticket medio</span><span className="value">{money(valid.length ? revenue / valid.length : 0)}</span></div>
                                <div className="kpi"><span className="label"><Users size={16} /> Clientes</span><span className="value">{users.length}</span></div>
                            </div>
                            <div className="card card-pad">
                                <div className="row-between" style={{ marginBottom: 8 }}><h2 className="h3">Ingresos · últimos 14 días</h2></div>
                                <RevenueChart orders={orders} />
                                {orders.length === 0 && <p className="muted small" style={{ textAlign: "center" }}>Aún no hay ventas. Haz un pedido de prueba para ver la gráfica en acción.</p>}
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
                                <div className="card card-pad stack">
                                    <h2 className="h3">Más vendidos</h2>
                                    {top.length === 0 && <p className="muted small">Sin ventas todavía.</p>}
                                    {top.map(({ product, n }) => (
                                        <div key={product.id} className="cell-product">
                                            <div className="thumb"><ProductArt product={product} /></div>
                                            <span style={{ flex: 1 }} className="small"><strong>{product.name}</strong></span>
                                            <span className="badge">{n} uds.</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="card card-pad stack">
                                    <h2 className="h3" style={{ display: "flex", gap: 8, alignItems: "center" }}><AlertTriangle size={18} color="var(--warning)" /> Stock bajo</h2>
                                    {lowStock.length === 0 && <p className="muted small">Todo el catálogo tiene stock suficiente.</p>}
                                    {lowStock.slice(0, 6).map(p => (
                                        <div key={p.id} className="cell-product">
                                            <div className="thumb"><ProductArt product={p} /></div>
                                            <span style={{ flex: 1 }} className="small"><strong>{p.name}</strong></span>
                                            <span className={`badge ${p.stock === 0 ? "badge-danger" : "badge-warning"}`}>{p.stock} uds.</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {tab === "products" && (
                        <div className="card">
                            <div style={{ padding: 16, borderBottom: "1px solid var(--line)" }}>
                                <div className="nav-search" style={{ maxWidth: 360, margin: 0 }}>
                                    <Search size={18} />
                                    <input placeholder="Buscar en el catálogo…" value={q} onChange={e => setQ(e.target.value)} aria-label="Buscar productos" />
                                </div>
                            </div>
                            <div className="table-wrap">
                                <table className="table">
                                    <thead><tr><th>Producto</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Estado</th><th /></tr></thead>
                                    <tbody>
                                        {products.map(p => (
                                            <tr key={p.id}>
                                                <td><div className="cell-product"><div className="thumb"><ProductArt product={p} /></div><div><strong>{p.name}</strong><div className="tiny muted">{p.brand}</div></div></div></td>
                                                <td>{p.categoryName}</td>
                                                <td className="mono">{money(p.price)}</td>
                                                <td><span className={`badge ${p.stock === 0 ? "badge-danger" : p.stock <= 5 ? "badge-warning" : "badge-success"}`}>{p.stock}</span></td>
                                                <td>{p.is_featured ? <span className="badge badge-dark">Destacado</span> : <span className="tiny muted">—</span>}</td>
                                                <td style={{ whiteSpace: "nowrap", textAlign: "right" }}>
                                                    <button className="icon-btn" onClick={() => setEditing(p)} aria-label={`Editar ${p.name}`}><Pencil size={16} /></button>
                                                    <button className="icon-btn" style={{ color: "var(--danger)" }} onClick={() => remove(p)} aria-label={`Eliminar ${p.name}`}><Trash2 size={16} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {tab === "orders" && (
                        <div className="card table-wrap">
                            {orders.length === 0 ? (
                                <div className="empty"><div className="ico"><ShoppingCart size={28} /></div><h2 className="h3">Aún no hay pedidos</h2><p className="muted">Los pedidos de los clientes aparecerán aquí.</p></div>
                            ) : (
                                <table className="table">
                                    <thead><tr><th>Pedido</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Estado</th><th>Cambiar estado</th></tr></thead>
                                    <tbody>
                                        {orders.map(o => (
                                            <tr key={o.id}>
                                                <td><strong>#{o.id}</strong><div className="tiny muted">{o.items.reduce((n, i) => n + i.quantity, 0)} artículos</div></td>
                                                <td>{o.user?.name}<div className="tiny muted">{o.user?.email}</div></td>
                                                <td>{new Date(o.created_at).toLocaleDateString("es-ES")}</td>
                                                <td className="mono">{money(o.total)}</td>
                                                <td><StatusBadge status={o.status} /></td>
                                                <td>
                                                    <select className="select" style={{ height: 38, width: 150 }} value={o.status} onChange={e => setStatus(o, e.target.value)} aria-label={`Estado del pedido ${o.id}`}>
                                                        {Object.entries(ORDER_STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {tab === "users" && (
                        <div className="card table-wrap">
                            <table className="table">
                                <thead><tr><th>Cliente</th><th>Rol</th><th>Pedidos</th><th>Gasto total</th></tr></thead>
                                <tbody>
                                    {users.map(u => {
                                        const mine = orders.filter(o => o.user?.id === u.id && o.status !== "cancelled");
                                        return (
                                            <tr key={u.id}>
                                                <td><div className="cell-product"><Avatar name={u.name} size={36} /><div><strong>{u.name}</strong><div className="tiny muted">{u.email}</div></div></div></td>
                                                <td>{u.is_admin ? <span className="badge badge-dark">Admin</span> : <span className="badge">Cliente</span>}</td>
                                                <td>{mine.length}</td>
                                                <td className="mono">{money(mine.reduce((s, o) => s + o.total, 0))}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {editing && (
                <ProductModal
                    product={editing === "new" ? null : editing}
                    onClose={() => setEditing(null)}
                    onSaved={p => { dispatch({ type: "UPSERT_PRODUCT", payload: p }); setEditing(null); }}
                />
            )}
        </div>
    );
}
