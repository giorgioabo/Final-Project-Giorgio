import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Vuelve arriba al cambiar de página (pero no al cambiar solo los filtros del catálogo).
export default function ScrollToTop({ children }) {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "instant" });
    }, [pathname]);
    return children;
}
