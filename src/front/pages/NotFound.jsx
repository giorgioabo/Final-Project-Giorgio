import { Link } from "react-router-dom";
import { usePageTitle } from "../components/ui";

export default function NotFound() {
    usePageTitle("Página no encontrada");
    return (
        <div className="container empty" style={{ minHeight: "60vh" }}>
            <span className="eyebrow">Error 404</span>
            <h1 className="display-1" style={{ fontSize: "clamp(72px, 14vw, 160px)" }}>404</h1>
            <p className="lead">Esta página se ha desconectado. Volvamos a terreno conocido.</p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
                <Link to="/" className="btn btn-primary btn-lg">Ir al inicio</Link>
                <Link to="/catalog" className="btn btn-outline btn-lg">Ver la tienda</Link>
            </div>
        </div>
    );
}
