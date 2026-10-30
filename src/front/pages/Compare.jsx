import { Link } from "react-router-dom";
import { X, GitCompareArrows, Trophy } from "lucide-react";
import useGlobalReducer from "../hooks/useGlobalReducer";
import ProductArt from "../components/ProductArt";
import { Breadcrumbs, Price, Stars, usePageTitle } from "../components/ui";
import { money } from "../lib/pricing";

export default function Compare() {
    usePageTitle("Comparar productos");
    const { store, dispatch, actions } = useGlobalReducer();
    const items = store.compare.map(id => store.products.find(p => p.id === id)).filter(Boolean);
    const specKeys = [...new Set(items.flatMap(p => Object.keys(p.specs || {})))];
    const cheapest = items.length > 1 ? Math.min(...items.map(p => p.price)) : null;
    const bestRated = items.length > 1 ? Math.max(...items.map(p => p.rating)) : null;

    return (
        <div className="container">
            <div className="page-head">
                <Breadcrumbs items={[{ label: "Inicio", to: "/" }, { label: "Comparar" }]} />
                <h1 className="display-2">Comparar productos</h1>
                <p className="lead" style={{ marginTop: 12 }}>Hasta 3 productos lado a lado. Resaltamos el mejor precio y la mejor valoración.</p>
            </div>
            {items.length === 0 ? (
                <div className="empty card">
                    <div className="ico"><GitCompareArrows size={28} /></div>
                    <h2 className="h3">Aún no has elegido productos</h2>
                    <p className="muted">Pulsa “Comparar” en cualquier producto de la tienda.</p>
                    <Link to="/catalog" className="btn btn-primary">Ir a la tienda</Link>
                </div>
            ) : (
                <div className="card table-wrap">
                    <table className="table compare-table">
                        <thead>
                            <tr>
                                <th style={{ width: 180 }} />
                                {items.map(p => (
                                    <th key={p.id} style={{ textTransform: "none", letterSpacing: 0 }}>
                                        <div className="compare-head">
                                            <button className="icon-btn" onClick={() => dispatch({ type: "TOGGLE_COMPARE", payload: p.id })} aria-label={`Quitar ${p.name}`}><X size={16} /></button>
                                            <Link to={`/product/${p.id}/${p.slug}`} className="compare-img"><ProductArt product={p} /></Link>
                                            <span className="tiny muted" style={{ textTransform: "uppercase", letterSpacing: ".06em" }}>{p.brand}</span>
                                            <strong style={{ color: "var(--ink)", fontSize: 17 }}>{p.name}</strong>
                                            <button className="btn btn-primary btn-sm" disabled={p.stock <= 0} onClick={() => actions.addToCart(p)}>
                                                {p.stock > 0 ? "Añadir al carrito" : "Agotado"}
                                            </button>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <tr><th>Precio</th>{items.map(p => <td key={p.id}><Price product={p} />{p.price === cheapest && <span className="badge badge-success" style={{ marginLeft: 8 }}><Trophy size={12} /> Mejor precio</span>}</td>)}</tr>
                            <tr><th>Valoración</th>{items.map(p => <td key={p.id}><Stars value={p.rating} size={13} />{p.rating === bestRated && <span className="badge badge-info" style={{ marginLeft: 8 }}>Mejor valorado</span>}</td>)}</tr>
                            <tr><th>Categoría</th>{items.map(p => <td key={p.id}>{p.categoryName}</td>)}</tr>
                            <tr><th>Disponibilidad</th>{items.map(p => <td key={p.id}>{p.stock > 0 ? `${p.stock} en stock` : "Agotado"}</td>)}</tr>
                            <tr><th>Colores</th>{items.map(p => <td key={p.id}><div className="swatches">{p.colors.map(c => <span key={c.name} className="swatch" style={{ background: c.hex }} title={c.name} />)}</div></td>)}</tr>
                            {specKeys.map(k => (
                                <tr key={k}><th>{k}</th>{items.map(p => <td key={p.id}>{p.specs?.[k] || <span className="muted">—</span>}</td>)}</tr>
                            ))}
                            <tr><th>Precio por plazo</th>{items.map(p => <td key={p.id} className="mono">3 × {money(p.price / 3)}</td>)}</tr>
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
