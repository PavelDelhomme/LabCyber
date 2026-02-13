"""
API volontairement vulnérable pour le lab (SQLi, auth faible, IDOR).
Usage éducatif uniquement.
"""
import sqlite3
import os
from flask import Flask, request, jsonify

app = Flask(__name__)
DB = "/data/lab.db"

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
    conn = get_db()
    # Vulnérable SQLi : concaténation directe
    row = conn.execute(
        "SELECT id, login, role FROM users WHERE login = '%s' AND password = '%s'" % (login, password)
    ).fetchone()
    conn.close()
    if row:
        return jsonify({"token": f"fake-{row['id']}", "role": row["role"]})
    return jsonify({"error": "Invalid credentials"}), 401

# IDOR : accès aux infos user par id sans vérification du token
@app.route("/api/users/<int:uid>")
def get_user(uid):
    conn = get_db()
    row = conn.execute("SELECT id, login, role FROM users WHERE id = ?", (uid,)).fetchone()
    conn.close()
    if row:
        return jsonify(dict(row))
    return jsonify({"error": "Not found"}), 404

# SQLi dans paramètre q
@app.route("/api/products")
def products():
    q = request.args.get("q", "")
    conn = get_db()
    # Vulnérable : construction SQL par concat
    sql = "SELECT id, name, price FROM products"
    if q:
        sql += " WHERE name LIKE '%" + q + "%'"
    try:
        rows = conn.execute(sql).fetchall()
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    conn.close()
    return jsonify([dict(r) for r in rows])

@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5000, debug=True)
