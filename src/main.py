from dotenv import load_dotenv
import os
import rasterio
import geopandas as gpd
from rasterio.features import geometry_mask
import numpy as np
from pysolar.solar import get_altitude, get_azimuth
from datetime import datetime
import pytz
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors
from rasterio.transform import rowcol
import random

processed_sector = {}


def main(day, month, year):
    # paths a mis archivos (capa vectorial con el sector de escalada y raster de con el DEM - Modelo digital de elevación de Cuenca)
    base_dir = os.path.dirname(os.path.dirname(__file__))

    gpkg_path = os.path.join(base_dir, "data/juego_bolos.gpkg")
    tif_path = os.path.join(base_dir, "data/cuenca.tif")

    # construimos un objeto Geodataframe para los polígonos de la capa vectorial (dibujados en QGIS, para reducir el área de análisis y delimitar los sectores)
    walls = gpd.read_file(gpkg_path)

    # Abrimos el .tif con rasterio, y mapeamos cada valor de elevación del raster a un pixel, para poder acceder a los mismos por su índice
    with rasterio.open(tif_path) as src:
        raster_crs = src.crs
        elevation = src.read(1)
        transform = src.transform

    walls_crs = walls.to_crs(raster_crs)

    # Calculamos el gradiente de nuestra capa de elevación, siendo dy el cambio de Norte a Sur (por filas en nuestro array), y dx el cambio de Oeste a Este (por columnas)
    # Se están comparando la diferencia de elevación entre una "celda" y sus adyacentes en cada eje, las cuales se corresponden con 2 metros cuadrados en la realidad (la resolución de nuestro raster)
    dy, dx = np.gradient(elevation)
    # Computamos la pendiente con los datos de las derivadas parciales anteriores. Esta operación se hace por cada valor de los arrays 2d (dx, dy)
    slope = np.arctan(np.sqrt(dx**2 + dy**2))  # en radianes
    slope_pct = np.tan(slope) * 100  # en porcentaje
    # Calculamos la orientación, con la función arctan2 que nos da el rango completo equivalente al N-S, E-O, teniendo en cuenta que nuestro dx estaba siendo calculado a la inversa, por columnas, por lo que lo pasamos en negativo como argumento
    aspect = np.arctan2(-dx, dy)  # en radianes
    # definimos un mínimo de pendiente a partir de la cual entendemos que estamos ante una pared vertical, que son las que nos interesan. El raster va a tener muchos puntos que no son pendientes de dicha inclinación, y en estos no analizaremos la incidencia del sol
    slope_threshold = 70
    # efectuamos la comparación de la inclinación y guardamos valores True cuando la inclinación es mayor a la de nuestro mínimo
    wall_pixels_mask = slope_pct >= slope_threshold

    # Como queremos dar información genérica, además de la específica de la orientación general de la pared, añadimos la columna de "orientación media" en nuestro objeto Geodataframe, así como una columna para cada hora en la que mostraremos qué porcentaje de sombra está incidiendo
    walls["mean_aspect_deg"] = np.nan
    for hour in range(4, 23):
        walls[f"shade_{hour:02d}"] = np.nan

    # ponemos las coordenadas de cuenca para calcular una altitud y azimut aproximado del sol
    tz = pytz.timezone("Europe/Madrid")
    latitude = 40.07
    longitude = -2.14

    # Llenamos de valores Nan un array 2d del mismo tamaño de nuestro raster
    aspect_deg_masked = np.full(elevation.shape, np.nan)

    wall_data = []
    # Calculamos la orientación media de cada polígono, creando una máscara de los mismos con valores True dentro del área de la forma dibujada (cuando obtengamos la interseccion entre esta máscara y la que hemos construido con valores True para pendientes > al 70%, tendremos el área que nos interesa del sector que estamos analizando, y solo en las pendientes que son paredes)
    for idx, row in walls.iterrows():
        geom = [row.geometry]
        mask_poly = geometry_mask(
            geom, transform=transform, invert=True, out_shape=elevation.shape
        )
        polygon_wall_pixels = wall_pixels_mask & mask_poly
        # comprobamos los pixeles que tenemos en True, y para ellos obtenemos su valor correspondiente del array de orientaciones ("aspect")
        if np.any(polygon_wall_pixels):
            # orientación en grados para los pixeles del sector
            aspects_deg = np.degrees(aspect[polygon_wall_pixels])
            # normalizamos los valores negativos
            aspects_deg = (aspects_deg + 360) % 360
            # populamos nuestro geodataframe con la orientación media de cada muro del sector
            walls.at[idx, "mean_aspect_deg"] = aspects_deg.mean()
            # actualizamos nuestro array con la orientación obtenida en grados, para facilitar la asignación de colores en la generación posterior del plot
            aspect_deg_masked[polygon_wall_pixels] = aspects_deg
            # calculamos el porcentaje de sombra de cada polígono para cada hora del día
            for hour in range(4, 23):
                dt = datetime(
                    year, month, day, hour, 0, 0, tzinfo=tz
                )  # fecha hardcodeada de momento
                sun_altitude = get_altitude(latitude, longitude, dt)
                sun_azimuth = get_azimuth(latitude, longitude, dt)

                # si el sol no ha salido, sombra = 100%
                if sun_altitude <= 0:
                    percent_shade = 100.0

                # si el sol ha salido:
                # utilizamos la siguiente función que obtiene el coeficiente que nos dice cómo de alto está el sol en el cielo combinado con cómo de expuesta está la pared al sol, debido a su inclinación. Sumamos este término a el coeficiente inverso de dicha exposición, ya que cuanto más vertical la pared y más arriba esté el sol, menos importa cómo está orientada, y lo multiplicamos por dicha orientación.
                else:
                    alt_rad = np.radians(sun_altitude)  # a cada intervalo horario
                    az_rad = np.radians(sun_azimuth)

                    slope_pixels = slope[polygon_wall_pixels]
                    aspect_pixels = aspect[polygon_wall_pixels]

                    shaded = np.sin(alt_rad) * np.sin(slope_pixels) + np.cos(
                        alt_rad
                    ) * np.cos(slope_pixels) * np.cos(az_rad - aspect_pixels)
                    # guardamos los pixeles para los cuales nuestro coeficiente "shaded" ha salido negativo, es decir, el sol está arriba en el cielo, pero incide "por detrás" de la pared
                    shadow_pixels = shaded < 0
                    # obtenemos el porcentaje de pixeles que han quedado en la sombra para dar información sobre el muro que estamos analizando
                    percent_shade = (
                        np.sum(shadow_pixels) / np.sum(polygon_wall_pixels) * 100
                    )

                # guardamos los valores en nuestro geodataframe
                walls.at[idx, f"shade_{hour:02d}"] = percent_shade
                mean_dir = aspect_to_compass(aspects_deg.mean())

                wall_data.append(
                    {
                        "orientation": mean_dir,
                        "hour": f"{hour:02d}:00",
                        "shade": round(percent_shade, 1),
                    }
                )

                print(
                    f"Pared {mean_dir}, {hour:02d}:00 - {percent_shade:.1f}% de sombra"
                )

    # código para la generación del plot
    fig, ax = plt.subplots(figsize=(12, 8))

    colors = ["#0000ff", "#00ff00", "#ff0000", "#ffa500"]
    cmap = mcolors.LinearSegmentedColormap.from_list("north_to_south", colors)

    # obtenemos los límites de nuestros polígonos
    xmin, ymin, xmax, ymax = walls.total_bounds
    buffer = 5  # padding
    xmin -= buffer
    ymin -= buffer
    xmax += buffer
    ymax += buffer

    # asignamos los límites obtenidos a las coordenadas mapeadas a píxeles de nuestro raster de elevación transformado
    row_min, col_min = rowcol(transform, xmin, ymax)
    row_max, col_max = rowcol(transform, xmax, ymin)

    # cogemos de nuestro array de orientaciones la información dentro de los límites dibujados por el polígono
    aspect_crop = aspect_deg_masked[row_min:row_max, col_min:col_max]

    im = ax.imshow(aspect_crop, cmap=cmap)

    ticks = [0, 90, 180, 270]
    labels = ["N", "E", "S", "W"]

    cbar = plt.colorbar(im, ticks=ticks)
    cbar.ax.set_yticklabels(labels)

    ax.axis("off")

    plt.savefig(
        f"{base_dir}/static/juego_de_bolos_recortado.png", dpi=300, bbox_inches="tight"
    )
    plt.close(fig)

    # este diccionario se lo pasaría a una función posterior que aún tengo en desarrollo
    global processed_sector
    processed_sector = {
        "slope": slope,
        "aspect": aspect,
        "wall_pixel_mask": wall_pixels_mask,
        "transform": transform,
        "elevation": elevation,
        "walls_crs": walls_crs,
    }
    return {
        "wall_data": wall_data,
        "map_url": f"{base_dir}/static/juego_de_bolos_recortado.png",
    }


def aspect_to_compass(deg):
    if np.isnan(deg):
        return "desconocida"

    directions = [
        "Norte",
        "Nordeste",
        "Este",
        "Sudeste",
        "Sur",
        "Suroeste",
        "Oeste",
        "Noroeste",
    ]

    idx = int((deg + 22.5) % 360 // 45)
    return directions[idx]


if __name__ == "__main__":
    main()
