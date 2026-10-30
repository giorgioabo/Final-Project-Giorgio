import data from "../../catalog/catalog.json";

// El catálogo vive dentro del propio proyecto: la tienda siempre tiene productos
// que mostrar, aunque el backend o la base de datos no estén disponibles.

export const CATEGORIES = data.categories;
export const SEED_PRODUCTS = data.products.map(p => normalizeProduct(p));

export function categoryBySlug(slug) {
    return CATEGORIES.find(c => c.slug === slug);
}

export function normalizeProduct(p) {
    const category = typeof p.category === "object" && p.category ? p.category.slug : p.category;
    return {
        compare_at_price: null,
        badge: null,
        features: [],
        specs: {},
        colors: [{ name: "Único", hex: "#2b2d31" }],
        options: [],
        rating: 0,
        reviews_count: 0,
        is_featured: false,
        is_new: false,
        ...p,
        category,
        categoryName: categoryBySlug(category)?.name || "Otros",
        art: p.art || { kind: categoryBySlug(category)?.art || "phone", bg: ["#eceef2", "#d8dce4"] },
    };
}

export function discountPercent(p) {
    if (!p.compare_at_price || p.compare_at_price <= p.price) return 0;
    return Math.round((1 - p.price / p.compare_at_price) * 100);
}

export const BRANDS = [...new Set(SEED_PRODUCTS.map(p => p.brand))].sort();

// Reseñas de ejemplo generadas de forma determinista para cada producto.
const AUTHORS = ["Lucía M.", "Carlos R.", "Marta G.", "Javier P.", "Ana S.", "Diego L.", "Sofía T.", "Pablo V.", "Elena F.", "Hugo N.", "Irene C.", "Álvaro B."];
const REVIEW_BANK = [
    [5, "Superó mis expectativas", "La calidad de construcción es increíble y el rendimiento es exactamente lo que buscaba. Llegó al día siguiente."],
    [5, "Merece cada euro", "Llevo un mes usándolo a diario y no tengo ni una queja. Se nota que está pensado al detalle."],
    [4, "Muy bueno, con un pero", "Funciona genial y el diseño es precioso. Le pondría cinco estrellas si la caja incluyera algo más."],
    [5, "Compra perfecta", "Atención al cliente de diez y el producto es tal cual se describe. Repetiré seguro."],
    [4, "Gran relación calidad-precio", "Por lo que cuesta es difícil encontrar algo mejor. La batería dura muchísimo."],
    [3, "Correcto", "Cumple, aunque esperaba un poco más en algunos aspectos. Aun así lo recomendaría."],
    [5, "Lo recomiendo sin dudar", "Se lo regalé a mi pareja y ahora quiero uno para mí. Los acabados son de gama alta."],
];

export function sampleReviews(product, count = 4) {
    const out = [];
    for (let i = 0; i < count; i++) {
        const seed = (product.id * 7 + i * 3) % REVIEW_BANK.length;
        const [rating, title, body] = REVIEW_BANK[seed];
        const day = ((product.id * 11 + i * 17) % 27) + 1;
        const month = ((product.id + i * 2) % 9) + 1;
        out.push({
            id: `s-${product.id}-${i}`,
            author: AUTHORS[(product.id * 5 + i) % AUTHORS.length],
            rating: Math.min(5, rating + (product.rating >= 4.7 && rating < 5 ? 1 : 0)),
            title,
            body,
            date: `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
            verified: i % 3 !== 2,
        });
    }
    return out;
}
