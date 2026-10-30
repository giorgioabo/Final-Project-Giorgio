import { Link, useLocation } from "react-router-dom";
import { X, GitCompareArrows } from "lucide-react";
import useGlobalReducer from "../hooks/useGlobalReducer";
import ProductArt from "./ProductArt";

// Barra flotante con los productos elegidos para comparar.
export default function CompareBar() {
    const { store, dispatch } = useGlobalReducer();
    const { pathname } = useLocation();
    const items = store.compare.map(id => store.products.find(p => p.id === id)).filter(Boolean);
    if (!items.length || pathname === "/compare" || pathname === "/checkout") return null;

    return (
        <div className="compare-bar" role="region" aria-label="Comparador">
            <span className="small hide-mobile" style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 600 }}>
                <GitCompareArrows size={18} /> Comparar
            </span>
            <div className="compare-slots">
                {[0, 1, 2].map(i => {
                    const p = items[i];
                    return p ? (
                        <div key={p.id} className="compare-slot filled" title={p.name}>
                            <ProductArt product={p} />
                            <button onClick={() => dispatch({ type: "TOGGLE_COMPARE", payload: p.id })} aria-label={`Quitar ${p.name}`}><X size={12} /></button>
                        </div>
                    ) : <div key={i} className="compare-slot">+</div>;
                })}
            </div>
            <Link to="/compare" className={`btn btn-accent btn-sm ${items.length < 2 ? "disabled" : ""}`} aria-disabled={items.length < 2}
                onClick={e => items.length < 2 && e.preventDefault()}>
                {items.length < 2 ? "Elige otro" : `Comparar ${items.length}`}
            </Link>
            <button className="icon-btn" style={{ color: "#fff", width: 36, height: 36 }} onClick={() => dispatch({ type: "CLEAR_COMPARE" })} aria-label="Vaciar comparador"><X size={16} /></button>
        </div>
    );
}
