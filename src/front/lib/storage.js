// localStorage puede fallar (modo privado, almacenamiento bloqueado): nunca rompemos la app por ello.

export function load(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

export function save(key, value) {
    try {
        if (value === null || value === undefined) localStorage.removeItem(key);
        else localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Sin almacenamiento disponible: la app sigue funcionando en memoria.
    }
}
