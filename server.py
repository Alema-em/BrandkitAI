"""Backward-compatible Flask entry point.

Usage:
    python server.py
    python -m backend.main

Opens the web UI at http://127.0.0.1:5000
"""

from backend.main import app

if __name__ == "__main__":
    print("BrandForge UI: http://127.0.0.1:5000")
    app.run(debug=True)
