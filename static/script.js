window.onload = async () => {
    document.getElementById("loader").classList.add("hidden");

    document.getElementById("cragsTable").style.display = "table";
    document.getElementById("sectorsTable").style.display = "none";
    document.getElementById("backBtn").style.display = "none";
    document.getElementById("simulationPanel").style.display = "none";

    setTitle("Escuelas de escalada");

    loadCrags();
};


let selectedSectorRow = null;

function setTitle(text) {
    const title = document.getElementById("mainTitle");
    title.style.display = "block";
    title.textContent = text;
}

function showLoader() {
    document.getElementById("loader").classList.add("active");
}

function hideLoader() {
    document.getElementById("loader").classList.remove("active");
}


async function loadCrags() {
    const tbody = document.querySelector("#cragsTable tbody");

    showLoader();

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

            document.getElementById("cragsTable").style.display = "none";
            document.getElementById("sectorsTable").style.display = "table";
            document.getElementById("simulationPanel").style.display = "none";
            document.getElementById("backBtn").style.display = "block"; // ✅ RESTAURADO

            setTitle(`Sectores de ${crag.nombre}`);

            await loadSectors(crag.id_escuela);
        };

        tbody.appendChild(tr);
    });

    hideLoader();
}

async function loadSectors(cragId) {
    const tbody = document.querySelector("#sectorsTable tbody");
    const emptyState = document.getElementById("emptyState");

    showLoader();

    const res = await fetch(`/api/sectors/${cragId}`);
    const data = await res.json();

    tbody.innerHTML = "";
    emptyState.innerHTML = "";
    emptyState.style.display = "none";

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

        tr.onclick = () => {

            if (selectedSectorRow) {
                selectedSectorRow.classList.remove("selected");
            }

            selectedSectorRow = tr;
            tr.classList.add("selected");

            document.getElementById("simulationPanel").style.display = "block";
        };

        tbody.appendChild(tr);
    });

    hideLoader();
}


document.getElementById("simulateBtn").onclick = async () => {

    const day = document.getElementById("day").value;
    const month = document.getElementById("month").value;
    const year = document.getElementById("year").value;

    if (!day || !month || !year) {
        alert("Introduce día, mes y año");
        return;
    }

    await loadShade(day, month, year);
};

async function loadShade(day, month, year) {

    const container = document.getElementById("shadeData");
    const mapContainer = document.getElementById("mapContainer");

    container.innerHTML = "";
    mapContainer.innerHTML = "";

    showLoader();

    try {
        const url = `/api/datos_sombra?day=${day}&month=${month}&year=${year}`;
        const res = await fetch(url);
        const data = await res.json();

        const walls = {};

        data.wall_data.forEach(item => {
            if (!walls[item.orientation]) walls[item.orientation] = [];
            walls[item.orientation].push(
                `Hora: ${item.hour} - ${item.shade}% de sombra`
            );
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

document.getElementById("backBtn").onclick = () => {

    document.getElementById("cragsTable").style.display = "table";
    document.getElementById("sectorsTable").style.display = "none";
    document.getElementById("simulationPanel").style.display = "none";
    document.getElementById("backBtn").style.display = "none";

    document.getElementById("shadeData").innerHTML = "";
    document.getElementById("mapContainer").innerHTML = "";

    document.getElementById("emptyState").innerHTML = "";
    document.getElementById("emptyState").style.display = "none";

    selectedSectorRow = null;

    setTitle("Escuelas de escalada");
};