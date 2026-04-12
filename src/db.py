import psycopg2
from flask import jsonify

db_user = "Shadeclimb_user"
db_name = "Crags_db"
db_host = "localhost"
db_pw = "ABC123"


def get_crag():
    conn = psycopg2.connect(
        dbname=db_name,
        user=db_user,
        password=db_pw,
        host=db_host,
    )
    cur = conn.cursor()

    cur.execute('SELECT nombre, provincia, num_vias FROM public."Crags"')

    results = cur.fetchall()

    crags = []

    for crag in results:
        crags.append({"nombre": crag[0], "provincia": crag[1], "vias": crag[2]})

    return jsonify(crags)


if __name__ == "__main__":
    get_crag()
