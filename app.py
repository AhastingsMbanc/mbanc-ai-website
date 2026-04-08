"""
mbanc.ai Dashboard
==================
Main dashboard for all mbanc.ai applications.
Reads the shared session cookie from auth.mbanc.ai.
If not authenticated, shows login overlay on top of dashboard.

CRITICAL: Must share the same SECRET_KEY as auth.mbanc.ai.
"""

import os
import json
import requests as http_requests
from datetime import timedelta
from flask import Flask, session, redirect, request, render_template, jsonify


def _load_brand_config():
    """Load brand config from config/brand.json."""
    config_paths = [
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "config", "brand.json"),
        "/app/config/brand.json",
    ]
    for p in config_paths:
        if os.path.exists(p):
            with open(p) as f:
                return json.load(f)
    return {}

BRAND = _load_brand_config()

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "mbanc-auth-dev-key-change-in-production")
app.config["SESSION_COOKIE_NAME"] = "mbanc_session"
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SECURE"] = os.environ.get("FLASK_ENV") == "production"
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(hours=12)

# Must match auth.mbanc.ai's cookie domain
if os.environ.get("FLASK_ENV") == "production":
    app.config["SESSION_COOKIE_DOMAIN"] = ".mbanc.ai"

AUTH_URL = os.environ.get("AUTH_URL", "https://auth.mbanc.ai")
AUTH_INTERNAL_URL = os.environ.get("AUTH_INTERNAL_URL", AUTH_URL)  # Docker-internal for proxy calls
DASHBOARD_URL = os.environ.get("DASHBOARD_URL", "https://mbanc.ai")


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200


@app.route("/api/auth/login", methods=["POST"])
def proxy_login():
    """Proxy login to auth.mbanc.ai and set session locally."""
    data = request.get_json(force=True)
    try:
        resp = http_requests.post(
            f"{AUTH_INTERNAL_URL}/api/auth/login",
            json=data,
            timeout=10,
        )
        result = resp.json()
        if resp.status_code == 200 and "user" in result:
            user = result["user"]
            session.permanent = True
            session["user_id"] = user.get("id", "")
            session["email"] = user.get("email", "")
            session["username"] = user.get("username", "")
            session["role"] = user.get("role", "lo")
            session["display_name"] = user.get("display_name", "")
            session["first_name"] = user.get("first_name", "")
            session["last_name"] = user.get("last_name", "")
        return jsonify(result), resp.status_code
    except Exception as e:
        return jsonify({"error": f"Auth service unavailable: {str(e)}"}), 502


@app.route("/")
def index():
    """Always render dashboard — login overlay shows if not authenticated."""
    authenticated = "user_id" in session
    return render_template(
        "dashboard.html",
        user=session if authenticated else {},
        auth_url=AUTH_URL,
        brand=BRAND,
        authenticated=authenticated,
    )


@app.route("/logout")
def logout():
    """Clear session and reload dashboard (overlay will appear)."""
    session.clear()
    return redirect("/")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5070, debug=False)
