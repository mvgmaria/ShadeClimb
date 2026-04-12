window.onload = async () => {
    document.getElementById("loader").classList.add("hidden");

    document.getElementById("cragsTable").style.display = "table";
    document.getElementById("sectorsTable").style.display = "none";
    document.getElementById("backBtn").style.display = "none";

    setTitle("Escuelas de escalada");

    loadCrags();
};

let loading = false;

function setTitle(text) {
    const title = document.getElementById("mainTitle");
    title.style.display = "block";
    title.textContent = text;
}

// LOADER

function showLoader() {
    document.getElementById("loader").classList.add("active");
}

function hideLoader() {
    document.getElementById("loader").classList.remove("active");
}

// ESCUELAS

async function loadCrags() {
    const tbody = document.querySelector("#cragsTable tbody");
    const emptyState = document.getElementById("emptyState");
    if (emptyState) {
        emptyState.innerHTML = "";
        emptyState.style.display = "none";
}

    const res = await fetch("/api/crags");
    const data = await res.json();

    tbody.innerHTML = "";

    data.forEach(crag => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${crag.nombre}</td>
            <td>${crag.provincia}</td>
            <td>${crag.vias}</td>
        `;

        tr.onclick = async () => {
            if (loading) return;
            loading = true;

            showLoader();

            setTitle(`Sectores de ${crag.nombre}`);

            document.getElementById("backBtn").style.display = "block";
            document.getElementById("cragsTable").style.display = "none";
            document.getElementById("sectorsTable").style.display = "table";

            highlightRow(tr);

            await loadSectors(crag.id_escuela);

            loading = false;
        };

        tbody.appendChild(tr);
    });
}

function highlightRow(row) {
    document.querySelectorAll("#cragsTable tr")
        .forEach(r => r.classList.remove("selected"));
    row.classList.add("selected");
}

// SECTORES

async function loadSectors(cragId) {
    const tbody = document.querySelector("#sectorsTable tbody");
    const emptyState = document.getElementById("emptyState");

    tbody.innerHTML = "";
    emptyState.style.display = "none";
    emptyState.innerHTML = "";

    const res = await fetch(`/api/sectors/${cragId}`);
    const data = await res.json();

    if (!data || data.length === 0) {
        document.getElementById("sectorsTable").style.display = "none";

        emptyState.style.display = "block";
        emptyState.innerHTML = `
            <div style="
                padding: 20px;
                margin-top: 20px;
                background: #fff3cd;
                border: 1px solid #ffeeba;
                border-radius: 8px;
                color: #856404;
                font-size: 16px;
            ">
                Escuela pendiente de procesamiento
            </div>
        `;

        hideLoader();
        return;
    }

    document.getElementById("sectorsTable").style.display = "table";

    data.forEach(sector => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${sector.nombre}</td>
            <td>${sector.vias}</td>
            <td>${sector.min_grado}</td>
            <td>${sector.max_grado}</td>
        `;

        tr.onclick = async () => {
            await loadShade(sector.id_sector);
        };

        tbody.appendChild(tr);
    });

    hideLoader();
}

// SIMULACIÓN DE SOMBRA

async function loadShade(sectorId) {

    const container = document.getElementById("shadeData");
    const mapContainer = document.getElementById("mapContainer");

    container.innerHTML = "";
    mapContainer.replaceChildren();

    showLoader();

    try {
        const res = await fetch("/api/datos_sombra");
        const data = await res.json();

        const walls = {};

        data.wall_data.forEach(item => {

            const id = item.orientation;

            if (!walls[id]) walls[id] = [];

            walls[id].push(`Hora: ${item.hour} - ${item.shade}% de sombra`);
        });

        const tabs = document.createElement("div");
        tabs.id = "tabs";

        const content = document.createElement("div");
        content.id = "tabContent";

        container.appendChild(tabs);
        container.appendChild(content);

        let first = true;

        Object.keys(walls).forEach(id => {

            const btn = document.createElement("button");
            btn.textContent = `Pared ${id}`;

            const render = () => {
                content.innerHTML = "";

                walls[id].forEach(t => {
                    const div = document.createElement("div");
                    div.className = "card";
                    div.textContent = t;
                    content.appendChild(div);
                });

                document.querySelectorAll("#tabs button")
                    .forEach(b => b.classList.remove("active"));

                btn.classList.add("active");
            };

            btn.onclick = render;
            tabs.appendChild(btn);

            if (first) {
                render();
                first = false;
            }
        });

        const img = new Image();
        img.src = "/static/juego_de_bolos_recortado.png?v=" + Date.now();
        img.style.width = "100%";
        img.style.borderRadius = "10px";

        mapContainer.appendChild(img);

    } catch (err) {
        container.innerHTML = "Error cargando datos";
    } finally {
        hideLoader();
    }
}

// BOTÓN "VOLVER A ESCUELAS"

document.getElementById("backBtn").onclick = () => {

    document.getElementById("cragsTable").style.display = "table";
    document.getElementById("sectorsTable").style.display = "none";
    document.getElementById("backBtn").style.display = "none";

    document.getElementById("shadeData").innerHTML = "";
    document.getElementById("mapContainer").innerHTML = "";

    const emptyState = document.getElementById("emptyState");
    if (emptyState) {
        emptyState.innerHTML = "";
        emptyState.style.display = "none";
    }

    setTitle("Escuelas de escalada");
};