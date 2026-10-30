import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Truck, ShieldCheck, RotateCcw, Headphones, BadgeCheck, Sparkles, Zap } from "lucide-react";
import useGlobalReducer from "../hooks/useGlobalReducer";
import ProductArt from "../components/ProductArt";
import ProductCard from "../components/ProductCard";
import { Reveal, Stars, usePageTitle, Avatar } from "../components/ui";
import { CATEGORIES, discountPercent } from "../lib/catalog";
import { money } from "../lib/pricing";
import { CountUp, HeroShowcase, CategoryTabs, DeviceQuiz, ShopTheSetup, RecentlyViewed } from "../components/Interactive";

// Posición (en %) de cada producto dentro de la foto del escritorio.
const SETUP_SPOTS = [
    { id: "laptop", slug: "kairo-book-14", x: 49, y: 37 },
    { id: "headphones", slug: "lumen-h9", x: 67, y: 64 },
    { id: "keyboard", slug: "kairo-keys-75", x: 23, y: 71 },
    { id: "mouse", slug: "kairo-glide-mouse", x: 50, y: 81 },
];

function useCountdown() {
    // Oferta que se renueva cada domingo a medianoche.
    const target = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7));
        d.setHours(23, 59, 59, 0);
        return d.getTime();
    }, []);
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(t);
    }, []);
    const s = Math.max(0, Math.floor((target - now) / 1000));
    return { d: Math.floor(s / 86400), h: Math.floor(s / 3600) % 24, m: Math.floor(s / 60) % 60, s: s % 60 };
}

const TESTIMONIALS = [
    { name: "Laura Méndez", role: "Diseñadora UX", text: "Pedí el Kairo Book 14 un lunes por la noche y el martes ya estaba trabajando con él. La experiencia de compra fue impecable." },
    { name: "Andrés Ruiz", role: "Streamer", text: "Los mejores precios que he encontrado en periféricos gaming, y el soporte me respondió en minutos cuando tuve una duda." },
    { name: "Carmen Ortega", role: "Fotógrafa", text: "Me encanta que cada producto tenga especificaciones claras y reseñas reales. Compré con total confianza." },
];

const PERKS = [
    { icon: Truck, title: "Envío en 24 h", text: "Gratis en pedidos desde 99 €. Recíbelo mañana en península." },
    { icon: ShieldCheck, title: "2 años de garantía", text: "Todos los productos, sin letra pequeña ni sorpresas." },
    { icon: RotateCcw, title: "30 días de devolución", text: "¿No te convence? Te devolvemos el dinero, sin preguntas." },
    { icon: Headphones, title: "Soporte experto", text: "Personas reales que saben de tecnología, 7 días a la semana." },
];

