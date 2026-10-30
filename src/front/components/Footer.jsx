import { Link } from "react-router-dom";
import { Github, Linkedin } from "lucide-react";
import { Logo } from "./Navbar";
import { CATEGORIES } from "../lib/catalog";

export const Footer = () => (
    <footer className="footer">
        <div className="container">
            <div className="footer-grid">
                <div style={{ display: "grid", gap: 16, alignContent: "start", maxWidth: 340 }}>
                    <Logo />
                    <p className="small">Tecnología seleccionada a mano, envío en 24 h y 2 años de garantía en todo el catálogo.</p>
                    <div style={{ display: "flex", gap: 8 }}>
                        <a className="icon-btn" style={{ color: "#fff", border: "1px solid rgba(255,255,255,.2)" }} href="https://github.com/giorgioabo" target="_blank" rel="noreferrer" aria-label="GitHub"><Github size={18} /></a>
                        <a className="icon-btn" style={{ color: "#fff", border: "1px solid rgba(255,255,255,.2)" }} href="https://www.linkedin.com/in/giorgioabo" target="_blank" rel="noreferrer" aria-label="LinkedIn"><Linkedin size={18} /></a>
                    </div>
                </div>
                <div>
                    <h4>Tienda</h4>
                    <ul>
                        {CATEGORIES.map(c => <li key={c.slug}><Link to={`/catalog?category=${c.slug}`}>{c.name}</Link></li>)}
                    </ul>
                </div>
                <div>
                    <h4>Ayuda</h4>
                    <ul>
                        <li><Link to="/account?tab=orders">Seguimiento de pedidos</Link></li>
                        <li><Link to="/catalog?sort=discount">Ofertas</Link></li>
                        <li><span>Envíos y devoluciones</span></li>
                        <li><span>Garantía de 2 años</span></li>
                    </ul>
                </div>
                <div>
                    <h4>Cuenta</h4>
                    <ul>
                        <li><Link to="/login">Iniciar sesión</Link></li>
                        <li><Link to="/register">Crear cuenta</Link></li>
                        <li><Link to="/account?tab=wishlist">Favoritos</Link></li>
                        <li><Link to="/cart">Carrito</Link></li>
                    </ul>
                </div>
            </div>
            <div className="footer-bottom">
                <span>© {new Date().getFullYear()} TechDrop · Proyecto de portafolio de Giorgio Abdalla Behna. Productos y marcas ficticios.</span>
                <div className="pay-icons" aria-label="Métodos de pago">
                    <span>VISA</span><span>MASTERCARD</span><span>PAYPAL</span><span>BIZUM</span>
                </div>
            </div>
        </div>
    </footer>
);
