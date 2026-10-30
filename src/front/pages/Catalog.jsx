import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X, SearchX, Star } from "lucide-react";
import useGlobalReducer from "../hooks/useGlobalReducer";
import ProductCard from "../components/ProductCard";
import { Breadcrumbs, usePageTitle } from "../components/ui";
import { BRANDS, CATEGORIES, categoryBySlug, discountPercent } from "../lib/catalog";

const SORTS = {
    relevance: "Relevancia",
    price_asc: "Precio: menor a mayor",
    price_desc: "Precio: mayor a menor",
    rating: "Mejor valorados",
    newest: "Novedades",
    discount: "Mayor descuento",
};

const PAGE_SIZE = 12;

export default function Catalog() {
    const { store } = useGlobalReducer();
    const [params, setParams] = useSearchParams();
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [visible, setVisible] = useState(PAGE_SIZE);

    const category = params.get("category") || "";
    const brand = params.get("brand") || "";
    const q = params.get("q") || "";
    const sort = params.get("sort") || "relevance";
    const min = params.get("min") || "";
    const max = params.get("max") || "";
    const rating = Number(params.get("rating") || 0);
    const inStock = params.get("stock") === "1";
    const onlyNew = params.get("new") === "1";
    const onlyFeatured = params.get("featured") === "1";

    const cat = categoryBySlug(category);
    usePageTitle(q ? `Resultados para “${q}”` : cat ? cat.name : "Tienda");

    const update = (patch) => {
        const next = new URLSearchParams(params);
        Object.entries(patch).forEach(([k, v]) => (v === "" || v === null || v === false ? next.delete(k) : next.set(k, v)));
        setParams(next, { replace: true });
        setVisible(PAGE_SIZE);
    };

    const products = useMemo(() => {
        const term = q.trim().toLowerCase();
        let list = store.products.filter(p =>
            (!category || p.category === category) &&
            (!brand || p.brand === brand) &&
            (!term || `${p.name} ${p.brand} ${p.categoryName} ${p.short}`.toLowerCase().includes(term)) &&
            (!min || p.price >= Number(min)) &&
            (!max || p.price <= Number(max)) &&
            (!rating || p.rating >= rating) &&
            (!inStock || p.stock > 0) &&
            (!onlyNew || p.is_new) &&
            (!onlyFeatured || p.is_featured)
        );
        const sorters = {
            price_asc: (a, b) => a.price - b.price,
            price_desc: (a, b) => b.price - a.price,
            rating: (a, b) => b.rating - a.rating,
            newest: (a, b) => Number(b.is_new) - Number(a.is_new) || b.id - a.id,
            discount: (a, b) => discountPercent(b) - discountPercent(a),
            relevance: (a, b) => Number(b.is_featured) - Number(a.is_featured) || (b.stock > 0) - (a.stock > 0) || b.reviews_count - a.reviews_count,
        };
        return [...list].sort(sorters[sort] || sorters.relevance);
    }, [store.products, category, brand, q, min, max, rating, inStock, onlyNew, onlyFeatured, sort]);

    const countBy = (key, value) => store.products.filter(p => p[key] === value).length;

    const chips = [
        cat && { label: cat.name, clear: { category: "" } },
        brand && { label: brand, clear: { brand: "" } },
        q && { label: `“${q}”`, clear: { q: "" } },
        (min || max) && { label: `${min || 0} € – ${max || "∞"} €`, clear: { min: "", max: "" } },
        rating && { label: `${rating}+ estrellas`, clear: { rating: "" } },
        inStock && { label: "En stock", clear: { stock: "" } },
        onlyNew && { label: "Novedades", clear: { new: "" } },
        onlyFeatured && { label: "Destacados", clear: { featured: "" } },
    ].filter(Boolean);

    const title = q ? `Resultados para “${q}”` : cat ? cat.name : onlyNew ? "Novedades" : sort === "discount" ? "Ofertas" : "Toda la tienda";
    const subtitle = cat ? cat.tagline : "Tecnología seleccionada, con envío en 24 h y 2 años de garantía.";

    return (
        <div className="container">
            <div className="page-head">
                <Breadcrumbs items={[{ label: "Inicio", to: "/" }, { label: "Tienda", to: cat ? "/catalog" : undefined }, cat && { label: cat.name }].filter(Boolean)} />
                <h1 className="display-2">{title}</h1>
                <p className="lead" style={{ marginTop: 12 }}>{subtitle}</p>
            </div>

            <div className="catalog-layout">
                <aside className={`filters ${filtersOpen ? "open" : ""}`} aria-label="Filtros">
                    <div className="row-between" style={{ display: filtersOpen ? "flex" : "none" }}>
                        <h3 className="h3">Filtros</h3>
                        <button className="icon-btn" onClick={() => setFiltersOpen(false)} aria-label="Cerrar filtros"><X size={20} /></button>
                    </div>
                    <div className="filter-group">
                        <h4>Categoría</h4>
                        <div className="filter-list">
                            <button className={!category ? "active" : ""} onClick={() => update({ category: "" })}>Todas <span className="n">{store.products.length}</span></button>
                            {CATEGORIES.map(c => (
                                <button key={c.slug} className={category === c.slug ? "active" : ""} onClick={() => update({ category: c.slug })}>
                                    {c.name} <span className="n">{countBy("category", c.slug)}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="filter-group">
                        <h4>Marca</h4>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {BRANDS.map(b => (
                                <button key={b} className={`chip ${brand === b ? "active" : ""}`} onClick={() => update({ brand: brand === b ? "" : b })}>{b}</button>
                            ))}
                        </div>
                    </div>
                    <div className="filter-group">
                        <h4>Precio (€)</h4>
                        <div className="range">
                            <input className="input" type="number" min="0" placeholder="Mín." value={min} onChange={e => update({ min: e.target.value })} aria-label="Precio mínimo" />
                            <input className="input" type="number" min="0" placeholder="Máx." value={max} onChange={e => update({ max: e.target.value })} aria-label="Precio máximo" />
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                            {[[0, 100], [100, 500], [500, 1000], [1000, ""]].map(([a, b]) => (
                                <button key={a} className="chip" style={{ height: 32, fontSize: 13 }} onClick={() => update({ min: a || "", max: b })}>
                                    {b ? `${a}–${b} €` : `+${a} €`}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="filter-group">
                        <h4>Valoración</h4>
                        <div className="filter-list">
                            {[4.5, 4].map(r => (
                                <button key={r} className={rating === r ? "active" : ""} onClick={() => update({ rating: rating === r ? "" : r })}>
                                    <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><Star size={14} fill="currentColor" strokeWidth={0} /> {String(r).replace(".", ",")} o más</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="filter-group" style={{ display: "grid", gap: 12 }}>
                        <h4 style={{ marginBottom: 0 }}>Disponibilidad</h4>
                        <label className="checkbox"><input type="checkbox" checked={inStock} onChange={e => update({ stock: e.target.checked ? "1" : "" })} /> Solo en stock</label>
                        <label className="checkbox"><input type="checkbox" checked={onlyNew} onChange={e => update({ new: e.target.checked ? "1" : "" })} /> Solo novedades</label>
                    </div>
                    {filtersOpen && <button className="btn btn-primary btn-block" onClick={() => setFiltersOpen(false)}>Ver {products.length} productos</button>}
                </aside>

                <div>
                    <div className="toolbar">
                        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                            <button className="btn btn-outline btn-sm filters-toggle" onClick={() => setFiltersOpen(true)}><SlidersHorizontal size={16} /> Filtros {chips.length > 0 && `(${chips.length})`}</button>
                            <span className="muted small">{products.length} {products.length === 1 ? "producto" : "productos"}</span>
                        </div>
                        <select className="select" value={sort} onChange={e => update({ sort: e.target.value === "relevance" ? "" : e.target.value })} aria-label="Ordenar">
                            {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                    </div>
                    {chips.length > 0 && (
                        <div className="active-filters" style={{ marginBottom: 24 }}>
                            {chips.map(c => (
                                <button key={c.label} className="chip active" onClick={() => update(c.clear)}>{c.label} <X size={14} /></button>
                            ))}
                            <button className="link-btn" onClick={() => { setParams({}, { replace: true }); }}>Limpiar todo</button>
                        </div>
                    )}
                    {products.length === 0 ? (
                        <div className="empty">
                            <div className="ico"><SearchX size={28} /></div>
                            <h3 className="h3">No encontramos productos</h3>
                            <p className="muted">Prueba a quitar algún filtro o buscar otro término.</p>
                            <button className="btn btn-primary" onClick={() => setParams({}, { replace: true })}>Ver todo el catálogo</button>
                        </div>
                    ) : (
                        <>
                            <div className="product-grid cols-3">
                                {products.slice(0, visible).map(p => <ProductCard key={p.id} product={p} />)}
                            </div>
                            {visible < products.length && (
                                <div style={{ textAlign: "center", marginTop: 48, display: "grid", gap: 12, justifyItems: "center" }}>
                                    <span className="muted small">Mostrando {visible} de {products.length}</span>
                                    <button className="btn btn-outline btn-lg" onClick={() => setVisible(v => v + PAGE_SIZE)}>Cargar más productos</button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
