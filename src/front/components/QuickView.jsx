import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X, Minus, Plus, ArrowRight } from "lucide-react";
import useGlobalReducer from "../hooks/useGlobalReducer";
import ProductArt from "./ProductArt";
import { Price, ProductBadges, Stars, StockLine } from "./ui";
import { money } from "../lib/pricing";

// Vista rápida: ver y comprar un producto sin salir de la página.
export default function QuickView() {
    const { store, dispatch, actions } = useGlobalReducer();
    const product = store.products.find(p => p.id === store.quickView);
    const [color, setColor] = useState(0);
    const [option, setOption] = useState(0);
    const [qty, setQty] = useState(1);
    const [view, setView] = useState(0);
    const close = () => dispatch({ type: "QUICK_VIEW", payload: null });

    useEffect(() => { setColor(0); setOption(0); setQty(1); setView(0); }, [store.quickView]);
    useEffect(() => {
        if (!product) return;
        const onKey = e => e.key === "Escape" && close();
        document.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
    }, [product]);

    if (!product) return null;
    const url = `/product/${product.id}/${product.slug}`;

    return (
        <div className="modal-wrap" role="dialog" aria-modal="true" aria-label={`Vista rápida: ${product.name}`}>
            <div className="backdrop" onClick={close} />
            <div className="modal quick-view">
                <button className="icon-btn qv-close" onClick={close} aria-label="Cerrar"><X size={20} /></button>
                <div className="qv-media">
                    <div className="qv-main"><ProductArt product={product} view={view} color={product.colors[color]?.hex} eager /></div>
                    <div className="qv-dots">
                        {[0, 1, 2, 3].map(i => <button key={i} className={view === i ? "active" : ""} onClick={() => setView(i)} aria-label={`Vista ${i + 1}`} />)}
                    </div>
                    <div style={{ position: "absolute", top: 16, left: 16, display: "flex", gap: 6 }}><ProductBadges product={product} /></div>
                </div>
                <div className="qv-info">
                    <span className="eyebrow">{product.brand} · {product.categoryName}</span>
                    <h2 style={{ fontSize: 32 }}>{product.name}</h2>
                    <Stars value={product.rating} count={`${product.reviews_count} reseñas`} />
                    <p className="muted">{product.short}</p>
                    <Price product={product} large />
                    {product.colors.length > 1 && (
                        <div className="stack" style={{ gap: 8 }}>
                            <span className="small"><strong>Color:</strong> {product.colors[color].name}</span>
                            <div className="option-row">
                                {product.colors.map((c, i) => (
                                    <button key={c.name} className={`color-opt ${color === i ? "active" : ""}`} onClick={() => setColor(i)} aria-label={c.name}><span style={{ background: c.hex }} /></button>
                                ))}
                            </div>
                        </div>
                    )}
                    {product.options.length > 0 && (
                        <div className="option-row">
                            {product.options.map((o, i) => <button key={o} className={`chip ${option === i ? "active" : ""}`} onClick={() => setOption(i)}>{o}</button>)}
                        </div>
                    )}
                    <StockLine stock={product.stock} />
                    <div className="buy-row">
                        <div className="qty">
                            <button onClick={() => setQty(q => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Menos"><Minus size={16} /></button>
                            <span>{qty}</span>
                            <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} disabled={qty >= product.stock} aria-label="Más"><Plus size={16} /></button>
                        </div>
                        <button className="btn btn-accent btn-lg" disabled={product.stock <= 0}
                            onClick={() => { close(); actions.addToCart(product, { quantity: qty, color: product.colors[color]?.name, option: product.options[option] }); }}>
                            {product.stock > 0 ? `Añadir · ${money(product.price * qty)}` : "Agotado"}
                        </button>
                    </div>
                    <Link to={url} onClick={close} className="btn btn-ghost" style={{ justifySelf: "start" }}>Ver todos los detalles <ArrowRight size={16} /></Link>
                </div>
            </div>
        </div>
    );
}
