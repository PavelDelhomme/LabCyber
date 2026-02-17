"""
API volontairement vulnérable pour le lab (SQLi, auth faible, IDOR).
Usage éducatif uniquement.
"""
import sqlite3
import os
import json
import logging
import time
from datetime import datetime, timezone
from flask import Flask, request, jsonify, g

app = Flask(__name__)
DB = "/data/lab.db"
LOG_FILE = "/data/app.log"

def setup_logging():
    os.makedirs(os.path.dirname(LOG_FILE) or ".", exist_ok=True)
    formatter = logging.Formatter(
        "%(message)s"
    )
    handler_file = logging.FileHandler(LOG_FILE, encoding="utf-8")
    handler_file.setFormatter(formatter)
    handler_stdout = logging.StreamHandler()
    handler_stdout.setFormatter(formatter)
    logger = logging.getLogger("labcyber.vuln-api")
    logger.setLevel(logging.DEBUG)
    logger.handlers.clear()
    logger.addHandler(handler_file)
    logger.addHandler(handler_stdout)
    return logger

def log_structured(level, component, action, message, details=None):
    entry = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "level": level,
        "component": component,
        "action": action,
        "message": message,
        "details": details if details is not None else {},
    }
    msg = json.dumps(entry, ensure_ascii=False)
    if level == "ERROR":
        app_logger.error(msg)
    elif level == "WARN":
        app_logger.warning(msg)
    else:
        app_logger.info(msg)

app_logger = setup_logging()

@app.before_request
def before_request():
    g.request_start = time.perf_counter()

@app.after_request
def after_request(response):
    duration_ms = (time.perf_counter() - getattr(g, "request_start", time.perf_counter())) * 1000
    log_structured(
        "INFO",
        "vuln-api",
        "request",
        f"{request.method} {request.path} -> {response.status_code}",
        {"method": request.method, "path": request.path, "status_code": response.status_code, "duration_ms": round(duration_ms, 2)},
    )
    return response

def get_db():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    os.makedirs(os.path.dirname(DB) or ".", exist_ok=True)
    conn = sqlite3.connect(DB)
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, login TEXT, password TEXT, role TEXT);
        INSERT OR IGNORE INTO users (id, login, password, role) VALUES (1, 'admin', 'admin123', 'admin');
        INSERT OR IGNORE INTO users (id, login, password, role) VALUES (2, 'user', 'user123', 'user');
        CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY, name TEXT, price REAL);
        INSERT OR IGNORE INTO products (id, name, price) VALUES (1, 'Widget', 9.99), (2, 'Gadget', 19.99);
    """)
    conn.commit()
    conn.close()

# Auth faible : pas de rate limit, mot de passe en clair
@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(force=True, silent=True) or {}
    login = data.get("login", "")
    password = data.get("password", "")
    log_structured("INFO", "vuln-api", "login_attempt", "login attempt", {"login": login})
    conn = get_db()
    # Vulnérable SQLi : concaténation directe
    row = conn.execute(
        "SELECT id, login, role FROM users WHERE login = '%s' AND password = '%s'" % (login, password)
    ).fetchone()
    conn.close()
    if row:
        log_structured("INFO", "vuln-api", "login_success", "login success", {"login": login, "role": row["role"]})
        return jsonify({"token": f"fake-{row['id']}", "role": row["role"]})
    log_structured("WARN", "vuln-api", "login_failed", "invalid credentials", {"login": login})
    return jsonify({"error": "Invalid credentials"}), 401

# IDOR : accès aux infos user par id sans vérification du token
@app.route("/api/users/<int:uid>")
def get_user(uid):
    log_structured("INFO", "vuln-api", "get_user", "user lookup", {"uid": uid})
    conn = get_db()
    row = conn.execute("SELECT id, login, role FROM users WHERE id = ?", (uid,)).fetchone()
    conn.close()
    if row:
        return jsonify(dict(row))
    log_structured("WARN", "vuln-api", "get_user_not_found", "user not found", {"uid": uid})
    return jsonify({"error": "Not found"}), 404

# SQLi dans paramètre q
@app.route("/api/products")
def products():
    q = request.args.get("q", "")
    log_structured("INFO", "vuln-api", "products_query", "products list", {"q": q})
    conn = get_db()
    # Vulnérable : construction SQL par concat
    sql = "SELECT id, name, price FROM products"
    if q:
        sql += " WHERE name LIKE '%" + q + "%'"
    try:
        rows = conn.execute(sql).fetchall()
    except Exception as e:
        log_structured("ERROR", "vuln-api", "products_error", str(e), {"q": q})
        return jsonify({"error": str(e)}), 400
    conn.close()
    return jsonify([dict(r) for r in rows])

@app.route("/api/health")
def health():
    log_structured("INFO", "vuln-api", "health", "health check", {})
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    log_structured("INFO", "vuln-api", "startup", "vuln-api starting", {"db": DB, "log_file": LOG_FILE})
    init_db()
    app.run(host="0.0.0.0", port=5000, debug=True)
