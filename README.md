# ShadeClimb

**ShadeClimb** es una aplicación web que permite al usuario:

- Seleccionar una **escuela** de escalada
- Seleccionar un **sector** dentro de la escuela
- Introducir un **día concreto** en el que va a realizar la actividad
- Visualizar información sobre la **incidencia del sol** en las distintas paredes del sector para ese día

---

## Tecnologías utilizadas

- **Backend:** Python
- **API:** Flask
- **Frontend:** HTML, CSS, JavaScript
- **Base de datos:** PostgreSQL
- **Despliegue:** Docker Compose

---

## Instalación

Clonar el repositorio:

```bash
git clone https://github.com/mvgmaria/ShadeClimb.git
cd ShadeClimb
```

---

Este proyecto utiliza archivos con datos GIS. Parte de ellos están incluidos en el repositorio, pero los ráster de cada una de las escuelas (`.tif`) no se incluyen debido a su tamaño.

Por el momento, solo se cuenta con una escuela de escalada procesada: Cuenca.

Para poder realizar la simulación correctamente, descarga el archivo desde el siguiente enlace:

**[Descargar _cuenca.tif_](https://drive.google.com/file/d/1tkGNM6YccxBDgR7xCm0FwC8T0V-zkd7U/view?usp=sharing)**

---

Una vez descargado, coloca el archivo en la siguiente ruta:

```
data/cuenca.tif
```

El repositorio ya incluye los archivos relativos a los sectores de escalada de esta escuela.

---

### Despliegue con Docker Compose

Para iniciar la aplicación:

```bash
docker-compose up --build
```

La aplicación estará disponible en:

```
http://localhost:5000
```

---
