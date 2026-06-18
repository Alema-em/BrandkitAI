from flask import Blueprint, Response, jsonify, request

from backend.core.pdf_export import build_brand_pdf, pdf_filename

export_bp = Blueprint("export", __name__)


@export_bp.route("/export-pdf", methods=["POST"])
def export_pdf():
    brand_data = request.get_json(silent=True)

    if not brand_data or not isinstance(brand_data, dict):
        return jsonify({"error": "No brand data provided."}), 400

    try:
        pdf_bytes = build_brand_pdf(brand_data)
        filename = pdf_filename(brand_data)
        return Response(
            pdf_bytes,
            mimetype="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception:
        return jsonify({"error": "PDF export failed. Please try again."}), 500
