"""
Servidor de la API de TechDrop: configura la base de datos, la autenticación y los endpoints.
"""
import logging
import os
import secrets
from datetime import timedelta

from dotenv import load_dotenv
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from werkzeug.middleware.proxy_fix import ProxyFix

# En local, `neon deploy` deja las credenciales de Neon en .env.local.
# Las variables reales del entorno (Render) siempre tienen prioridad.
_root = os.path.join(os.path.dirname(os.path.realpath(__file__)), "..")
load_dotenv(os.path.join(_root, ".env.local"))
load_dotenv(os.path.join(_root, ".env"))

from api.utils import APIException, generate_sitemap
from api.models import db
from api.routes import api, bcrypt
from api.seed import seed_catalog, seed_admin
from api.commands import setup_commands

log = logging.getLogger("techdrop")
logging.basicConfig(level=logging.INFO)

ENV = "development" if os.getenv("FLASK_DEBUG") == "1" else "production"
static_file_dir = os.path.join(os.path.dirname(os.path.realpath(__file__)), '../dist/')
app = Flask(__name__)
app.url_map.strict_slashes = False
# Render termina HTTPS en su proxy: así las URLs que generamos usan https.
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Base de datos: PostgreSQL si hay DATABASE_URL (en Neon, la URL con -pooler,
# recomendada para el tráfico de la app); si no, SQLite local.
# Con SQLite la tienda sigue funcionando y se vuelve a sembrar sola si se reinicia.
db_url = os.getenv("DATABASE_URL")
if db_url:
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url.replace("postgres://", "postgresql://", 1)
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {"pool_pre_ping": True, "pool_recycle": 280}
else:
    os.makedirs(app.instance_path, exist_ok=True)
    app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:///" + os.path.join(app.instance_path, "techdrop.db")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

jwt_secret = os.getenv("JWT_SECRET_KEY")
if not jwt_secret:
    # Sin clave configurada generamos una aleatoria: las sesiones se invalidan al reiniciar,
    # pero nunca usamos una clave conocida públicamente.
    jwt_secret = secrets.token_hex(32)
    log.warning("JWT_SECRET_KEY no está configurada; usando una clave temporal.")
app.config['JWT_SECRET_KEY'] = jwt_secret
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)

# CORS: por defecto cualquier origen; en producción conviene fijar CORS_ORIGINS
# (por ejemplo https://tu-sitio.netlify.app). La API usa tokens, no cookies.
origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",") if o.strip()]
CORS(app, resources={r"/api/*": {"origins": origins}})

db.init_app(app)
JWTManager(app)
bcrypt.init_app(app)
setup_commands(app)
app.register_blueprint(api, url_prefix='/api')

with app.app_context():
    try:
        db.create_all()
        if seed_catalog():
            log.info("Catálogo cargado en la base de datos.")
        if seed_admin(bcrypt):
            log.info("Administrador creado a partir de ADMIN_EMAIL.")
    except Exception:
        log.exception("No se pudo preparar la base de datos")


@app.errorhandler(APIException)
def handle_invalid_usage(error):
    return jsonify(error.to_dict()), error.status_code


@app.route('/')
def sitemap():
    if ENV == "development":
        return generate_sitemap(app)
    return send_from_directory(static_file_dir, 'index.html')


@app.route('/<path:path>', methods=['GET'])
def serve_any_other_file(path):
    if not os.path.isfile(os.path.join(static_file_dir, path)):
        path = 'index.html'
    response = send_from_directory(static_file_dir, path)
    response.cache_control.max_age = 0
    return response


if __name__ == '__main__':
    PORT = int(os.environ.get('PORT', 3001))
    app.run(host='0.0.0.0', port=PORT, debug=True)
