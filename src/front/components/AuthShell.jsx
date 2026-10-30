import { Logo } from "./Navbar";
import ProductArt from "./ProductArt";
import useGlobalReducer from "../hooks/useGlobalReducer";
import { Stars } from "./ui";

export default function AuthShell({ children }) {
    const { store } = useGlobalReducer();
    const hero = store.products.find(p => p.slug === "lumen-h9") || store.products[0];
    return (
        <div className="auth">
            <div className="auth-side">
                <div className="on-dark"><Logo /></div>
                <div style={{ position: "relative", zIndex: 1, maxWidth: 420 }}>
                    <Stars value={5} showNumber={false} size={18} />
                    <p style={{ fontFamily: "var(--display)", fontSize: 30, lineHeight: 1.2, marginTop: 16, letterSpacing: "-0.02em" }}>
                        “La mejor tienda de tecnología en la que he comprado. Rápida, clara y con precios de verdad.”
                    </p>
                    <p style={{ opacity: .6, marginTop: 16 }}>— Marta G., cliente desde 2024</p>
                </div>
                {hero && <div className="art-stack" style={{ position: "absolute" }}><ProductArt product={hero} bare /></div>}
            </div>
            <div className="auth-form">{children}</div>
        </div>
    );
}
