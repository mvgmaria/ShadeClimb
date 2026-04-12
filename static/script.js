window.onload = () => {
    document.getElementById("loader").classList.add("hidden");
    loadCrags();
};

let loading = false;

// CRAGS

async function loadCrags() {
    const tbody = document.querySelector("#cragsTable tbody");

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

            highlightRow(tr);
            await loadShade(crag.nombre);

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

function showLoader() {
    document.getElementById("loader").classList.add("active");
}

function hideLoader() {
    document.getElementById("loader").classList.remove("active");
}

async function loadShade(nombre) {

    const container = document.getElementById("shadeData");
    const title = document.getElementById("selectedTitle");
    const mapContainer = document.getElementById("mapContainer");

    title.style.display = "block";
    title.textContent = `Datos de sombra (${nombre})`;

    container.innerHTML = "";
    mapContainer.replaceChildren();

    showLoader();

    try {
        const res = await fetch("/api/datos_sombra");
        const data = await res.json();

        const walls = {};

        data.wall_data.forEach(item => {
            const match = item.match(/Pared (\d+)/);
            const id = match ? match[1] : "0";

            if (!walls[id]) walls[id] = [];
            walls[id].push(item);
        });

        // TABS

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

        // MAPA

        const img = new Image();
        img.src = "/static/juego_de_bolos_recortado.png?v=" + Date.now();
        img.style.width = "100%";
        img.style.borderRadius = "10px";

        mapContainer.appendChild(img);

    } catch (err) {
        console.error(err);
        container.innerHTML = "Error cargando datos";
    } finally {
        hideLoader();
    }
}