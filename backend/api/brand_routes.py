from flask import Blueprint, jsonify, request

from backend.core.ai_engine import (
    OllamaError,
    OllamaTimeoutError,
    OllamaUnavailableError,
    generate_brand,
)

brand_bp = Blueprint("brand", __name__)


@brand_bp.route("/generate-brand", methods=["POST"])
def generate():
    data = request.json or {}
    idea = data.get("idea")

    try:
        result = generate_brand(idea)
        return jsonify(result)
    except OllamaTimeoutError as e:
        return jsonify({"error": str(e)}), 504
    except OllamaUnavailableError as e:
        return jsonify({"error": str(e)}), 503
    except OllamaError as e:
        return jsonify({"error": str(e)}), 503
    except ValueError as e:
        return jsonify({"error": str(e)}), 422
    except Exception:
        return jsonify({
            "error": "An unexpected error occurred during brand generation. Please try again."
        }), 500
