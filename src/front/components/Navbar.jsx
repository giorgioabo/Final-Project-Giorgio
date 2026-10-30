import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, ShoppingBag, Heart, User, Menu, X, Zap, LogOut, Package, LayoutDashboard } from "lucide-react";
import useGlobalReducer from "../hooks/useGlobalReducer";
import ProductArt from "./ProductArt";
import { money } from "../lib/pricing";
import { Avatar } from "./ui";

const NAV_ITEMS = [
    { to: "/", label: "Inicio" },
    { to: "/catalog", label: "Tienda" },
    { to: "/catalog?sort=discount", label: "Ofertas" },
    { to: "/catalog?new=1", label: "Novedades" },
];

export function Logo() {
    return (
        <Link to="/" className="logo" aria-label="TechDrop, inicio">
            <span className="logo-mark"><Zap size={18} fill="currentColor" strokeWidth={0} /></span>
            TechDrop
        </Link>
    );
}

function SearchBox({ className = "", onDone }) {
    const { store } = useGlobalReducer();
    const navigate = useNavigate();
    const [q, setQ] = useState("");
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(0);
    const boxRef = useRef(null);

    const results = useMemo(() => {
        const term = q.trim().toLowerCase();
        if (term.length < 2) return [];
        return store.products
            .filter(p => `${p.name} ${p.brand} ${p.categoryName}`.toLowerCase().includes(term))
            .slice(0, 6);
    }, [q, store.products]);

    useEffect(() => {
        const close = e => { if (!boxRef.current?.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, []);

    const go = path => { setOpen(false); setQ(""); onDone?.(); navigate(path); };

    const onKeyDown = e => {
        if (e.key === "ArrowDown") { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)); }
        if (e.key === "ArrowUp") { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
        if (e.key === "Escape") setOpen(false);
        if (e.key === "Enter") {
            e.preventDefault();
            const hit = results[active];
            go(hit && open ? `/product/${hit.id}/${hit.slug}` : `/catalog?q=${encodeURIComponent(q.trim())}`);
        }
    };

    return (
        <div className={`nav-search ${className}`} ref={boxRef}>
            <Search size={18} />
            <input
                type="search"
                placeholder="Buscar productos, marcas…"
                value={q}
                onChange={e => { setQ(e.target.value); setOpen(true); setActive(0); }}
                onFocus={() => setOpen(true)}
                onKeyDown={onKeyDown}
                aria-label="Buscar productos"
                role="combobox"
                aria-expanded={open && results.length > 0}
            />
            {open && q.trim().length >= 2 && (
                <div className="search-results" role="listbox">
                    {results.length === 0 && <p className="muted small" style={{ padding: 12 }}>Sin resultados para “{q}”.</p>}
                    {results.map((p, i) => (
                        <button
                            key={p.id}
                            className={`search-item ${i === active ? "active" : ""}`}
                            style={{ width: "100%", border: 0, background: undefined, textAlign: "left" }}
                            onMouseEnter={() => setActive(i)}
                            onClick={() => go(`/product/${p.id}/${p.slug}`)}
                            role="option"
                            aria-selected={i === active}
                        >
                            <span className="thumb"><ProductArt product={p} /></span>
                            <span style={{ flex: 1 }}>
                                <span className="small" style={{ fontWeight: 600, display: "block" }}>{p.name}</span>
                                <span className="tiny muted">{p.categoryName}</span>
                            </span>
                            <span className="small" style={{ fontWeight: 600 }}>{money(p.price)}</span>
                        </button>
                    ))}
                    {results.length > 0 && (
                        <button className="btn btn-ghost btn-sm btn-block" style={{ marginTop: 4 }} onClick={() => go(`/catalog?q=${encodeURIComponent(q.trim())}`)}>
                            Ver todos los resultados
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default function Navbar() {
    const { store, dispatch, actions } = useGlobalReducer();
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [userOpen, setUserOpen] = useState(false);
    const location = useLocation();
    const userRef = useRef(null);
    const cartCount = store.cart.reduce((n, l) => n + l.quantity, 0);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => { setMenuOpen(false); setUserOpen(false); }, [location.pathname]);

    useEffect(() => {
        const close = e => { if (!userRef.current?.contains(e.target)) setUserOpen(false); };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, []);

    return (
        <>
            <div className="announce">
                Envío gratis desde 99 € · Usa <strong>TECHDROP10</strong> y ahorra un 10% en tu primer pedido
            </div>
            <header className={`nav ${scrolled ? "scrolled" : ""}`}>
                <div className="container">
                    <button className="icon-btn menu-toggle" aria-label="Abrir menú" onClick={() => setMenuOpen(o => !o)}>
                        {menuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                    <Logo />
                    <nav className="nav-links" aria-label="Principal">
                        {NAV_ITEMS.map(item => {
                            const current = location.pathname + location.search;
                            const active = item.to === "/catalog"
                                ? location.pathname === "/catalog" && !NAV_ITEMS.some(i => i.to !== "/catalog" && i.to === current)
                                : current === item.to;
                            return <Link key={item.to} to={item.to} className={active ? "active" : ""}>{item.label}</Link>;
                        })}
                    </nav>
                    <SearchBox className="desktop" />
                    <div className="nav-actions">
                        <Link to="/account?tab=wishlist" className="icon-btn hide-mobile" aria-label="Favoritos">
                            <Heart size={20} />
                            {store.wishlist.length > 0 && <span className="count">{store.wishlist.length}</span>}
                        </Link>
                        <div className="user-menu" ref={userRef}>
                            {store.user ? (
                                <button className="icon-btn" aria-label="Mi cuenta" onClick={() => setUserOpen(o => !o)}>
                                    <Avatar name={store.user.name} size={32} />
                                </button>
                            ) : (
                                <Link to="/login" className="icon-btn" aria-label="Iniciar sesión"><User size={20} /></Link>
                            )}
                            {userOpen && store.user && (
                                <div className="dropdown">
                                    <div className="head">
                                        <strong className="small" style={{ display: "block" }}>{store.user.name}</strong>
                                        <span className="tiny muted">{store.user.email}</span>
                                    </div>
                                    <Link to="/account"><User size={16} /> Mi cuenta</Link>
                                    <Link to="/account?tab=orders"><Package size={16} /> Mis pedidos</Link>
                                    {store.user.is_admin && <Link to="/admin"><LayoutDashboard size={16} /> Panel de administración</Link>}
                                    <button onClick={() => { setUserOpen(false); actions.signOut(); }}><LogOut size={16} /> Cerrar sesión</button>
                                </div>
                            )}
                        </div>
                        <button className="icon-btn" aria-label={`Carrito, ${cartCount} ${cartCount === 1 ? "producto" : "productos"}`} onClick={() => dispatch({ type: "TOGGLE_CART", payload: true })}>
                            <ShoppingBag size={20} />
                            {cartCount > 0 && <span className="count" key={cartCount}>{cartCount}</span>}
                        </button>
                    </div>
                </div>
            </header>
            {menuOpen && (
                <div className="mobile-menu">
                    <SearchBox onDone={() => setMenuOpen(false)} />
                    <div style={{ height: 8 }} />
                    <Link to="/">Inicio</Link>
                    <Link to="/catalog">Tienda</Link>
                    <Link to="/catalog?sort=discount">Ofertas</Link>
                    <Link to="/catalog?new=1">Novedades</Link>
                    <Link to="/account?tab=wishlist">Favoritos</Link>
                    <Link to={store.user ? "/account" : "/login"}>{store.user ? "Mi cuenta" : "Iniciar sesión"}</Link>
                </div>
            )}
        </>
    );
}
