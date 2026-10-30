from api.models import db
from api.seed import seed_catalog


def setup_commands(app):

    @app.cli.command("reset-catalog")
    def reset_catalog():
        """Borra todas las tablas y vuelve a cargar el catálogo de src/catalog/catalog.json."""
        db.drop_all()
        db.create_all()
        seed_catalog()
        print("Catálogo restaurado.")
