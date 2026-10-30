import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { money } from "../lib/pricing";
import { discountPercent } from "../lib/catalog";

export function Stars({ value, count, size = 14, showNumber = true }) {
    return (
        <span className="stars" aria-label={`${value} de 5 estrellas`}>
            {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} size={size} fill={value >= i - 0.25 ? "currentColor" : "none"} strokeWidth={value >= i - 0.25 ? 0 : 1.6} />
            ))}
            {showNumber && <span className="num">{Number(value).toFixed(1)}</span>}
            {count !== undefined && <span className="cnt">({count})</span>}
        </span>
    );
}

export function Price({ product, large = false }) {
    return (
        <span className={`price ${large ? "lg" : ""}`}>
            <span className="now">{money(product.price)}</span>
            {product.compare_at_price > product.price && <span className="was">{money(product.compare_at_price)}</span>}
        </span>
    );
}

export function ProductBadges({ product }) {
    const off = discountPercent(product);
    return (
        <>
            {product.stock <= 0 && <span className="badge badge-dark">Agotado</span>}
            {product.stock > 0 && off > 0 && <span className="badge badge-accent">-{off}%</span>}
            {product.stock > 0 && product.is_new && <span className="badge" style={{ background: "#fff" }}>Nuevo</span>}
        </>
    );
}

export function StockLine({ stock }) {
    if (stock <= 0) return <span className="stock-line out"><span className="dot" />Agotado temporalmente</span>;
    if (stock <= 10) return <span className="stock-line low"><span className="dot" />¡Solo quedan {stock}!</span>;
    return <span className="stock-line"><span className="dot" />En stock · Envío en 24 h</span>;
}

export function Breadcrumbs({ items }) {
    return (
        <nav className="breadcrumbs" aria-label="Migas de pan">
            {items.map((it, i) => (
                <span key={i} style={{ display: "contents" }}>
                    {i > 0 && <span aria-hidden>/</span>}
                    {it.to ? <Link to={it.to}>{it.label}</Link> : <span style={{ color: "var(--ink)" }}>{it.label}</span>}
                </span>
            ))}
        </nav>
    );
}

// Animación de aparición al hacer scroll.
export function Reveal({ as: Tag = "div", delay = 0, className = "", children, ...rest }) {
    const ref = useRef(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        // Lo que ya está en pantalla al cargar aparece sin esperar al scroll.
        if (!("IntersectionObserver" in window) || el.getBoundingClientRect().top < window.innerHeight) {
            const t = setTimeout(() => el.classList.add("in"), 20);
            return () => clearTimeout(t);
        }
        const io = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) { el.classList.add("in"); io.disconnect(); }
        }, { threshold: 0.12 });
        io.observe(el);
        return () => io.disconnect();
    }, []);
    return <Tag ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }} {...rest}>{children}</Tag>;
}

export function usePageTitle(title) {
    useEffect(() => {
        document.title = title ? `${title} · TechDrop` : "TechDrop — Tecnología premium con envío en 24 h";
    }, [title]);
}

const AVATAR_COLORS = ["#ff5b1f", "#2f6bff", "#12a150", "#8b5cf6", "#e0352b", "#c27a00"];
export function Avatar({ name = "?", size = 44 }) {
    const initials = name.split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();
    const color = AVATAR_COLORS[name.length % AVATAR_COLORS.length];
    return <span className="avatar" style={{ background: color, width: size, height: size, fontSize: size * 0.38 }}>{initials}</span>;
}
