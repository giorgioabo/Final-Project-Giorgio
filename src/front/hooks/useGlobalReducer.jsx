import { useContext, useReducer, createContext, useEffect, useCallback, useMemo } from "react";
import storeReducer, { initialStore } from "../store";
import { api, init, setToken } from "../lib/api";
import { save } from "../lib/storage";

const StoreContext = createContext();

export function StoreProvider({ children }) {
    const [store, dispatch] = useReducer(storeReducer, undefined, initialStore);

    // Persistimos carrito, favoritos y usuario en el navegador.
    useEffect(() => save("td_cart", store.cart), [store.cart]);
    useEffect(() => save("td_wishlist", store.wishlist), [store.wishlist]);
    useEffect(() => save("td_user", store.user), [store.user]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const mode = await init();
            if (cancelled) return;
            dispatch({ type: "SET_MODE", payload: mode });
            try {
                const products = await api.products();
                if (!cancelled && products.length) dispatch({ type: "SET_PRODUCTS", payload: products });
            } catch {
                // Nos quedamos con el catálogo incluido.
            }
            try {
                const user = await api.me();
                if (!cancelled) dispatch({ type: "SET_USER", payload: user });
            } catch {
                if (!cancelled) dispatch({ type: "SET_USER", payload: null });
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const toast = useCallback((message, tone = "success") => {
        const id = Math.random().toString(36).slice(2);
        dispatch({ type: "PUSH_TOAST", payload: { id, message, tone } });
        setTimeout(() => dispatch({ type: "DISMISS_TOAST", payload: id }), 3200);
    }, []);

    const actions = useMemo(() => ({
        toast,
        addToCart(product, { quantity = 1, color, option } = {}) {
            if (product.stock <= 0) return toast("Producto agotado", "danger");
            dispatch({
                type: "ADD_TO_CART",
                payload: {
                    product_id: product.id,
                    quantity,
                    color: color || product.colors?.[0]?.name,
                    option: option || product.options?.[0] || null,
                    max: product.stock,
                },
            });
            dispatch({ type: "TOGGLE_CART", payload: true });
        },
        toggleWishlist(product, isSaved) {
            dispatch({ type: "TOGGLE_WISHLIST", payload: product.id });
            toast(isSaved ? "Eliminado de favoritos" : "Guardado en favoritos", isSaved ? "neutral" : "success");
        },
        signIn({ token, user }) {
            setToken(token);
            dispatch({ type: "SET_USER", payload: user });
        },
        signOut() {
            setToken(null);
            dispatch({ type: "SET_USER", payload: null });
            toast("Has cerrado sesión", "neutral");
        },
    }), [toast]);

    return <StoreContext.Provider value={{ store, dispatch, actions }}>{children}</StoreContext.Provider>;
}

export default function useGlobalReducer() {
    return useContext(StoreContext);
}

// Une cada línea del carrito con su producto actual (precio y stock al día).
export function useCartLines() {
    const { store } = useGlobalReducer();
    return useMemo(
        () => store.cart
            .map(l => {
                const product = store.products.find(p => p.id === l.product_id);
                return product ? { ...l, product, price: product.price } : null;
            })
            .filter(Boolean),
        [store.cart, store.products],
    );
}
