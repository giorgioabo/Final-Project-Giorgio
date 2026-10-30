# TechDrop ⚡

> Tienda online de tecnología full stack con React y Flask. Diseño propio, catálogo propio y una arquitectura que mantiene la web en pie aunque el backend caiga.

🔗 **Demo en vivo:** [cozy-frangipane-33a56e.netlify.app](https://cozy-frangipane-33a56e.netlify.app/)

---

## ✨ Qué incluye

### Tienda
- **Portada interactiva**:
  - Escaparate giratorio que se inclina con el ratón y contadores animados.
  - Carrusel por categorías y asistente de compra (3 preguntas que recomiendan productos).
  - Escritorio "compra el setup" con puntos sobre cada producto.
  - Oferta semanal con cuenta atrás, opiniones, vistos recientemente y newsletter.
- **Vista rápida** y **comparador** de hasta 3 productos, con el mejor precio y la mejor valoración destacados.
- Ficha con **zoom al pasar el ratón**, barra de compra fija, pack "Cómpralo junto" y preguntas frecuentes.
- **Catálogo** con búsqueda, filtros combinables (categoría, marca, precio, valoración, stock, novedades), 6 ordenaciones y filtros guardados en la URL.
- **Buscador instantáneo** en la barra de navegación, con navegación por teclado.
- **Ficha de producto** con galería por color, versiones, stock en tiempo real, fecha estimada de entrega, especificaciones y reseñas (los usuarios pueden publicar las suyas).
- **Carrito lateral** persistente, barra de progreso hacia el envío gratis y **cupones** (`TECHDROP10`, `BIENVENIDA`).
- **Checkout en pasos** con validación de dirección, envío estándar o express y pago de demostración con validación de tarjeta (algoritmo de Luhn).
- **Cuenta de usuario**: resumen, historial de pedidos con seguimiento de estado y lista de favoritos.

### Panel de administración
- KPIs (ingresos, pedidos, ticket medio, clientes) y **gráfica de ingresos** de los últimos 14 días.
- Productos más vendidos y alertas de **stock bajo**.
- **CRUD de productos** con vista previa de la ilustración en vivo.
- **Gestión de pedidos**: pagado → preparando → enviado → entregado / cancelado (al cancelar se repone el stock).
- Listado de clientes con su gasto total.

### Calidad
- Diseño responsive pensado primero para el móvil, accesible (foco visible, etiquetas ARIA, `prefers-reduced-motion`) y con SEO básico (metadatos y Open Graph).
- Las páginas se cargan bajo demanda (code splitting) y las fuentes van incluidas en el proyecto, sin CDNs.
- Pruebas automáticas de la API con `pytest`.

---

## 🧱 Arquitectura: siempre online

El catálogo (24 productos de marcas ficticias) vive en [`src/catalog/catalog.json`](src/catalog/catalog.json). Las fotos de estudio están en [`public/products/`](public/products), generadas con IA, sin logotipos y optimizadas en WebP (unos 30 KB cada una). Si alguna falta, se dibuja una ilustración SVG de respaldo ([`ProductArt.jsx`](src/front/components/ProductArt.jsx)). **No depende de imágenes ni de bases de datos externas que puedan caducar.**

El frontend tiene dos modos ([`src/front/lib/api.js`](src/front/lib/api.js)):

| Modo | Cuándo | Qué hace |
|---|---|---|
| **remote** | `VITE_BACKEND_URL` responde y `/api/health` confirma que la base de datos funciona | Usa la API Flask: cuentas, pedidos y administración reales |
| **local** | No hay backend, está dormido o su base de datos falla | Todo funciona en el navegador (cuentas, pedidos y admin demo con `localStorage`) |

El backend, al arrancar, **crea las tablas y carga el catálogo** si la base de datos está vacía. Si no hay `DATABASE_URL`, usa SQLite. La tienda nunca se queda sin productos.

---

## 🛠️ Tecnologías

**Frontend:** React 18, React Router 6, Vite, CSS propio con design tokens, Lucide Icons, Inter y Space Grotesk.
**Backend:** Python, Flask, SQLAlchemy 2, Flask-JWT-Extended, Flask-Bcrypt.
**Base de datos:** Lakebase Postgres en Neon (o SQLite como respaldo) y Neon Object Storage para las fotos.
**Despliegue:** Netlify (frontend) y Render (API).

---

## ⚙️ Instalación local

```bash
git clone https://github.com/giorgioabo/Final-Project-Giorgio
cd Final-Project-Giorgio
cp .env.example .env
```

**Frontend** (funciona solo, en modo local):
```bash
npm install
npm run dev          # http://localhost:3000
```

**Backend** (opcional):
```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python src/app.py           # http://localhost:3001
pytest -q                   # pruebas de la API
```

Para conectar los dos, añade `VITE_BACKEND_URL=http://localhost:3001` a tu `.env`.

---

## 🔑 Variables de entorno

| Variable | Dónde | Descripción |
|---|---|---|
| `VITE_BACKEND_URL` | Netlify | URL de la API. Sin ella, la tienda funciona en modo local |
| `DATABASE_URL` | Render | PostgreSQL (por ejemplo, Neon o Supabase, que no caducan). Sin ella se usa SQLite |
| `JWT_SECRET_KEY` | Render | Clave para firmar las sesiones |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_ENDPOINT_URL_S3` / `AWS_REGION` | Render | Bucket de Neon Object Storage para las fotos que sube el administrador |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Render | Crean el administrador al arrancar |
| `CORS_ORIGINS` | Render | Dominios que pueden llamar a la API (por ejemplo, la URL de Netlify) |

---

## 🔌 API

| Método | Ruta | Acceso |
|---|---|---|
| GET | `/api/health` | Público |
| POST | `/api/auth/register`, `/api/auth/login` | Público |
| GET | `/api/auth/me` | Usuario |
| GET | `/api/products`, `/api/products/:id`, `/api/categories` | Público |
| POST / PUT / DELETE | `/api/products[/:id]` | Admin |
| POST / GET | `/api/orders` | Usuario |
| GET / PUT | `/api/admin/orders[/:id]` | Admin |
| GET | `/api/admin/users` | Admin |
| POST | `/api/admin/uploads` | Admin (sube una foto al bucket) |
| GET | `/api/media/:key` | Público (redirige a una URL firmada) |

---

## 👨‍💻 Autor

**Giorgio Abdalla Behna Occhipinti**, Full Stack Developer.

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/giorgioabo)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/giorgioabo)

<sub>Productos, marcas y reseñas de la tienda son ficticios y se usan solo con fines de demostración.</sub>
