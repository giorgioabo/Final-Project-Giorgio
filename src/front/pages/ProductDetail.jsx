import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Heart, Minus, Plus, Truck, ShieldCheck, RotateCcw, CreditCard, Check, PackageX, ZoomIn, GitCompareArrows } from "lucide-react";
import { RecentlyViewed } from "../components/Interactive";
import useGlobalReducer from "../hooks/useGlobalReducer";
import ProductArt from "../components/ProductArt";
import ProductCard from "../components/ProductCard";
import { Breadcrumbs, Price, ProductBadges, Stars, StockLine, usePageTitle } from "../components/ui";
import { categoryBySlug, discountPercent, sampleReviews } from "../lib/catalog";
import { money } from "../lib/pricing";
import { load, save } from "../lib/storage";

function Reviews({ product }) {
    const { store, actions } = useGlobalReducer();
    const key = `td_reviews_${product.id}`;
    const [own, setOwn] = useState(() => load(key, []));
    const [form, setForm] = useState({ rating: 5, title: "", body: "" });
    const [writing, setWriting] = useState(false);
    const reviews = [...own, ...sampleReviews(product)];
    const dist = [5, 4, 3, 2, 1].map(s => {
        // Distribución aproximada coherente con la media del producto.
        const weights = { 5: product.rating - 3.6, 4: 0.9, 3: 0.25, 2: 0.08, 1: 0.05 };
        const total = Object.values(weights).reduce((a, b) => a + Math.max(b, 0.05), 0);
        return [s, Math.round((Math.max(weights[s], 0.05) / total) * 100)];
    });

    const submit = e => {
        e.preventDefault();
        if (!form.title.trim() || form.body.trim().length < 10) return actions.toast("Escribe un título y al menos 10 caracteres", "danger");
        const review = { ...form, id: `u-${Date.now()}`, author: store.user?.name || "Cliente", date: new Date().toISOString().slice(0, 10), verified: false };
        const next = [review, ...own];
        setOwn(next);
        save(key, next);
        setForm({ rating: 5, title: "", body: "" });
        setWriting(false);
        actions.toast("¡Gracias por tu reseña!");
    };

    return (
        <div>
            <div className="reviews-summary">
                <div style={{ display: "grid", gap: 8, alignContent: "start" }}>
                    <strong style={{ fontFamily: "var(--display)", fontSize: 64, lineHeight: 1 }}>{product.rating.toFixed(1)}</strong>
                    <Stars value={product.rating} showNumber={false} size={18} />
                    <span className="muted small">Basado en {product.reviews_count + own.length} reseñas</span>
                    {store.user ? (
                        <button className="btn btn-outline btn-sm" style={{ justifySelf: "start", marginTop: 8 }} onClick={() => setWriting(w => !w)}>Escribir una reseña</button>
                    ) : (
                        <Link to="/login" className="btn btn-outline btn-sm" style={{ justifySelf: "start", marginTop: 8 }}>Inicia sesión para opinar</Link>
                    )}
                </div>
                <div className="bars">
                    {dist.map(([s, pct]) => (
                        <div className="bar" key={s}>
                            <span>{s}★</span>
                            <div className="track"><div className="fill" style={{ width: `${pct}%` }} /></div>
                            <span className="muted">{pct}%</span>
                        </div>
                    ))}
                </div>
            </div>
            {writing && (
                <form onSubmit={submit} className="card card-pad stack" style={{ marginBottom: 24 }}>
                    <div className="field">
                        <label>Tu valoración</label>
                        <div style={{ display: "flex", gap: 4 }}>
                            {[1, 2, 3, 4, 5].map(s => (
                                <button type="button" key={s} className="icon-btn" style={{ width: 36, height: 36, color: "#f5a524" }} onClick={() => setForm(f => ({ ...f, rating: s }))} aria-label={`${s} estrellas`}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill={s <= form.rating ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" /></svg>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="field"><label htmlFor="rt">Título</label><input id="rt" className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} maxLength={80} /></div>
                    <div className="field"><label htmlFor="rb">Tu opinión</label><textarea id="rb" className="textarea" value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} maxLength={800} /></div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn btn-primary" type="submit">Publicar reseña</button>
                        <button className="btn btn-ghost" type="button" onClick={() => setWriting(false)}>Cancelar</button>
                    </div>
                </form>
            )}
            {reviews.map(r => (
                <div key={r.id} className="review">
                    <div className="row-between">
                        <Stars value={r.rating} showNumber={false} size={14} />
                        <span className="tiny muted">{new Date(r.date).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</span>
                    </div>
                    <strong>{r.title}</strong>
                    <p className="muted">{r.body}</p>
                    <span className="tiny muted">{r.author}{r.verified && <> · <Check size={12} style={{ verticalAlign: -2 }} /> Compra verificada</>}</span>
                </div>
            ))}
        </div>
    );
}

export default function ProductDetail() {
    const { id } = useParams();
    const { store, dispatch, actions } = useGlobalReducer();
    const product = store.products.find(p => String(p.id) === String(id));
    const [color, setColor] = useState(0);
    const [option, setOption] = useState(0);
    const [qty, setQty] = useState(1);
    const [view, setView] = useState(0);
    const [tab, setTab] = useState("overview");
    const [zoom, setZoom] = useState(false);
    const [showSticky, setShowSticky] = useState(false);
    const buyRef = useRef(null);

    usePageTitle(product?.name || "Producto");
    useEffect(() => { setColor(0); setOption(0); setQty(1); setView(0); setTab("overview"); }, [id]);
    useEffect(() => { if (product) dispatch({ type: "VIEWED", payload: product.id }); }, [product?.id]);

    // Barra de compra fija cuando el botón principal sale de la pantalla.
    useEffect(() => {
        const el = buyRef.current;
        if (!el || !("IntersectionObserver" in window)) return;
        const io = new IntersectionObserver(([e]) => setShowSticky(!e.isIntersecting && e.boundingClientRect.top < 0));
        io.observe(el);
        return () => io.disconnect();
    }, [product?.id]);

    const related = useMemo(() => {
        if (!product) return [];
        return store.products.filter(p => p.id !== product.id && p.category === product.category).slice(0, 4);
    }, [store.products, product]);

    if (!product) {
        return (
            <div className="container empty" style={{ minHeight: "60vh" }}>
                <div className="ico"><PackageX size={28} /></div>
                <h1 className="h3">Este producto no existe</h1>
                <p className="muted">Puede que se haya retirado del catálogo.</p>
                <Link to="/catalog" className="btn btn-primary">Volver a la tienda</Link>
            </div>
        );
    }

    const cat = categoryBySlug(product.category);
    const saved = store.wishlist.includes(product.id);
    const selectedColor = product.colors[color] || product.colors[0];
    const off = discountPercent(product);
    // Vistas de la galería: el color elegido y el resto de acabados.
    const views = [selectedColor, ...product.colors.filter(c => c !== selectedColor)].slice(0, 4);
    while (views.length < 4) views.push(selectedColor);

    const add = () => actions.addToCart(product, { quantity: qty, color: selectedColor.name, option: product.options[option] });

    const delivery = new Date();
    delivery.setDate(delivery.getDate() + (delivery.getHours() < 18 ? 1 : 2));

    return (
        <div className="container">
            <div className="page-head" style={{ paddingBottom: 24 }}>
                <Breadcrumbs items={[{ label: "Inicio", to: "/" }, { label: cat?.name || "Tienda", to: `/catalog?category=${product.category}` }, { label: product.name }]} />
            </div>
            <div className="pdp">
                <div className="gallery">
                    <div
                        className={`main zoom-box ${zoom ? "zooming" : ""}`}
                        style={{ position: "relative" }}
                        onMouseEnter={() => product.image && setZoom(true)}
                        onMouseLeave={() => setZoom(false)}
                        onMouseMove={e => {
                            const r = e.currentTarget.getBoundingClientRect();
                            e.currentTarget.style.setProperty("--zx", `${((e.clientX - r.left) / r.width) * 100}%`);
                            e.currentTarget.style.setProperty("--zy", `${((e.clientY - r.top) / r.height) * 100}%`);
                        }}
                    >
                        <ProductArt product={product} view={product.image ? view : 0} color={views[view]?.hex} eager />
                        <div style={{ position: "absolute", top: 18, left: 18, display: "flex", gap: 6 }}><ProductBadges product={product} /></div>
                        {product.image && !zoom && <span className="zoom-hint"><ZoomIn size={14} /> Pasa el ratón para ampliar</span>}
                    </div>
                    <div className="thumbs">
                        {views.map((c, i) => (
                            <button key={i} className={view === i ? "active" : ""} onClick={() => setView(i)} aria-label={`Vista ${i + 1}`}>
                                {product.image
                                    ? <ProductArt product={product} view={i} />
                                    : <ProductArt product={{ ...product, art: { ...product.art, bg: i % 2 ? [product.art.bg[1], product.art.bg[0]] : product.art.bg } }} color={c.hex} />}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="pdp-info">
                    <div style={{ display: "grid", gap: 12 }}>
                        <span className="eyebrow">{product.brand}</span>
                        <h1>{product.name}</h1>
                        <a href="#detalles" onClick={() => setTab("reviews")}><Stars value={product.rating} count={`${product.reviews_count} reseñas`} /></a>
                    </div>
                    <p className="lead" style={{ fontSize: 18 }}>{product.short}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                        <Price product={product} large />
                        {off > 0 && <span className="badge badge-accent">Ahorras {money(product.compare_at_price - product.price)}</span>}
                    </div>
                    <span className="tiny muted" style={{ marginTop: -16 }}>IVA incluido · o 3 plazos de {money(product.price / 3)} sin intereses</span>

                    {product.colors.length > 0 && (
                        <div style={{ display: "grid", gap: 12 }}>
                            <span className="small"><strong>Color:</strong> {selectedColor.name}</span>
                            <div className="option-row">
                                {product.colors.map((c, i) => (
                                    <button key={c.name} className={`color-opt ${color === i ? "active" : ""}`} onClick={() => { setColor(i); setView(0); }} aria-label={c.name} title={c.name}>
                                        <span style={{ background: c.hex }} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {product.options.length > 0 && (
                        <div style={{ display: "grid", gap: 12 }}>
                            <span className="small"><strong>Versión:</strong> {product.options[option]}</span>
                            <div className="option-row">
                                {product.options.map((o, i) => (
                                    <button key={o} className={`chip ${option === i ? "active" : ""}`} onClick={() => setOption(i)}>{o}</button>
                                ))}
                            </div>
                        </div>
                    )}

                    <StockLine stock={product.stock} />

                    <div className="buy-row" ref={buyRef}>
                        <div className="qty">
                            <button onClick={() => setQty(q => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Menos"><Minus size={16} /></button>
                            <span>{qty}</span>
                            <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} disabled={qty >= product.stock} aria-label="Más"><Plus size={16} /></button>
                        </div>
                        <button className="btn btn-accent btn-lg" disabled={product.stock <= 0} onClick={add}>
                            {product.stock > 0 ? `Añadir al carrito · ${money(product.price * qty)}` : "Agotado"}
                        </button>
                        <button className={`icon-btn`} style={{ width: 56, height: 56, border: "1px solid var(--line-strong)", color: saved ? "var(--accent)" : undefined }} onClick={() => actions.toggleWishlist(product, saved)} aria-label="Favoritos" aria-pressed={saved}>
                            <Heart size={20} fill={saved ? "currentColor" : "none"} />
                        </button>
                    </div>

                    <button className="link-btn" style={{ justifySelf: "start", display: "inline-flex", gap: 6, alignItems: "center", marginTop: -8 }}
                        onClick={() => dispatch({ type: "TOGGLE_COMPARE", payload: product.id })}>
                        <GitCompareArrows size={14} /> {store.compare.includes(product.id) ? "Quitar del comparador" : "Añadir al comparador"}
                    </button>

                    {product.stock > 0 && (
                        <p className="small" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <Truck size={16} /> Pídelo ahora y recíbelo el <strong>{delivery.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}</strong>
                        </p>
                    )}

                    <div className="trust">
                        <div><Truck size={18} /> Envío gratis desde 99 €</div>
                        <div><ShieldCheck size={18} /> 2 años de garantía</div>
                        <div><RotateCcw size={18} /> 30 días de devolución</div>
                        <div><CreditCard size={18} /> Pago 100% seguro</div>
                    </div>
                </div>
            </div>

            <section id="detalles" className="section" style={{ paddingBottom: 0 }}>
                <div className="tabs" role="tablist">
                    {[["overview", "Descripción"], ["specs", "Especificaciones"], ["reviews", `Reseñas (${product.reviews_count})`]].map(([k, l]) => (
                        <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "active" : ""} onClick={() => setTab(k)}>{l}</button>
                    ))}
                </div>
                <div style={{ maxWidth: 860 }}>
                    {tab === "overview" && (
                        <div className="stack" style={{ gap: 28 }}>
                            <p style={{ fontSize: 18, lineHeight: 1.7 }}>{product.description}</p>
                            <ul className="feature-list">
                                {product.features.map(f => <li key={f}><Check size={18} /> {f}</li>)}
                            </ul>
                        </div>
                    )}
                    {tab === "specs" && (
                        <table className="specs">
                            <tbody>
                                <tr><th>Marca</th><td>{product.brand}</td></tr>
                                {Object.entries(product.specs).map(([k, v]) => <tr key={k}><th>{k}</th><td>{v}</td></tr>)}
                                <tr><th>Garantía</th><td>2 años</td></tr>
                            </tbody>
                        </table>
                    )}
                    {tab === "reviews" && <Reviews product={product} />}
                </div>
            </section>

            <section className="section" style={{ paddingBottom: 0 }}>
                <div className="pdp-extra">
                    <Bundle product={product} />
                    <div className="faq">
                        <h2 className="h3" style={{ fontSize: 26, marginBottom: 8 }}>Preguntas frecuentes</h2>
                        {FAQ.map(([q, a]) => (
                            <details key={q}>
                                <summary>{q} <Plus size={18} /></summary>
                                <p>{a}</p>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {related.length > 0 && (
                <section className="section" style={{ paddingBottom: 0 }}>
                    <div className="section-head">
                        <h2 className="display-2" style={{ fontSize: 36 }}>También te puede gustar</h2>
                        <Link to={`/catalog?category=${product.category}`} className="btn btn-outline">Ver más de {cat?.name}</Link>
                    </div>
                    <div className="product-grid">
                        {related.map(p => <ProductCard key={p.id} product={p} />)}
                    </div>
                </section>
            )}

            <RecentlyViewed exclude={product.id} />

            <div className={`sticky-buy ${showSticky ? "show" : ""}`} aria-hidden={!showSticky}>
                <div className="container">
                    <div className="thumb"><ProductArt product={product} /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <strong className="small" style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{product.name}</strong>
                        <span className="tiny muted">{selectedColor.name}{product.options[option] ? ` · ${product.options[option]}` : ""}</span>
                    </div>
                    <span className="hide-mobile"><Price product={product} /></span>
                    <button className="btn btn-accent" disabled={product.stock <= 0} onClick={add} tabIndex={showSticky ? 0 : -1}>
                        {product.stock > 0 ? "Añadir al carrito" : "Agotado"}
                    </button>
                </div>
            </div>
        </div>
    );
}

const FAQ = [
    ["¿Cuándo recibiré mi pedido?", "Los pedidos realizados antes de las 18:00 salen el mismo día. El envío estándar tarda 24-48 h en península y el express llega al día siguiente antes de las 14:00."],
    ["¿Puedo devolverlo si no me convence?", "Sí. Tienes 30 días para devolverlo sin dar explicaciones. La recogida es gratuita y te devolvemos el dinero en 3-5 días hábiles."],
    ["¿Qué cubre la garantía?", "Todos los productos tienen 2 años de garantía oficial frente a defectos de fabricación. Si algo falla, lo reparamos o lo sustituimos sin coste."],
    ["¿Puedo pagar a plazos?", "Sí, puedes dividir el pago en 3 plazos sin intereses en compras superiores a 100 €."],
];

// "Cómpralo junto": complementos de otras categorías con selección interactiva.
const COMPLEMENTS = {
    smartphones: ["volt-charge-100", "lumen-buds-2"],
    laptops: ["kairo-glide-mouse", "volt-dock-pro"],
    audio: ["volt-charge-100", "nova-a5"],
    gaming: ["volt-pad-pro", "lumen-h9"],
    wearables: ["lumen-air-open", "volt-charge-100"],
    accessories: ["kairo-glide-mouse", "kairo-keys-75"],
};

function Bundle({ product }) {
    const { store, actions } = useGlobalReducer();
    const extras = (COMPLEMENTS[product.category] || [])
        .map(slug => store.products.find(p => p.slug === slug))
        .filter(p => p && p.id !== product.id && p.stock > 0);
    const [picked, setPicked] = useState(() => extras.map(p => p.id));
    useEffect(() => setPicked(extras.map(p => p.id)), [product.id]);
    if (!extras.length || product.stock <= 0) return <div />;
    const items = [product, ...extras.filter(p => picked.includes(p.id))];
    const total = items.reduce((s, p) => s + p.price, 0);
    return (
        <div className="bundle">
            <h2 className="h3" style={{ fontSize: 26 }}>Cómpralo junto</h2>
            <div className="bundle-items">
                <div className="bundle-item">
                    <div className="thumb" style={{ borderColor: "var(--ink)" }}><ProductArt product={product} /></div>
                    <strong>{product.name}</strong><span className="muted">{money(product.price)}</span>
                </div>
                {extras.map(p => {
                    const on = picked.includes(p.id);
                    return (
                        <span key={p.id} style={{ display: "contents" }}>
                            <span className="bundle-plus">+</span>
                            <label className={`bundle-item ${on ? "" : "off"}`}>
                                <input type="checkbox" checked={on} onChange={() => setPicked(ps => on ? ps.filter(x => x !== p.id) : [...ps, p.id])} aria-label={`Incluir ${p.name}`} />
                                <div className="thumb"><ProductArt product={p} /></div>
                                <strong>{p.name}</strong><span className="muted">{money(p.price)}</span>
                            </label>
                        </span>
                    );
                })}
            </div>
            <div className="row-between">
                <span>Total ({items.length} {items.length === 1 ? "producto" : "productos"}): <strong style={{ fontSize: 20 }}>{money(total)}</strong></span>
                <button className="btn btn-primary" onClick={() => items.forEach(p => actions.addToCart(p))}>Añadir {items.length > 1 ? "los " + items.length : ""} al carrito</button>
            </div>
        </div>
    );
}
