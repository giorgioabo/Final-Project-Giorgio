import { load } from "./lib/storage";
import { SEED_PRODUCTS } from "./lib/catalog";

export const initialStore = () => ({
    mode: null,
    user: load("td_user", null),
    // Arrancamos con el catálogo incluido para pintar al instante; luego se refresca.
    products: SEED_PRODUCTS,
    cart: load("td_cart", []),
    wishlist: load("td_wishlist", []),
    compare: load("td_compare", []),
    recent: load("td_recent", []),
    quickView: null,
    cartOpen: false,
    toasts: [],
});

const lineKey = l => `${l.product_id}|${l.color || ""}|${l.option || ""}`;

export default function storeReducer(store, action) {
    switch (action.type) {
        case "SET_MODE":
            return { ...store, mode: action.payload };

        case "SET_USER":
            return { ...store, user: action.payload };

        case "SET_PRODUCTS":
            return { ...store, products: action.payload };

        case "UPSERT_PRODUCT": {
            const exists = store.products.some(p => p.id === action.payload.id);
            return {
                ...store,
                products: exists
                    ? store.products.map(p => (p.id === action.payload.id ? action.payload : p))
                    : [action.payload, ...store.products],
            };
        }

        case "REMOVE_PRODUCT":
            return { ...store, products: store.products.filter(p => p.id !== action.payload) };

        case "ADD_TO_CART": {
            const line = action.payload;
            const key = lineKey(line);
            const existing = store.cart.find(l => lineKey(l) === key);
            const cart = existing
                ? store.cart.map(l => (lineKey(l) === key ? { ...l, quantity: Math.min(l.quantity + line.quantity, line.max ?? 99) } : l))
                : [...store.cart, { ...line, key }];
            return { ...store, cart };
        }

        case "UPDATE_CART_QTY":
            return {
                ...store,
                cart: store.cart
                    .map(l => (l.key === action.payload.key ? { ...l, quantity: action.payload.quantity } : l))
                    .filter(l => l.quantity > 0),
            };

        case "REMOVE_FROM_CART":
            return { ...store, cart: store.cart.filter(l => l.key !== action.payload) };

        case "CLEAR_CART":
            return { ...store, cart: [] };

        case "TOGGLE_CART":
            return { ...store, cartOpen: action.payload ?? !store.cartOpen };

        case "TOGGLE_WISHLIST": {
            const id = action.payload;
            const wishlist = store.wishlist.includes(id) ? store.wishlist.filter(x => x !== id) : [...store.wishlist, id];
            return { ...store, wishlist };
        }

        case "TOGGLE_COMPARE": {
            const id = action.payload;
            if (store.compare.includes(id)) return { ...store, compare: store.compare.filter(x => x !== id) };
            // Máximo 3 productos: el más antiguo deja sitio al nuevo.
            return { ...store, compare: [...store.compare, id].slice(-3) };
        }

        case "CLEAR_COMPARE":
            return { ...store, compare: [] };

        case "VIEWED":
            return { ...store, recent: [action.payload, ...store.recent.filter(x => x !== action.payload)].slice(0, 8) };

        case "QUICK_VIEW":
            return { ...store, quickView: action.payload };

        case "PUSH_TOAST":
            return { ...store, toasts: [...store.toasts.slice(-2), action.payload] };

        case "DISMISS_TOAST":
            return { ...store, toasts: store.toasts.filter(t => t.id !== action.payload) };

        default:
            return store;
    }
}
