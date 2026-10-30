from flask import url_for


class APIException(Exception):
    status_code = 400

    def __init__(self, message, status_code=None, payload=None):
        Exception.__init__(self)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        rv = dict(self.payload or ())
        rv['message'] = self.message
        return rv


def has_no_empty_params(rule):
    defaults = rule.defaults if rule.defaults is not None else ()
    arguments = rule.arguments if rule.arguments is not None else ()
    return len(defaults) >= len(arguments)


def generate_sitemap(app):
    """Lista de endpoints GET navegables, solo para desarrollo."""
    links = sorted(
        url_for(rule.endpoint, **(rule.defaults or {}))
        for rule in app.url_map.iter_rules()
        if "GET" in rule.methods and has_no_empty_params(rule) and rule.rule.startswith("/api")
    )
    items = "".join(f"<li><a href='{link}'>{link}</a></li>" for link in links)
    return f"""
        <div style="font-family: system-ui, sans-serif; max-width: 640px; margin: 48px auto;">
        <h1>TechDrop API</h1>
        <p>Endpoints GET disponibles:</p>
        <ul>{items}</ul></div>"""
