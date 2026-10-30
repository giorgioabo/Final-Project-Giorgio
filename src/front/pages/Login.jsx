import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Loader2, LayoutDashboard } from "lucide-react";
import useGlobalReducer from "../hooks/useGlobalReducer";
import AuthShell from "../components/AuthShell";
import { usePageTitle } from "../components/ui";
import { api, DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD } from "../lib/api";

export default function Login() {
    usePageTitle("Iniciar sesión");
    const { store, actions } = useGlobalReducer();
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const next = params.get("next") || "/";
    const [form, setForm] = useState({ email: "", password: "" });
    const [show, setShow] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const doLogin = async (email, password) => {
        setError(null);
        setLoading(true);
        try {
            const res = await api.login(email, password);
            actions.signIn(res);
            actions.toast(`¡Hola de nuevo, ${res.user.name.split(" ")[0]}!`);
            navigate(res.user.is_admin && next === "/" ? "/admin" : next, { replace: true });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const submit = e => {
        e.preventDefault();
        if (!form.email || !form.password) return setError("Introduce tu email y contraseña");
        doLogin(form.email, form.password);
    };

    return (
        <AuthShell>
            <form onSubmit={submit} noValidate>
                <div>
                    <h1 className="display-2" style={{ fontSize: 40 }}>Bienvenido de nuevo</h1>
                    <p className="muted" style={{ marginTop: 8 }}>Inicia sesión para ver tus pedidos y comprar más rápido.</p>
                </div>
                {error && <div className="alert alert-danger" role="alert">{error}</div>}
                <div className="field">
                    <label htmlFor="email">Email</label>
                    <input id="email" className="input" type="email" autoComplete="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="field">
                    <label htmlFor="password">Contraseña</label>
                    <div style={{ position: "relative" }}>
                        <input id="password" className="input" type={show ? "text" : "password"} autoComplete="current-password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} style={{ paddingRight: 48 }} />
                        <button type="button" className="icon-btn" style={{ position: "absolute", right: 4, top: 3 }} onClick={() => setShow(s => !s)} aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}>
                            {show ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>
                <button className="btn btn-primary btn-lg btn-block" disabled={loading} type="submit">
                    {loading ? <Loader2 size={18} className="spin" /> : "Iniciar sesión"}
                </button>
                {store.mode === "local" && (
                    <>
                        <div className="divider">o prueba la demo</div>
                        <button type="button" className="btn btn-outline btn-block" disabled={loading} onClick={() => doLogin(DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD)}>
                            <LayoutDashboard size={18} /> Entrar como administrador demo
                        </button>
                    </>
                )}
                <p className="small muted" style={{ textAlign: "center" }}>
                    ¿No tienes cuenta? <Link to={`/register${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`} style={{ color: "var(--ink)", fontWeight: 600 }}>Créala gratis</Link>
                </p>
            </form>
        </AuthShell>
    );
}
