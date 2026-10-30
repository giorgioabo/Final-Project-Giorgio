import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, Check } from "lucide-react";
import useGlobalReducer from "../hooks/useGlobalReducer";
import AuthShell from "../components/AuthShell";
import { usePageTitle } from "../components/ui";
import { api } from "../lib/api";

function strength(pw) {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
    if (/\d/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
}

export default function Register() {
    usePageTitle("Crear cuenta");
    const { actions } = useGlobalReducer();
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const next = params.get("next") || "/";
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [errors, setErrors] = useState({});
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const s = strength(form.password);
    const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

    const submit = async e => {
        e.preventDefault();
        const errs = {};
        if (form.name.trim().length < 2) errs.name = "Escribe tu nombre";
        if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = "Email no válido";
        if (form.password.length < 8) errs.password = "Mínimo 8 caracteres";
        setErrors(errs);
        if (Object.keys(errs).length) return;
        setLoading(true);
        setError(null);
        try {
            const res = await api.register(form.name, form.email, form.password);
            actions.signIn(res);
            actions.toast("¡Cuenta creada! Bienvenido a TechDrop");
            navigate(next, { replace: true });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell>
            <form onSubmit={submit} noValidate>
                <div>
                    <h1 className="display-2" style={{ fontSize: 40 }}>Crea tu cuenta</h1>
                    <p className="muted" style={{ marginTop: 8 }}>Guarda favoritos, sigue tus pedidos y compra en un clic.</p>
                </div>
                {error && <div className="alert alert-danger" role="alert">{error}</div>}
                <div className="field">
                    <label htmlFor="name">Nombre</label>
                    <input id="name" className={`input ${errors.name ? "invalid" : ""}`} autoComplete="name" value={form.name} onChange={set("name")} />
                    {errors.name && <span className="error">{errors.name}</span>}
                </div>
                <div className="field">
                    <label htmlFor="email">Email</label>
                    <input id="email" className={`input ${errors.email ? "invalid" : ""}`} type="email" autoComplete="email" value={form.email} onChange={set("email")} />
                    {errors.email && <span className="error">{errors.email}</span>}
                </div>
                <div className="field">
                    <label htmlFor="password">Contraseña</label>
                    <input id="password" className={`input ${errors.password ? "invalid" : ""}`} type="password" autoComplete="new-password" value={form.password} onChange={set("password")} />
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4, marginTop: 4 }}>
                        {[0, 1, 2, 3].map(i => (
                            <span key={i} style={{ height: 4, borderRadius: 4, background: i < s ? ["#e0352b", "#c27a00", "#12a150", "#12a150"][s - 1] : "var(--surface-2)" }} />
                        ))}
                    </div>
                    {errors.password ? <span className="error">{errors.password}</span> : <span className="tiny muted">Usa 8+ caracteres con mayúsculas, números y símbolos.</span>}
                </div>
                <button className="btn btn-primary btn-lg btn-block" disabled={loading} type="submit">
                    {loading ? <Loader2 size={18} className="spin" /> : "Crear cuenta"}
                </button>
                <ul className="feature-list small muted">
                    <li><Check size={16} /> Seguimiento de pedidos en tiempo real</li>
                    <li><Check size={16} /> Ofertas exclusivas para miembros</li>
                </ul>
                <p className="small muted" style={{ textAlign: "center" }}>
                    ¿Ya tienes cuenta? <Link to="/login" style={{ color: "var(--ink)", fontWeight: 600 }}>Inicia sesión</Link>
                </p>
            </form>
        </AuthShell>
    );
}
