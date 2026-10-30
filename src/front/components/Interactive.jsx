import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft, RotateCcw, Sparkles, Plus, Clock } from "lucide-react";
import useGlobalReducer from "../hooks/useGlobalReducer";
import ProductArt from "./ProductArt";
import ProductCard from "./ProductCard";
import { Price, Stars } from "./ui";
import { money } from "../lib/pricing";
import { CATEGORIES } from "../lib/catalog";

// Número que cuenta hacia arriba cuando aparece en pantalla.
export function CountUp({ to, decimals = 0, suffix = "", duration = 1400 }) {
    const [value, setValue] = useState(0);
    const ref = useRef(null);
    useEffect(() => {
        const el = ref.current;
        let raf, start;
        const run = () => {
            const step = t => {
                start ??= t;
                const p = Math.min(1, (t - start) / duration);
                setValue(to * (1 - Math.pow(1 - p, 3)));
                if (p < 1) raf = requestAnimationFrame(step);
            };
            raf = requestAnimationFrame(step);
        };
        if (!("IntersectionObserver" in window)) { setValue(to); return; }
        const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { run(); io.disconnect(); } });
        io.observe(el);
        return () => { io.disconnect(); cancelAnimationFrame(raf); };
    }, [to, duration]);
    return <span ref={ref}>{value.toLocaleString("es-ES", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>;
}

// Escaparate del hero: rota entre productos destacados y se inclina siguiendo el ratón.
export function HeroShowcase({ products }) {
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });
    const product = products[index % products.length];

    useEffect(() => {
        if (paused || products.length < 2) return;
        const t = setInterval(() => setIndex(i => (i + 1) % products.length), 4500);
        return () => clearInterval(t);
    }, [paused, products.length]);

    const onMove = e => {
        const r = e.currentTarget.getBoundingClientRect();
        setTilt({ x: ((e.clientY - r.top) / r.height - 0.5) * -8, y: ((e.clientX - r.left) / r.width - 0.5) * 10 });
    };

    if (!product) return null;
    return (
        <div className="showcase" onMouseEnter={() => setPaused(true)} onMouseLeave={() => { setPaused(false); setTilt({ x: 0, y: 0 }); }} onMouseMove={onMove}>
            <div className="showcase-card" style={{ transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}>
                {products.map((p, i) => (
                    <div key={p.id} className={`showcase-slide ${i === index ? "active" : ""}`} aria-hidden={i !== index}>
                        <ProductArt product={p} eager={i === 0} />
                    </div>
                ))}
                <div className="showcase-info">
                    <div>
                        <span className="tiny" style={{ opacity: .7, textTransform: "uppercase", letterSpacing: ".08em" }}>{product.brand}</span>
                        <strong style={{ display: "block", fontSize: 20, fontFamily: "var(--display)" }}>{product.name}</strong>
                        <span className="small">{money(product.price)}</span>
                    </div>
                    <Link to={`/product/${product.id}/${product.slug}`} className="btn btn-light btn-sm">Ver <ArrowRight size={16} /></Link>
                </div>
                <div className="showcase-progress" key={`${index}-${paused}`}><span className={paused ? "" : "run"} /></div>
            </div>
            <div className="showcase-thumbs" role="tablist" aria-label="Productos destacados">
                {products.map((p, i) => (
                    <button key={p.id} role="tab" aria-selected={i === index} className={i === index ? "active" : ""} onClick={() => setIndex(i)} aria-label={p.name}>
                        <ProductArt product={p} />
                    </button>
                ))}
            </div>
        </div>
    );
}

