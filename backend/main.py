from pathlib import Path

from flask import Flask, send_from_directory
from flask_cors import CORS

from backend.api.brand_routes import brand_bp
from backend.api.export_routes import export_bp

PROJECT_ROOT = Path(__file__).resolve().parent.parent
WEB_ROOT = PROJECT_ROOT / "frontend" / "web"
WEB_ASSETS = {"index.html", "style.css", "reveal-v2.css", "reveal-v3.css", "script.js", "api.js"}


def create_app():
    app = Flask(__name__)
    CORS(app)
    app.register_blueprint(brand_bp)
    app.register_blueprint(export_bp)

    @app.get("/")
    def serve_ui():
        return send_from_directory(WEB_ROOT, "index.html")

    @app.get("/<path:asset>")
    def serve_asset(asset):
        if asset in WEB_ASSETS:
            return send_from_directory(WEB_ROOT, asset)
        return {"error": "Not found"}, 404

    return app


app = create_app()


if __name__ == "__main__":
    print("BrandForge UI: http://127.0.0.1:5000")
    app.run(debug=True)
