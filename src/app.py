from flask import Flask, jsonify, render_template, request
from main import *
from db import *
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent

app = Flask(
    __name__,
    template_folder=str(BASE_DIR / "templates"),
    static_folder=str(BASE_DIR / "static"),
)


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/crags")
def crag_data():
    return jsonify(get_crag())


@app.route("/api/sectors/<int:crag_id>")
def sectors(crag_id):
    return jsonify(get_sector(crag_id))


@app.route("/api/datos_sombra")
def walls_data():

    day = int(request.args.get("day"))
    month = int(request.args.get("month"))
    year = int(request.args.get("year"))

    return jsonify(main(day, month, year))


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
