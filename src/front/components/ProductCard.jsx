import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Plus, Eye, GitCompareArrows, Check } from "lucide-react";
import ProductArt from "./ProductArt";
import { Price, ProductBadges, Stars } from "./ui";
import useGlobalReducer from "../hooks/useGlobalReducer";

export default function ProductCard({ product }) {
    const { store, dispatch, actions } = useGlobalReducer();
    const [added, setAdded] = useState(false);
    const saved = store.wishlist.includes(product.id);
    const comparing = store.compare.includes(product.id);
    const url = `/product/${product.id}/${product.slug || ""}`;

    const add = () => {
        actions.addToCart(product);
        setAdded(true);
        setTimeout(() => setAdded(false), 1600);
    };

    return (
        <article className="pcard">
            <div className="media">
                <Link to={url} aria-label={product.name} tabIndex={-1}>
                    <ProductArt product={product} />
                    {/* Segunda vista al pasar el ratón */}
                    {product.image && <span className="alt-view"><ProductArt product={product} view={1} /></span>}
                </Link>
                <div className="badges"><ProductBadges product={product} /></div>
                <div className="side-actions">
                    <button
                        className={`fav ${saved ? "on" : ""}`}
                        aria-label={saved ? "Quitar de favoritos" : "Guardar en favoritos"}
                        aria-pressed={saved}
                        onClick={() => actions.toggleWishlist(product, saved)}
                    >
                        <Heart size={18} fill={saved ? "currentColor" : "none"} />
                    </button>
                    <button className="fav reveal-on-hover" aria-label="Vista rápida" onClick={() => dispatch({ type: "QUICK_VIEW", payload: product.id })}>
                        <Eye size={18} />
                    </button>
                    <button className={`fav reveal-on-hover ${comparing ? "on" : ""}`} aria-label={comparing ? "Quitar del comparador" : "Añadir al comparador"} aria-pressed={comparing}
                        onClick={() => dispatch({ type: "TOGGLE_COMPARE", payload: product.id })}>
                        <GitCompareArrows size={18} />
                    </button>
                </div>
                {product.stock > 0 && (
                    <div className="quick">
                        <button className={`btn btn-block ${added ? "btn-success" : "btn-primary"}`} onClick={add}>
                            {added ? <><Check size={18} /> Añadido</> : <><Plus size={18} /> Añadir al carrito</>}
                        </button>
                    </div>
                )}
            </div>
            <Link to={url} className="info">
                <span className="brand">{product.brand}</span>
                <h3>{product.name}</h3>
                <div className="row">
                    <Price product={product} />
                    <Stars value={product.rating} showNumber size={12} />
                </div>
                {product.colors?.length > 1 && (
                    <div className="swatches" aria-label={`${product.colors.length} colores`}>
                        {product.colors.map(c => <span key={c.name} className="swatch" style={{ background: c.hex }} title={c.name} />)}
                    </div>
                )}
            </Link>
        </article>
    );
}

export function ProductCardSkeleton() {
    return (
        <div className="pcard" aria-hidden>
            <div className="media skeleton" />
            <div className="info">
                <div className="skeleton" style={{ height: 12, width: "30%" }} />
                <div className="skeleton" style={{ height: 18, width: "70%" }} />
                <div className="skeleton" style={{ height: 16, width: "40%" }} />
            </div>
        </div>
    );
}
