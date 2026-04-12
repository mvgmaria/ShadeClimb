import psycopg2
from flask import jsonify
from dotenv import load_dotenv
import os

load_dotenv()


def get_connection():
    return psycopg2.connect(
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PW"),
        host=os.getenv("DB_HOST"),
    )


def get_crag():

    conn = get_connection()
    cur = conn.cursor()
    cur.execute('SELECT id_escuela, nombre, provincia, num_vias FROM public."Crags"')

    results = cur.fetchall()

    crags = []

    for crag in results:
        crags.append(
            {
                "id_escuela": crag[0],
                "nombre": crag[1],
                "provincia": crag[2],
                "vias": crag[3],
            }
        )

    conn.close()

    return jsonify(crags)


def get_sector(crag_id):

    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        """
        SELECT nombre, min_grado, max_grado, num_vias
        FROM public."Sectors"
        WHERE id_escuela = %s
    """,
        (crag_id,),
    )

    results = cur.fetchall()
    conn.close()

    sectors = []

    for sector in results:
        sectors.append(
            {
                "nombre": sector[0],
                "min_grado": sector[1],
                "max_grado": sector[2],
                "vias": sector[3],
            }
        )

    return sectors


if __name__ == "__main__":
    get_crag()
