import { Outlet } from "react-router-dom";
import { Check, X, Info } from "lucide-react";
import ScrollToTop from "../components/ScrollToTop";
import Navbar from "../components/Navbar";
import { Footer } from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import useGlobalReducer from "../hooks/useGlobalReducer";

function Toasts() {
    const { store } = useGlobalReducer();
    return (
        <div className="toasts" aria-live="polite">
            {store.toasts.map(t => (
                <div key={t.id} className={`toast ${t.tone}`}>
                    <span className="ico">{t.tone === "danger" ? <X size={14} /> : t.tone === "neutral" ? <Info size={14} /> : <Check size={14} />}</span>
                    {t.message}
                </div>
            ))}
        </div>
    );
}

export const Layout = () => (
    <ScrollToTop>
        <Navbar />
        <main>
            <Outlet />
        </main>
        <Footer />
        <CartDrawer />
        <Toasts />
    </ScrollToTop>
);

export default Layout;
