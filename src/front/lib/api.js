import { SEED_PRODUCTS, normalizeProduct } from "./catalog";
import { computeTotals } from "./pricing";
import { load, save } from "./storage";

// Capa de datos con dos modos:
//  - "remote": usa la API Flask (VITE_BACKEND_URL) si responde y su base de datos funciona.
//  - "local":  todo vive en el navegador. La web nunca se queda vacía aunque el backend caiga.

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");
const HEALTH_TIMEOUT_MS = 6000;

let mode = "local";
let token = load("td_token", null);

export const getMode = () => mode;
export const setToken = t => { token = t; save("td_token", t); };

export class ApiError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
    }
}

export async function init() {
    if (!BACKEND_URL) return (mode = "local");
    // Si el token guardado es de otro modo, lo descartamos al decidir.
    try {
        const res = await fetch(`${BACKEND_URL}/api/health`, { signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS) });
        const body = await res.json();
        mode = res.ok && body.database === "ok" ? "remote" : "local";
    } catch {
        mode = "local";
    }
    if (token && (mode === "local") !== String(token).startsWith("local:")) setToken(null);
    return mode;
}

async function http(path, { method = "GET", body } = {}) {
    const res = await fetch(`${BACKEND_URL}/api${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(data.error || data.msg || "Algo salió mal. Inténtalo de nuevo.", res.status);
    return data;
}

// ─── Modo local ───────────────────────────────────────────

const DEMO_ADMIN = { id: 1, name: "Admin Demo", email: "admin@techdrop.demo", is_admin: true };
export const DEMO_ADMIN_EMAIL = DEMO_ADMIN.email;
export const DEMO_ADMIN_PASSWORD = "techdrop-demo";

async function hash(text) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`td:${text}`));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

async function localUsers() {
    let users = load("td_users", null);
    if (!users) {
        users = [{ ...DEMO_ADMIN, pass: await hash(DEMO_ADMIN_PASSWORD), created_at: new Date().toISOString() }];
        save("td_users", users);
    }
    return users;
}

const publicUser = ({ pass, ...u }) => u;
const localProducts = () => load("td_products", null) || SEED_PRODUCTS;
const localOrders = () => load("td_orders", []);

async function currentLocalUser() {
    if (!token || !String(token).startsWith("local:")) throw new ApiError("Inicia sesión para continuar", 401);
    const id = Number(String(token).slice(6));
    const user = (await localUsers()).find(u => u.id === id);
    if (!user) throw new ApiError("Sesión caducada", 401);
    return user;
}

async function requireLocalAdmin() {
    const user = await currentLocalUser();
    if (!user.is_admin) throw new ApiError("Solo administradores", 403);
    return user;
}

const delay = (ms = 250) => new Promise(r => setTimeout(r, ms));

const local = {
    async products() {
        return localProducts();
    },
    async login(email, password) {
        await delay();
        const user = (await localUsers()).find(u => u.email === email.trim().toLowerCase());
        if (!user || user.pass !== await hash(password)) throw new ApiError("Email o contraseña incorrectos", 401);
        return { token: `local:${user.id}`, user: publicUser(user) };
    },
    async register(name, email, password) {
        await delay();
        const users = await localUsers();
        const clean = email.trim().toLowerCase();
        if (users.some(u => u.email === clean)) throw new ApiError("Ya existe una cuenta con este email", 400);
        const user = { id: Math.max(...users.map(u => u.id)) + 1, name: name.trim(), email: clean, is_admin: false, pass: await hash(password), created_at: new Date().toISOString() };
        save("td_users", [...users, user]);
        return { token: `local:${user.id}`, user: publicUser(user) };
    },
    async me() {
        return publicUser(await currentLocalUser());
    },
    async createOrder({ items, shipping, coupon, shippingMethod }) {
        await delay(700);
        const user = await currentLocalUser();
        const products = localProducts();
        const lines = items.map(i => {
            const p = products.find(x => x.id === i.product_id);
            if (!p) throw new ApiError("Un producto del carrito ya no existe", 400);
            if (p.stock < i.quantity) throw new ApiError(`Solo quedan ${p.stock} unidades de ${p.name}`, 400);
            return { ...i, price: p.price, name: p.name, product: p };
        });
        const totals = computeTotals(lines, { coupon, shipping: shippingMethod });
        const orders = localOrders();
        const order = {
            id: 1000 + orders.length + 1,
            created_at: new Date().toISOString(),
            status: "paid",
            user: { id: user.id, name: user.name, email: user.email },
            shipping_address: shipping,
            shipping_method: shippingMethod,
            ...totals,
            items: lines.map(l => ({ product_id: l.product_id, name: l.name, quantity: l.quantity, unit_price: l.price, color: l.color, option: l.option, product: l.product })),
        };
        save("td_orders", [order, ...orders]);
        save("td_products", products.map(p => {
            const line = lines.find(l => l.product_id === p.id);
            return line ? { ...p, stock: p.stock - line.quantity } : p;
        }));
        return order;
    },
    async myOrders() {
        const user = await currentLocalUser();
        return localOrders().filter(o => o.user.id === user.id);
    },
    async saveProduct(product) {
        await requireLocalAdmin();
        const products = localProducts();
        const next = normalizeProduct(product.id ? product : { ...product, id: Math.max(...products.map(p => p.id)) + 1 });
        save("td_products", product.id ? products.map(p => (p.id === next.id ? next : p)) : [next, ...products]);
        return next;
    },
    async deleteProduct(id) {
        await requireLocalAdmin();
        save("td_products", localProducts().filter(p => p.id !== id));
    },
    async allOrders() {
        await requireLocalAdmin();
        return localOrders();
    },
    async updateOrderStatus(id, status) {
        await requireLocalAdmin();
        const orders = localOrders().map(o => (o.id === id ? { ...o, status } : o));
        save("td_orders", orders);
        return orders.find(o => o.id === id);
    },
    async users() {
        await requireLocalAdmin();
        return (await localUsers()).map(publicUser);
    },
    async resetDemo() {
        ["td_products", "td_orders", "td_users"].forEach(k => save(k, null));
    },
};

// ─── Modo remoto (API Flask) ──────────────────────────────

const remote = {
    async products() {
        return (await http("/products")).map(normalizeProduct);
    },
    login: (email, password) => http("/auth/login", { method: "POST", body: { email, password } }),
    register: (name, email, password) => http("/auth/register", { method: "POST", body: { name, email, password } }),
    async me() {
        if (!token) throw new ApiError("Sin sesión", 401);
        return http("/auth/me");
    },
    createOrder: ({ items, shipping, coupon, shippingMethod }) =>
        http("/orders", { method: "POST", body: { items, shipping_address: shipping, coupon, shipping_method: shippingMethod } }),
    myOrders: () => http("/orders"),
    async saveProduct(product) {
        const saved = product.id
            ? await http(`/products/${product.id}`, { method: "PUT", body: product })
            : await http("/products", { method: "POST", body: product });
        return normalizeProduct(saved);
    },
    deleteProduct: id => http(`/products/${id}`, { method: "DELETE" }),
    allOrders: () => http("/admin/orders"),
    updateOrderStatus: (id, status) => http(`/admin/orders/${id}`, { method: "PUT", body: { status } }),
    users: () => http("/admin/users"),
    async resetDemo() {},
};

export const api = new Proxy({}, {
    get: (_, key) => (mode === "remote" ? remote : local)[key],
});

export const ORDER_STATUSES = {
    paid: { label: "Pagado", tone: "info" },
    processing: { label: "Preparando", tone: "warning" },
    shipped: { label: "Enviado", tone: "accent" },
    delivered: { label: "Entregado", tone: "success" },
    cancelled: { label: "Cancelado", tone: "danger" },
};