// Pestañas por categoría con carrusel horizontal de productos.
export function CategoryTabs() {
    const { store } = useGlobalReducer();
    const [active, setActive] = useState(CATEGORIES[0].slug);
    const rowRef = useRef(null);
    const list = store.products.filter(p => p.category === active);
    const scroll = dir => rowRef.current?.scrollBy({ left: dir * rowRef.current.clientWidth * 0.8, behavior: "smooth" });
    return (
        <div>
            <div className="row-between" style={{ marginBottom: 24 }}>
                <div className="pill-tabs" role="tablist">
                    {CATEGORIES.map(c => (
                        <button key={c.slug} role="tab" aria-selected={active === c.slug} className={active === c.slug ? "active" : ""} onClick={() => { setActive(c.slug); rowRef.current?.scrollTo({ left: 0 }); }}>{c.name}</button>
                    ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <button className="icon-btn bordered" onClick={() => scroll(-1)} aria-label="Anterior"><ArrowLeft size={18} /></button>
                    <button className="icon-btn bordered" onClick={() => scroll(1)} aria-label="Siguiente"><ArrowRight size={18} /></button>
                </div>
            </div>
            <div className="h-scroll" ref={rowRef} key={active}>
                {list.map(p => <div key={p.id} className="h-item"><ProductCard product={p} /></div>)}
                <Link to={`/catalog?category=${active}`} className="h-item see-all">
                    <span className="arrow-circle"><ArrowRight size={22} /></span>
                    Ver todo en {CATEGORIES.find(c => c.slug === active)?.name}
                </Link>
            </div>
        </div>
    );
}

// Asistente: 3 preguntas y recomienda productos.
const QUIZ = [
    { q: "¿Para qué lo vas a usar sobre todo?", options: [
        { label: "Trabajar y estudiar", tags: ["laptops", "accessories"] },
        { label: "Jugar", tags: ["gaming"] },
        { label: "Música y series", tags: ["audio"] },
        { label: "Deporte y salud", tags: ["wearables"] },
        { label: "Fotos y redes", tags: ["smartphones"] },
    ] },
    { q: "¿Cuál es tu presupuesto?", options: [
        { label: "Hasta 150 €", max: 150 },
        { label: "150 – 600 €", min: 150, max: 600 },
        { label: "600 – 1.500 €", min: 600, max: 1500 },
        { label: "Sin límite", min: 0 },
    ] },
    { q: "¿Qué te importa más?", options: [
        { label: "Lo mejor valorado", sort: "rating" },
        { label: "El mejor precio", sort: "price" },
        { label: "Lo más nuevo", sort: "new" },
    ] },
];

export function DeviceQuiz() {
    const { store } = useGlobalReducer();
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState([]);
    const done = step >= QUIZ.length;

    const results = useMemo(() => {
        if (!done) return [];
        const [use, budget, pref] = answers;
        let list = store.products.filter(p => p.stock > 0 && use.tags.includes(p.category));
        const inBudget = list.filter(p => p.price >= (budget.min || 0) && p.price <= (budget.max || Infinity));
        if (inBudget.length) list = inBudget;
        const sorters = { rating: (a, b) => b.rating - a.rating, price: (a, b) => a.price - b.price, new: (a, b) => Number(b.is_new) - Number(a.is_new) || b.rating - a.rating };
        return [...list].sort(sorters[pref.sort]).slice(0, 3);
    }, [done, answers, store.products]);

    const pick = opt => { setAnswers(a => [...a.slice(0, step), opt]); setStep(s => s + 1); };
    const reset = () => { setStep(0); setAnswers([]); };

    return (
        <div className="quiz">
            <div className="quiz-side">
                <span className="eyebrow" style={{ color: "#ffb08f" }}><Sparkles size={14} /> Asistente de compra</span>
                <h2 className="display-2" style={{ marginTop: 16 }}>¿No sabes qué elegir?</h2>
                <p style={{ opacity: .7, marginTop: 12 }}>Responde 3 preguntas y te recomendamos lo ideal para ti.</p>
                <div className="quiz-steps">
                    {QUIZ.map((_, i) => <span key={i} className={i < step ? "done" : i === step ? "current" : ""} />)}
                </div>
            </div>
            <div className="quiz-body" aria-live="polite">
                {!done ? (
                    <div key={step} className="quiz-q">
                        <span className="tiny" style={{ opacity: .6 }}>Pregunta {step + 1} de {QUIZ.length}</span>
                        <h3 style={{ fontSize: 26, margin: "8px 0 20px" }}>{QUIZ[step].q}</h3>
                        <div className="quiz-options">
                            {QUIZ[step].options.map(o => (
                                <button key={o.label} className={answers[step]?.label === o.label ? "active" : ""} onClick={() => pick(o)}>{o.label} <ArrowRight size={16} /></button>
                            ))}
                        </div>
                        {step > 0 && <button className="link-btn" style={{ color: "rgba(255,255,255,.6)", marginTop: 16 }} onClick={() => setStep(s => s - 1)}>← Volver</button>}
                    </div>
                ) : (
                    <div className="quiz-q">
                        <div className="row-between" style={{ marginBottom: 16 }}>
                            <h3 style={{ fontSize: 26 }}>Tu selección perfecta</h3>
                            <button className="btn btn-sm" style={{ background: "rgba(255,255,255,.1)", color: "#fff" }} onClick={reset}><RotateCcw size={14} /> Repetir</button>
                        </div>
                        {results.length === 0 && <p style={{ opacity: .7 }}>No hay productos que encajen ahora mismo. ¡Prueba otras respuestas!</p>}
                        <div className="quiz-results">
                            {results.map((p, i) => (
                                <Link key={p.id} to={`/product/${p.id}/${p.slug}`} className="quiz-result" style={{ animationDelay: `${i * 90}ms` }}>
                                    <div className="thumb"><ProductArt product={p} /></div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        {i === 0 && <span className="badge badge-accent" style={{ marginBottom: 4 }}>Mejor opción</span>}
                                        <strong style={{ display: "block" }}>{p.name}</strong>
                                        <Stars value={p.rating} size={11} />
                                    </div>
                                    <strong className="mono">{money(p.price)}</strong>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Escena con puntos interactivos sobre los productos.
export function ShopTheSetup({ image, spots }) {
    const { store, actions } = useGlobalReducer();
    const [open, setOpen] = useState(spots[0]?.id);
    const items = spots.map(s => ({ ...s, product: store.products.find(p => p.slug === s.slug) })).filter(s => s.product);
    const total = items.reduce((sum, s) => sum + s.product.price, 0);
    return (
        <div className="setup">
            <div className="setup-scene">
                <img src={image} alt="Escritorio con productos TechDrop" loading="lazy" />
                {items.map(s => (
                    <button key={s.id} className={`hotspot ${open === s.id ? "open" : ""}`} style={{ left: `${s.x}%`, top: `${s.y}%` }}
                        onClick={() => setOpen(s.id)} aria-label={s.product.name}>
                        <Plus size={16} />
                    </button>
                ))}
                {items.filter(s => s.id === open).map(s => (
                    <div key={s.id} className="hotspot-card" style={{ left: `clamp(8px, calc(${s.x}% - 120px), calc(100% - 248px))`, top: `calc(${s.y}% + 28px)` }}>
                        <div className="thumb"><ProductArt product={s.product} /></div>
                        <div style={{ minWidth: 0 }}>
                            <strong className="small" style={{ display: "block" }}>{s.product.name}</strong>
                            <Price product={s.product} />
                        </div>
                        <Link to={`/product/${s.product.id}/${s.product.slug}`} className="icon-btn" aria-label="Ver producto"><ArrowRight size={16} /></Link>
                    </div>
                ))}
            </div>
            <div className="setup-list">
                <h3 className="h3">Compra el setup completo</h3>
                <p className="muted small">Toca los puntos de la imagen para descubrir cada producto.</p>
                {items.map(s => (
                    <button key={s.id} className={`setup-item ${open === s.id ? "active" : ""}`} onClick={() => setOpen(s.id)}>
                        <div className="thumb"><ProductArt product={s.product} /></div>
                        <span style={{ flex: 1, textAlign: "left" }} className="small"><strong>{s.product.name}</strong><br /><span className="muted">{s.product.categoryName}</span></span>
                        <strong className="small mono">{money(s.product.price)}</strong>
                    </button>
                ))}
                <button className="btn btn-primary btn-block" onClick={() => { items.forEach(s => s.product.stock > 0 && actions.addToCart(s.product)); }}>
                    Añadir todo · {money(total)}
                </button>
            </div>
        </div>
    );
}

export function RecentlyViewed({ exclude }) {
    const { store } = useGlobalReducer();
    const items = store.recent.filter(id => id !== exclude).map(id => store.products.find(p => p.id === id)).filter(Boolean).slice(0, 6);
    if (items.length < 2) return null;
    return (
        <section className="section" style={{ paddingBottom: 0 }}>
            <div className="section-head" style={{ marginBottom: 24 }}>
                <h2 className="h3" style={{ fontSize: 26, display: "flex", gap: 10, alignItems: "center" }}><Clock size={22} /> Vistos recientemente</h2>
            </div>
            <div className="h-scroll">
                {items.map(p => <div key={p.id} className="h-item sm"><ProductCard product={p} /></div>)}
            </div>
        </section>
    );
}