export default function Home() {
    usePageTitle();
    const { store, actions } = useGlobalReducer();
    const { products } = store;
    const t = useCountdown();
    const [email, setEmail] = useState("");

    const featured = products.filter(p => p.is_featured).slice(0, 8);
    const newest = products.filter(p => p.is_new).slice(0, 4);
    const deal = [...products].filter(p => p.stock > 0).sort((a, b) => discountPercent(b) - discountPercent(a))[0];
    const heroProducts = ["lumen-h9", "kairo-book-14", "nova-x1-pro", "orbit-go"]
        .map(slug => products.find(p => p.slug === slug)).filter(Boolean);
    const count = slug => products.filter(p => p.category === slug).length;

    const subscribe = e => {
        e.preventDefault();
        if (!/^\S+@\S+\.\S+$/.test(email)) return actions.toast("Introduce un email válido", "danger");
        setEmail("");
        actions.toast("¡Listo! Te avisaremos de las mejores ofertas");
    };

    return (
        <>
            {/* HERO */}
            <section className="hero">
                <div className="container hero-grid">
                    <div>
                        <div><span className="eyebrow"><Sparkles size={14} /> Nueva colección otoño 2026</span></div>
                        <div>
                            <h1 className="display-1" style={{ marginTop: 20 }}>
                                Tecnología que <span className="accent">se siente</span> premium.
                            </h1>
                        </div>
                        <div>
                            <p className="lead">Smartphones, portátiles, audio y gaming seleccionados por expertos. Envío en 24 h, 2 años de garantía y devoluciones gratis.</p>
                        </div>
                        <div className="hero-cta">
                            <Link to="/catalog" className="btn btn-primary btn-lg">Explorar la tienda <ArrowRight size={18} /></Link>
                            <Link to="/catalog?sort=discount" className="btn btn-outline btn-lg">Ver ofertas</Link>
                        </div>
                        <div className="hero-stats">
                            <div><strong><CountUp to={50} suffix="k+" /></strong><span>clientes felices</span></div>
                            <div><strong><CountUp to={4.8} decimals={1} suffix="/5" /></strong><span>valoración media</span></div>
                            <div><strong><CountUp to={24} suffix=" h" /></strong><span>entrega express</span></div>
                        </div>
                    </div>
                    <div style={{ position: "relative" }}>
                        <HeroShowcase products={heroProducts} />
                        <div className="hero-floating" style={{ top: "12%", bottom: "auto", left: -24 }}>
                            <span className="dot"><BadgeCheck size={20} /></span>
                            <div>
                                <strong className="small" style={{ display: "block" }}>Envío gratis</strong>
                                <span className="tiny muted">en pedidos desde 99 €</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* MARQUEE */}
            <div className="marquee" aria-hidden>
                <div className="marquee-track">
                    {[0, 1].map(k => (
                        <div key={k} style={{ display: "flex", gap: 56 }}>
                            {["Nova", "Kairo", "Lumen", "Aurion", "Volt", "Pulse", "Orbit"].map(b => <span key={b}><Zap size={18} fill="currentColor" strokeWidth={0} />{b}</span>)}
                        </div>
                    ))}
                </div>
            </div>

            {/* CATEGORIES */}
            <section className="section">
                <div className="container">
                    <Reveal className="section-head">
                        <div>
                            <span className="eyebrow">Categorías</span>
                            <h2 className="display-2" style={{ marginTop: 12 }}>Encuentra tu próximo favorito</h2>
                        </div>
                        <Link to="/catalog" className="btn btn-outline">Ver todo <ArrowRight size={16} /></Link>
                    </Reveal>
                    <div className="cat-grid">
                        {CATEGORIES.map((c, i) => {
                            const sample = products.find(p => p.category === c.slug);
                            return (
                                <Reveal key={c.slug} delay={i * 60}>
                                    <Link to={`/catalog?category=${c.slug}`} className="cat-card">
                                        <div className="art">{sample && <ProductArt product={sample} />}</div>
                                        <div className="meta">
                                            <div>
                                                <h3>{c.name}</h3>
                                                <span className="tiny muted">{count(c.slug)} productos</span>
                                            </div>
                                            <span className="arrow"><ArrowRight size={16} /></span>
                                        </div>
                                    </Link>
                                </Reveal>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* FEATURED */}
            <section className="section" style={{ paddingTop: 0 }}>
                <div className="container">
                    <Reveal className="section-head">
                        <div>
                            <span className="eyebrow">Destacados</span>
                            <h2 className="display-2" style={{ marginTop: 12 }}>Lo más deseado de la temporada</h2>
                        </div>
                        <Link to="/catalog?featured=1" className="btn btn-outline">Ver destacados <ArrowRight size={16} /></Link>
                    </Reveal>
                    <div className="product-grid">
                        {featured.map((p, i) => <Reveal key={p.id} delay={(i % 4) * 70}><ProductCard product={p} /></Reveal>)}
                    </div>
                </div>
            </section>

            {/* PROMOS */}
            {deal && (
                <section className="section" style={{ paddingTop: 0 }}>
                    <div className="container promo-grid">
                        <Reveal className="promo dark">
                            <div>
                                <span className="badge badge-accent">Oferta de la semana · -{discountPercent(deal)}%</span>
                                <h2 className="display-2" style={{ marginTop: 20 }}>{deal.name}</h2>
                                <p style={{ opacity: .7, marginTop: 12 }}>{deal.short}</p>
                            </div>
                            <div style={{ display: "grid", gap: 20 }}>
                                <div className="countdown" aria-label="Tiempo restante de la oferta">
                                    <div><strong>{String(t.d).padStart(2, "0")}</strong><span>días</span></div>
                                    <div><strong>{String(t.h).padStart(2, "0")}</strong><span>horas</span></div>
                                    <div><strong>{String(t.m).padStart(2, "0")}</strong><span>min</span></div>
                                    <div><strong>{String(t.s).padStart(2, "0")}</strong><span>seg</span></div>
                                </div>
                                <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                                    <Link to={`/product/${deal.id}/${deal.slug}`} className="btn btn-accent btn-lg">Comprar por {money(deal.price)}</Link>
                                    <span style={{ opacity: .6, textDecoration: "line-through" }}>{money(deal.compare_at_price)}</span>
                                </div>
                            </div>
                            <div className="art"><ProductArt product={deal} bare /></div>
                        </Reveal>
                        <Reveal delay={100} className="promo accent">
                            <div>
                                <span className="badge" style={{ background: "rgba(255,255,255,.2)", color: "#fff" }}>Primer pedido</span>
                                <h2 className="display-2" style={{ marginTop: 20 }}>10% de descuento</h2>
                                <p style={{ opacity: .9, marginTop: 12 }}>Usa el código <strong>TECHDROP10</strong> al finalizar tu compra.</p>
                            </div>
                            <Link to="/catalog" className="btn btn-light btn-lg" style={{ justifySelf: "start" }}>Empezar a comprar <ArrowUpRight size={18} /></Link>
                        </Reveal>
                    </div>
                </section>
            )}

            {/* NEW */}
            {newest.length > 0 && (
                <section className="section" style={{ paddingTop: 0 }}>
                    <div className="container">
                        <Reveal className="section-head">
                            <div>
                                <span className="eyebrow">Recién llegados</span>
                                <h2 className="display-2" style={{ marginTop: 12 }}>Novedades</h2>
                            </div>
                            <Link to="/catalog?new=1" className="btn btn-outline">Ver novedades <ArrowRight size={16} /></Link>
                        </Reveal>
                        <div className="product-grid">
                            {newest.map((p, i) => <Reveal key={p.id} delay={i * 70}><ProductCard product={p} /></Reveal>)}
                        </div>
                    </div>
                </section>
            )}

            {/* SHOP BY CATEGORY */}
            <section className="section" style={{ paddingTop: 0 }}>
                <div className="container">
                    <Reveal className="section-head" style={{ marginBottom: 24 }}>
                        <div>
                            <span className="eyebrow">Explora</span>
                            <h2 className="display-2" style={{ marginTop: 12 }}>Compra por categoría</h2>
                        </div>
                    </Reveal>
                    <CategoryTabs />
                </div>
            </section>

            {/* QUIZ */}
            <section className="section" style={{ paddingTop: 0 }}>
                <div className="container"><Reveal><DeviceQuiz /></Reveal></div>
            </section>

            {/* SETUP */}
            <section className="section" style={{ paddingTop: 0 }}>
                <div className="container">
                    <Reveal className="section-head" style={{ marginBottom: 24 }}>
                        <div>
                            <span className="eyebrow">Inspiración</span>
                            <h2 className="display-2" style={{ marginTop: 12 }}>El setup perfecto</h2>
                        </div>
                    </Reveal>
                    <ShopTheSetup image="/setup-desk.webp" spots={SETUP_SPOTS} />
                </div>
            </section>

            {/* PERKS */}
            <section className="section" style={{ paddingTop: 0 }}>
                <div className="container perks">
                    {PERKS.map(({ icon: Icon, title, text }, i) => (
                        <Reveal key={title} delay={i * 70} className="perk">
                            <span className="ico"><Icon size={22} /></span>
                            <h3>{title}</h3>
                            <p className="muted small">{text}</p>
                        </Reveal>
                    ))}
                </div>
            </section>

            {/* TESTIMONIALS */}
            <section className="section" style={{ paddingTop: 0 }}>
                <div className="container">
                    <Reveal className="section-head">
                        <div>
                            <span className="eyebrow">Opiniones</span>
                            <h2 className="display-2" style={{ marginTop: 12 }}>Lo que dicen nuestros clientes</h2>
                        </div>
                        <Stars value={4.8} count="12.400 reseñas" size={18} />
                    </Reveal>
                    <div className="testimonials">
                        {TESTIMONIALS.map((q, i) => (
                            <Reveal key={q.name} delay={i * 80} className="quote">
                                <Stars value={5} showNumber={false} size={16} />
                                <p>“{q.text}”</p>
                                <div className="who">
                                    <Avatar name={q.name} />
                                    <div>
                                        <strong className="small" style={{ display: "block" }}>{q.name}</strong>
                                        <span className="tiny muted">{q.role} · Compra verificada</span>
                                    </div>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            <div className="container"><RecentlyViewed /></div>

            {/* NEWSLETTER */}
            <section className="container">
                <Reveal className="newsletter">
                    <div style={{ position: "relative", zIndex: 1 }}>
                        <h2 className="display-2">Ofertas antes que nadie.</h2>
                        <p style={{ opacity: .7, marginTop: 12 }}>Suscríbete y recibe lanzamientos, descuentos exclusivos y guías de compra. Sin spam.</p>
                    </div>
                    <form onSubmit={subscribe}>
                        <input type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} aria-label="Email" />
                        <button className="btn btn-accent" type="submit">Suscribirme</button>
                    </form>
                </Reveal>
            </section>
        </>
    );
}
