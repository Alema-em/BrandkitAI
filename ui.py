"""Backward-compatible Streamlit entry point.

Usage:
    streamlit run ui.py
    streamlit run frontend/streamlit/ui.py
"""

import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

import frontend.streamlit.ui  # noqa: F401, E402
