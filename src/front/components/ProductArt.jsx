import { useId, useState } from "react";

// Ilustraciones vectoriales propias de cada producto. Se dibujan en el navegador,
// así que nunca dependen de imágenes externas que puedan caducar o desaparecer.

function shade(hex, amount) {
    const n = parseInt(hex.replace("#", ""), 16);
    const mix = amount < 0 ? 0 : 255;
    const t = Math.abs(amount);
    const r = Math.round(((n >> 16) & 255) * (1 - t) + mix * t);
    const g = Math.round(((n >> 8) & 255) * (1 - t) + mix * t);
    const b = Math.round((n & 255) * (1 - t) + mix * t);
    return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function isLight(hex) {
    const n = parseInt(hex.replace("#", ""), 16);
    return (((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114) > 170;
}

const WALLPAPERS = [
    ["#ff6a3d", "#7b2ff7"],
    ["#00c6ff", "#5b3df5"],
    ["#ffb347", "#ff5f6d"],
    ["#43e97b", "#2b7cff"],
    ["#f857a6", "#ff8a3d"],
];

function Screen({ id, x, y, w, h, r, seed = 0, children }) {
    const [a, b] = WALLPAPERS[seed % WALLPAPERS.length];
    return (
        <g>
            <defs>
                <linearGradient id={`${id}-wp`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor={a} />
                    <stop offset="1" stopColor={b} />
                </linearGradient>
                <radialGradient id={`${id}-glow`} cx="0.3" cy="0.25" r="0.9">
                    <stop offset="0" stopColor="#fff" stopOpacity="0.45" />
                    <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
                </radialGradient>
            </defs>
            <rect x={x} y={y} width={w} height={h} rx={r} fill={`url(#${id}-wp)`} />
            <rect x={x} y={y} width={w} height={h} rx={r} fill={`url(#${id}-glow)`} />
            {children}
        </g>
    );
}

function Shadow({ cx = 200, cy = 340, rx = 120, ry = 14, opacity = 0.18 }) {
    return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#000" opacity={opacity} />;
}

const SHAPES = {
    phone: ({ id, c, seed }) => (
        <g>
            <Shadow rx={78} cy={352} />
            <g transform="rotate(-8 200 200)">
                <rect x="132" y="48" width="140" height="290" rx="30" fill={shade(c, -0.25)} />
                <rect x="135" y="50" width="134" height="284" rx="28" fill={c} />
                <Screen id={id} x={143} y={58} w={118} h={268} r={22} seed={seed}>
                    <rect x="181" y="66" width="42" height="12" rx="6" fill="#0b0b0d" />
                    <text x="202" y="128" textAnchor="middle" fontFamily="Space Grotesk Variable, sans-serif" fontSize="34" fontWeight="600" fill="#fff">9:41</text>
                    <rect x="158" y="270" width="88" height="40" rx="14" fill="#fff" opacity="0.22" />
                </Screen>
                <rect x="270" y="110" width="4" height="34" rx="2" fill={shade(c, -0.35)} />
            </g>
        </g>
    ),
    tablet: ({ id, c, seed }) => (
        <g>
            <Shadow rx={130} cy={330} />
            <g transform="rotate(-6 200 200)">
                <rect x="70" y="80" width="260" height="230" rx="24" fill={shade(c, -0.25)} />
                <rect x="73" y="82" width="254" height="225" rx="22" fill={c} />
                <Screen id={id} x={84} y={93} w={232} h={203} r={14} seed={seed + 1}>
                    <rect x="104" y="116" width="92" height="70" rx="10" fill="#fff" opacity="0.25" />
                    <rect x="206" y="116" width="92" height="70" rx="10" fill="#fff" opacity="0.18" />
                    <rect x="104" y="196" width="194" height="80" rx="10" fill="#fff" opacity="0.15" />
                </Screen>
            </g>
        </g>
    ),
    laptop: ({ id, c, seed }) => (
        <g>
            <Shadow rx={160} cy={318} ry={12} />
            <path d="M92 92 Q92 78 106 78 H294 Q308 78 308 92 V262 H92 Z" fill={shade(c, -0.55)} />
            <Screen id={id} x={102} y={88} w={196} h={164} r={6} seed={seed + 2}>
                <rect x="116" y="104" width="70" height="8" rx="4" fill="#fff" opacity="0.6" />
                <rect x="116" y="120" width="120" height="6" rx="3" fill="#fff" opacity="0.35" />
                <rect x="116" y="170" width="168" height="66" rx="8" fill="#fff" opacity="0.18" />
            </Screen>
            <path d="M40 268 H360 L346 300 Q342 308 330 308 H70 Q58 308 54 300 Z" fill={c} />
            <path d="M40 268 H360 V272 H40 Z" fill={shade(c, 0.35)} />
            <rect x="170" y="268" width="60" height="7" rx="3.5" fill={shade(c, -0.18)} />
        </g>
    ),
    monitor: ({ id, c, seed }) => (
        <g>
            <Shadow rx={110} cy={338} ry={10} />
            <rect x="42" y="62" width="316" height="196" rx="12" fill={shade(c, -0.2)} />
            <Screen id={id} x={50} y={70} w={300} h={176} r={6} seed={seed + 3}>
                <circle cx="200" cy="158" r="44" fill="#fff" opacity="0.18" />
                <path d="M170 158 L194 142 V174 Z M206 142 L230 158 L206 174 Z" fill="#fff" opacity="0.7" />
            </Screen>
            <rect x="188" y="258" width="24" height="64" fill={shade(c, 0.12)} />
            <path d="M130 326 Q130 318 140 318 H260 Q270 318 270 326 V334 H130 Z" fill={c} />
        </g>
    ),
    headphones: ({ c }) => (
        <g>
            <Shadow rx={100} cy={340} />
            <path d="M104 214 C104 104 146 62 200 62 C254 62 296 104 296 214" fill="none" stroke={shade(c, -0.3)} strokeWidth="22" strokeLinecap="round" />
            <path d="M104 214 C104 104 146 62 200 62 C254 62 296 104 296 214" fill="none" stroke={c} strokeWidth="14" strokeLinecap="round" />
            <rect x="72" y="186" width="74" height="128" rx="34" fill={shade(c, -0.15)} />
            <rect x="80" y="192" width="64" height="116" rx="30" fill={c} />
            <rect x="254" y="186" width="74" height="128" rx="34" fill={shade(c, -0.15)} />
            <rect x="256" y="192" width="64" height="116" rx="30" fill={c} />
            <rect x="130" y="204" width="18" height="92" rx="9" fill={shade(c, -0.4)} />
            <rect x="252" y="204" width="18" height="92" rx="9" fill={shade(c, -0.4)} />
            <ellipse cx="104" cy="226" rx="10" ry="26" fill="#fff" opacity="0.25" />
            <ellipse cx="300" cy="226" rx="10" ry="26" fill="#fff" opacity="0.18" />
        </g>
    ),
    headset: ({ c }) => (
        <g>
            <Shadow rx={130} cy={322} />
            <path d="M60 170 Q60 120 110 116 H290 Q340 120 340 170 V232 Q340 276 296 276 H250 Q228 276 216 252 L208 238 Q200 226 192 238 L184 252 Q172 276 150 276 H104 Q60 276 60 232 Z" fill={c} />
            <path d="M78 176 Q78 140 114 138 H286 Q322 140 322 176 V226 Q322 256 292 256 H252 Q238 256 230 240 L216 214 Q200 198 184 214 L170 240 Q162 256 148 256 H108 Q78 256 78 226 Z" fill="#14151a" />
            <path d="M92 168 Q140 146 196 152" stroke="#fff" strokeOpacity="0.35" strokeWidth="6" fill="none" strokeLinecap="round" />
            <rect x="40" y="168" width="22" height="64" rx="10" fill={shade(c, -0.2)} />
            <rect x="338" y="168" width="22" height="64" rx="10" fill={shade(c, -0.2)} />
            <circle cx="130" cy="200" r="7" fill={shade(c, -0.5)} />
            <circle cx="270" cy="200" r="7" fill={shade(c, -0.5)} />
        </g>
    ),
    earbuds: ({ c }) => {
        const dark = !isLight(c);
        return (
            <g>
                <Shadow rx={110} cy={330} />
                <rect x="112" y="196" width="176" height="124" rx="54" fill={shade(c, -0.12)} />
                <rect x="112" y="196" width="176" height="62" rx="30" fill={c} />
                <rect x="112" y="250" width="176" height="4" fill={shade(c, -0.3)} />
                <circle cx="200" cy="290" r="5" fill={dark ? "#7CFC9A" : "#2ecc71"} />
                <g transform="rotate(-18 150 140)">
                    <ellipse cx="150" cy="130" rx="34" ry="38" fill={c} />
                    <rect x="138" y="140" width="24" height="70" rx="12" fill={c} />
                    <ellipse cx="140" cy="116" rx="12" ry="14" fill="#fff" opacity="0.3" />
                    <ellipse cx="168" cy="124" rx="12" ry="10" fill={shade(c, -0.45)} />
                </g>
                <g transform="rotate(16 256 130)">
                    <ellipse cx="256" cy="118" rx="34" ry="38" fill={shade(c, -0.05)} />
                    <rect x="244" y="128" width="24" height="70" rx="12" fill={shade(c, -0.05)} />
                    <ellipse cx="236" cy="112" rx="12" ry="10" fill={shade(c, -0.45)} />
                </g>
            </g>
        );
    },
    speaker: ({ c }) => (
        <g>
            <Shadow rx={100} cy={344} />
            <rect x="112" y="70" width="176" height="268" rx="70" fill={shade(c, -0.15)} />
            <rect x="118" y="74" width="164" height="258" rx="66" fill={c} />
            <rect x="118" y="74" width="164" height="258" rx="66" fill="url(#mesh)" opacity="0.35" />
            <circle cx="200" cy="200" r="54" fill={shade(c, -0.22)} />
            <circle cx="200" cy="200" r="34" fill={shade(c, -0.32)} />
            <circle cx="200" cy="200" r="12" fill={shade(c, -0.45)} />
            <path d="M176 96 h48" stroke={shade(c, -0.35)} strokeWidth="8" strokeLinecap="round" />
            <ellipse cx="150" cy="140" rx="12" ry="40" fill="#fff" opacity="0.2" />
        </g>
    ),
    controller: ({ c }) => {
        const btn = isLight(c) ? "#2a2b30" : "#f2f2f2";
        return (
            <g>
                <Shadow rx={140} cy={316} />
                <path d="M120 120 H280 C330 120 352 160 362 210 C374 270 356 300 330 300 C304 300 290 272 266 252 H134 C110 272 96 300 70 300 C44 300 26 270 38 210 C48 160 70 120 120 120 Z" fill={shade(c, -0.18)} />
                <path d="M120 126 H280 C324 126 344 162 354 210 C364 262 350 290 330 290 C308 290 294 264 268 244 H132 C106 264 92 290 70 290 C50 290 36 262 46 210 C56 162 76 126 120 126 Z" fill={c} />
                <circle cx="132" cy="210" r="28" fill={shade(c, -0.25)} />
                <circle cx="132" cy="210" r="18" fill={shade(c, -0.45)} />
                <circle cx="240" cy="236" r="24" fill={shade(c, -0.25)} />
                <circle cx="240" cy="236" r="15" fill={shade(c, -0.45)} />
                <path d="M160 238 h28 M174 224 v28" stroke={btn} strokeWidth="9" strokeLinecap="round" opacity="0.7" />
                <circle cx="286" cy="176" r="9" fill="#ff5b5b" />
                <circle cx="308" cy="196" r="9" fill="#3fd17a" />
                <circle cx="264" cy="196" r="9" fill="#4f8dff" />
                <circle cx="286" cy="216" r="9" fill="#ffc83d" />
                <rect x="180" y="160" width="40" height="10" rx="5" fill={shade(c, -0.3)} />
            </g>
        );
    },
    handheld: ({ id, c, seed }) => (
        <g>
            <Shadow rx={160} cy={300} />
            <rect x="26" y="128" width="348" height="150" rx="56" fill={shade(c, -0.15)} />
            <rect x="30" y="132" width="340" height="142" rx="52" fill={c} />
            <Screen id={id} x={104} y={144} w={192} h={118} r={8} seed={seed + 4}>
                <path d="M104 236 L150 196 L184 222 L230 176 L296 236 V254 Q296 262 288 262 H112 Q104 262 104 254 Z" fill="#fff" opacity="0.22" />
            </Screen>
            <circle cx="66" cy="180" r="18" fill={shade(c, -0.35)} />
            <circle cx="334" cy="230" r="18" fill={shade(c, -0.35)} />
            <path d="M54 234 h26 M67 221 v26" stroke={shade(c, -0.45)} strokeWidth="8" strokeLinecap="round" />
            <circle cx="334" cy="168" r="7" fill={shade(c, -0.45)} />
            <circle cx="350" cy="184" r="7" fill={shade(c, -0.45)} />
            <circle cx="318" cy="184" r="7" fill={shade(c, -0.45)} />
            <circle cx="334" cy="200" r="7" fill={shade(c, -0.45)} />
        </g>
    ),
    watch: ({ id, c, seed }) => (
        <g>
            <Shadow rx={70} cy={350} />
            <rect x="152" y="36" width="96" height="330" rx="40" fill={shade(c, -0.12)} />
            <path d="M152 70 h96 M152 100 h96 M152 300 h96 M152 330 h96" stroke={shade(c, -0.22)} strokeWidth="2" />
            <rect x="124" y="118" width="152" height="170" rx="46" fill={shade(c, -0.3)} />
            <rect x="128" y="122" width="144" height="162" rx="42" fill={c} />
            <Screen id={id} x={140} y={134} w={120} h={138} r={32} seed={seed + 2}>
                <text x="200" y="204" textAnchor="middle" fontFamily="Space Grotesk Variable, sans-serif" fontSize="34" fontWeight="600" fill="#fff">10:09</text>
                <circle cx="200" cy="238" r="12" fill="none" stroke="#fff" strokeWidth="4" strokeDasharray="50 80" opacity="0.8" />
            </Screen>
            <rect x="272" y="170" width="12" height="34" rx="5" fill={shade(c, -0.25)} />
        </g>
    ),
    band: ({ id, c, seed }) => (
        <g>
            <Shadow rx={90} cy={330} />
            <path d="M200 60 C290 60 330 130 330 200 C330 270 290 320 200 320 C110 320 70 270 70 200 C70 130 110 60 200 60 Z" fill="none" stroke={c} strokeWidth="38" />
            <path d="M200 60 C290 60 330 130 330 200" fill="none" stroke="#fff" strokeOpacity="0.2" strokeWidth="10" />
            <rect x="150" y="270" width="100" height="70" rx="26" fill="#18191d" />
            <Screen id={id} x={160} y={279} w={80} h={52} r={18} seed={seed}>
                <text x="200" y="312" textAnchor="middle" fontFamily="Space Grotesk Variable, sans-serif" fontSize="18" fontWeight="600" fill="#fff">8.214</text>
            </Screen>
        </g>
    ),
    keyboard: ({ c }) => {
        const keys = [];
        const keyColor = shade(c, isLight(c) ? 0.55 : 0.12);
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 13; col++) {
                keys.push(<rect key={`${row}-${col}`} x={52 + col * 23.5} y={150 + row * 24} width="19" height="19" rx="4" fill={row === 0 && col === 0 ? "#ff5b1f" : keyColor} />);
            }
        }
        return (
            <g>
                <Shadow rx={170} cy={300} ry={12} />
                <path d="M36 140 Q36 128 48 128 H352 Q364 128 364 140 V282 Q364 292 352 292 H48 Q36 292 36 282 Z" fill={shade(c, -0.25)} />
                <rect x="38" y="132" width="324" height="154" rx="12" fill={c} />
                {keys}
                <rect x="122" y="270" width="130" height="2" fill="none" />
            </g>
        );
    },
    mouse: ({ c }) => (
        <g>
            <Shadow rx={80} cy={334} />
            <path d="M200 56 C262 56 296 110 296 190 C296 280 258 330 200 330 C142 330 104 280 104 190 C104 110 138 56 200 56 Z" fill={shade(c, -0.18)} />
            <path d="M200 60 C258 60 290 112 290 190 C290 274 254 322 200 322 C146 322 110 274 110 190 C110 112 142 60 200 60 Z" fill={c} />
            <path d="M200 60 V160" stroke={shade(c, -0.3)} strokeWidth="3" />
            <rect x="192" y="92" width="16" height="40" rx="8" fill={shade(c, -0.45)} />
            <ellipse cx="160" cy="150" rx="18" ry="54" fill="#fff" opacity="0.2" />
            <rect x="108" y="200" width="8" height="34" rx="4" fill={shade(c, -0.35)} />
        </g>
    ),
    charger: ({ c }) => (
        <g>
            <Shadow rx={90} cy={330} />
            <rect x="200" y="80" width="14" height="60" rx="5" fill="#b9bcc2" transform="rotate(-10 200 120)" />
            <rect x="236" y="74" width="14" height="60" rx="5" fill="#b9bcc2" transform="rotate(-10 240 120)" />
            <rect x="110" y="122" width="190" height="196" rx="40" fill={shade(c, -0.15)} transform="rotate(-10 200 220)" />
            <rect x="114" y="122" width="182" height="188" rx="38" fill={c} transform="rotate(-10 200 220)" />
            <g transform="rotate(-10 200 220)">
                <rect x="150" y="236" width="44" height="16" rx="8" fill={shade(c, -0.5)} />
                <rect x="210" y="236" width="44" height="16" rx="8" fill={shade(c, -0.5)} />
                <rect x="180" y="268" width="50" height="18" rx="3" fill={shade(c, -0.5)} />
                <text x="205" y="196" textAnchor="middle" fontFamily="Space Grotesk Variable, sans-serif" fontSize="30" fontWeight="700" fill={shade(c, -0.35)}>100W</text>
            </g>
        </g>
    ),
    camera: ({ c }) => (
        <g>
            <Shadow rx={90} cy={336} />
            <rect x="186" y="210" width="28" height="90" rx="6" fill={shade(c, 0.1)} />
            <path d="M140 320 Q140 304 156 304 H244 Q260 304 260 320 V326 H140 Z" fill={c} />
            <rect x="70" y="110" width="260" height="110" rx="55" fill={shade(c, -0.2)} />
            <rect x="74" y="114" width="252" height="102" rx="51" fill={c} />
            <circle cx="200" cy="165" r="40" fill="#0d0e12" />
            <circle cx="200" cy="165" r="28" fill="#20335a" />
            <circle cx="200" cy="165" r="14" fill="#0b1328" />
            <circle cx="190" cy="154" r="7" fill="#fff" opacity="0.6" />
            <circle cx="120" cy="165" r="6" fill="#3fd17a" />
            <path d="M262 150 a20 20 0 0 1 0 30" stroke="#fff" strokeOpacity="0.35" strokeWidth="5" fill="none" />
        </g>
    ),
    dock: ({ c }) => (
        <g>
            <Shadow rx={160} cy={290} ry={12} />
            <path d="M50 190 L80 150 H320 L350 190 V250 Q350 262 338 262 H62 Q50 262 50 250 Z" fill={shade(c, -0.2)} />
            <path d="M80 150 H320 L350 190 H50 Z" fill={shade(c, 0.2)} />
            <rect x="50" y="190" width="300" height="66" fill={c} />
            {[0, 1, 2, 3, 4, 5].map(i => (
                <rect key={i} x={74 + i * 44} y={212} width={i < 3 ? 26 : 32} height={i < 3 ? 12 : 16} rx={i < 3 ? 6 : 2} fill="#121317" />
            ))}
            <circle cx="330" cy="232" r="5" fill="#3fd17a" />
        </g>
    ),
};

// Encuadres de la galería: vista completa y detalles ampliados de la misma foto.
const PHOTO_VIEWS = [
    { scale: 1, origin: "50% 50%" },
    { scale: 1.7, origin: "30% 35%" },
    { scale: 1.9, origin: "70% 60%" },
    { scale: 1.45, origin: "50% 80%" },
];

// Foto de estudio del producto (incluida en /public/products). Si falta o no carga,
// se usa la ilustración vectorial como respaldo.
export default function ProductArt({ product, view = 0, eager = false, ...rest }) {
    const [failed, setFailed] = useState(false);
    if (!product?.image || failed) return <ProductIllustration product={product} {...rest} />;
    const v = PHOTO_VIEWS[view % PHOTO_VIEWS.length];
    return (
        <img
            className={rest.className}
            src={product.image}
            alt={product.name}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            draggable={false}
            onError={() => setFailed(true)}
            style={{
                display: "block", width: "100%", height: "100%", objectFit: "cover",
                borderRadius: rest.rounded === false ? 0 : "inherit",
                transform: v.scale !== 1 ? `scale(${v.scale})` : undefined,
                transformOrigin: v.origin,
                background: "#efede8",
            }}
        />
    );
}

export function ProductIllustration({ product, color, className = "", rounded = true, bare = false }) {
    const rawId = useId();
    const id = rawId.replace(/:/g, "");
    const art = product?.art || { kind: "phone", bg: ["#eee", "#ddd"] };
    const body = color || product?.colors?.[0]?.hex || "#2b2d31";
    const Shape = SHAPES[art.kind] || SHAPES.phone;
    const [bg1, bg2] = art.bg || ["#eee", "#ddd"];
    return (
        <svg
            className={className}
            viewBox="0 0 400 400"
            role="img"
            aria-label={product?.name}
            style={{ display: "block", width: "100%", height: "100%", borderRadius: rounded ? "inherit" : 0 }}
        >
            <defs>
                <radialGradient id={`${id}-bg`} cx="0.5" cy="0.38" r="0.75">
                    <stop offset="0" stopColor={bg1} />
                    <stop offset="1" stopColor={bg2} />
                </radialGradient>
                <pattern id="mesh" width="8" height="8" patternUnits="userSpaceOnUse">
                    <circle cx="4" cy="4" r="1.4" fill="#000" />
                </pattern>
            </defs>
            {!bare && <rect width="400" height="400" fill={`url(#${id}-bg)`} />}
            <Shape id={id} c={body} seed={product?.id || 0} />
        </svg>
    );
}
