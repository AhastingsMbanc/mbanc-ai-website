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
app.secret_key = os.environ.get("SECRET_KEY", "mbanc-auth-dev-key")
app.config["SESSION_COOKIE_NAME"] = "mbanc_session"
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SECURE"] = False
app.config["SESSION_COOKIE_DOMAIN"] = os.environ.get("SESSION_COOKIE_DOMAIN", ".mbanc.ai")
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(hours=12)

AUTH_URL = os.environ.get("AUTH_URL", "https://auth.mbanc.ai")
AUTH_INTERNAL_URL = os.environ.get("AUTH_INTERNAL_URL", AUTH_URL)  # Docker-internal for proxy calls
DASHBOARD_URL = os.environ.get("DASHBOARD_URL", "https://mbanc.ai")
PP_INTERNAL_URL = os.environ.get("PP_INTERNAL_URL", "http://pricing-professor:5050")  # PricingProfessor on mbanc-net


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


def _fetch_active_loan_count():
    """Fetch active loan count from PricingProfessor API (internal network)."""
    try:
        resp = http_requests.get(f"{PP_INTERNAL_URL}/api/pipeline/active-count", timeout=5)
        if resp.status_code == 200:
            return resp.json().get("count")
    except Exception:
        pass
    return None


def _fetch_rate_sheet_update():
    """Fetch most recent rate sheet update UTC timestamp from PricingProfessor."""
    try:
        resp = http_requests.get(f"{PP_INTERNAL_URL}/api/rate-sheets/latest-update", timeout=5)
        if resp.status_code == 200:
            return resp.json().get("latest_utc")
    except Exception:
        pass
    return None


@app.route("/api/pipeline/active-count", methods=["GET"])
def proxy_active_count():
    """Proxy pipeline stats from PricingProfessor for dashboard JS polling."""
    count = _fetch_active_loan_count()
    if count is not None:
        return jsonify({"count": count})
    return jsonify({"count": None, "error": "unavailable"}), 502


@app.route("/api/rate-sheets/latest-update", methods=["GET"])
def proxy_rate_sheet_update():
    """Proxy rate sheet update UTC timestamp from PricingProfessor."""
    latest = _fetch_rate_sheet_update()
    if latest is not None:
        return jsonify({"latest_utc": latest})
    return jsonify({"latest_utc": None}), 502


@app.route("/")
def index():
    """Always render dashboard — login overlay shows if not authenticated."""
    authenticated = "user_id" in session
    active_loans = _fetch_active_loan_count()
    rate_sheet_utc = _fetch_rate_sheet_update()
    return render_template(
        "dashboard.html",
        user=session if authenticated else {},
        auth_url=AUTH_URL,
        rate_sheet_utc=rate_sheet_utc,
        brand=BRAND,
        authenticated=authenticated,
        active_loans=active_loans,
    )


@app.route("/logout")
def logout():
    """Clear session and reload dashboard (overlay will appear)."""
    session.clear()
    return redirect("/")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5070, debug=False)
