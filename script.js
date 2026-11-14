
// ==========================================
// TAROT ARCANO – ESPÍRITU Y ORIGEN
// Funcionalidad principal
// ==========================================

let cartas = [];
let tiradaActual = null;

// ==========================================
// ELEMENTOS DEL HTML
// ==========================================

const dailyCard = document.getElementById("daily-card");
const drawDailyButton = document.getElementById("draw-daily");
const threeReading = document.getElementById("three-reading");
const tarotLibrary = document.getElementById("tarot-library");

const readingHistory = document.getElementById("reading-history");
const clearHistoryButton = document.getElementById("clear-history");

const buscadorCartas = document.getElementById("search-card");

const MAX_LECTURAS = 20;
const STORAGE_KEY = "tarotArcanoHistorial";

let ultimaPestanaActiva = null;


// ==========================================
// CONFIGURACIÓN DE LAS TIRADAS
// ==========================================

const TIPOS_TIRADA = {

    general: {
        nombre: "Lectura general",
        descripcion: "Pasado, presente y futuro.",
        posiciones: ["Pasado", "Presente", "Futuro"]
    },

    amor: {
        nombre: "Amor y relaciones",
        descripcion: "Vos, la otra persona y el vínculo.",
        posiciones: ["Vos", "La otra persona", "El vínculo"]
    },

    trabajo: {
        nombre: "Trabajo y vocación",
        descripcion: "Situación, desafío, oportunidad y consejo.",
        posiciones: [
            "Situación actual",
            "Desafío",
            "Oportunidad",
            "Consejo"
        ]
    },

    dinero: {
        nombre: "Dinero y prosperidad",
        descripcion: "Tu situación económica y tus recursos.",
        posiciones: [
            "Situación económica",
            "Bloqueo",
            "Recursos disponibles",
            "Consejo"
        ]
    },

    familia: {
        nombre: "Familia y hogar",
        descripcion: "Los vínculos y la armonía familiar.",
        posiciones: [
            "Energía familiar",
            "Conflicto o tensión",
            "Lo que necesita atención",
            "Camino hacia la armonía"
        ]
    }

};


// ==========================================
// CARGAR LAS 78 CARTAS DESDE EL JSON
// ==========================================

async function cargarCartas() {

    try {

        const respuesta = await fetch("data/cartas.json");

        if (!respuesta.ok) {
            throw new Error(`Error HTTP ${respuesta.status}`);
        }

        const datos = await respuesta.json();

        if (!Array.isArray(datos) || datos.length !== 78) {
            throw new Error(
                "El archivo JSON no contiene las 78 cartas esperadas."
            );
        }

        cartas = datos;

        console.log(
            `Tarot Arcano: ${cartas.length} cartas cargadas correctamente.`
        );

        if (tarotLibrary) {
            tarotLibrary.dataset.categoriaActiva = "Arcanos Mayores";
        }

        crearModalBiblioteca();
        mostrarBiblioteca();
        mostrarHistorial();

    } catch (error) {

        console.error("Error al cargar las cartas:", error);

        if (tarotLibrary) {

            tarotLibrary.innerHTML = `
                <p class="no-results">
                    No se pudieron cargar las cartas.
                    Verificá que estés utilizando Live Server
                    y que data/cartas.json sea válido.
                </p>
            `;

        }

    }

}


// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

function obtenerCartaAleatoria() {

    if (cartas.length === 0) return null;

    const indice = Math.floor(Math.random() * cartas.length);

    return cartas[indice];

}


function estaInvertida() {

    return Math.random() < 0.5;

}


function mezclarMazo() {

    const mazo = [...cartas];

    for (let i = mazo.length - 1; i > 0; i--) {

        const j = Math.floor(Math.random() * (i + 1));

        [mazo[i], mazo[j]] = [mazo[j], mazo[i]];

    }

    return mazo;

}


function obtenerPalabrasClave(carta) {

    if (
        !Array.isArray(carta.palabrasClave) ||
        carta.palabrasClave.length === 0
    ) {

        return "su significado";

    }

    return carta.palabrasClave.slice(0, 2).join(" y ");

}


// ==========================================
// MOSTRAR UNA CARTA
// ==========================================

function crearCartaHTML(carta, invertida = false) {

    if (!carta) return "";

    const significado = invertida
        ? carta.invertido
        : carta.derecho;

    const orientacion = invertida
        ? "Invertida"
        : "Al derecho";

    const imagenHTML = carta.imagen
        ? `
            <div class="tarot-card-image-container">

                <img
                    class="tarot-card-image"
                    src="${carta.imagen}"
                    alt="${carta.nombre || "Carta de tarot"}"
                    onerror="this.style.display='none';"
                >

            </div>
        `
        : `
            <div class="tarot-card-image-placeholder">
                ✧
            </div>
        `;

    return `

        <article class="tarot-card tarot-card-horizontal ${invertida ? "is-reversed" : ""}">

            <div class="tarot-card-visual">

                ${imagenHTML}

                <p class="tarot-card-number">
                    ${carta.numero ?? ""}
                </p>

            </div>

            <div class="tarot-card-information">

                <div class="tarot-card-header">

                    <span>${carta.categoria || ""}</span>

                    <span>${orientacion}</span>

                </div>

                <h3>${carta.nombre || ""}</h3>

                <div class="tarot-card-meaning">

                    <h4>Significado e interpretación</h4>

                    <p>
                        ${significado || "No hay una interpretación disponible."}
                    </p>

                </div>

                <div class="tarot-card-keywords">

                    ${(carta.palabrasClave || []).map(palabra => `
                        <span>${palabra}</span>
                    `).join("")}

                </div>

            </div>

        </article>

    `;

}


// ==========================================
// CARTA DEL DÍA
// ==========================================

let cartaDelDiaPendiente = null;
let cartaDelDiaInvertida = false;
let cartaDelDiaRevelada = false;


function sacarCartaDelDia() {

    if (cartas.length === 0 || !dailyCard) return;

    cartaDelDiaPendiente = obtenerCartaAleatoria();

    cartaDelDiaInvertida = estaInvertida();

    cartaDelDiaRevelada = false;

    dailyCard.innerHTML = `

        <div class="daily-card-container">

            <button
                type="button"
                class="daily-card-back"
                id="reveal-daily-card"
                aria-label="Revelar carta del día"
            >

                <span class="daily-card-back-symbol">
                    ✦
                </span>

                <span class="daily-card-back-title">
                    TAROT ARCANO
                </span>

                <span class="daily-card-back-subtitle">
                    La carta te espera
                </span>

                <span class="daily-card-back-hint">
                    Hacé clic para revelar
                </span>

            </button>

        </div>

    `;

}


if (drawDailyButton) {

    drawDailyButton.addEventListener(
        "click",
        sacarCartaDelDia
    );

}


// Revelar carta del día
if (dailyCard) {

    dailyCard.addEventListener("click", function(event) {

        if (
            !event.target.closest("#reveal-daily-card") ||
            !cartaDelDiaPendiente ||
            cartaDelDiaRevelada
        ) {
            return;
        }

        cartaDelDiaRevelada = true;

        dailyCard.innerHTML = `

            <div class="daily-card-container daily-card-revealed">

                ${crearCartaHTML(
                    cartaDelDiaPendiente,
                    cartaDelDiaInvertida
                )}

            </div>

        `;

    });

}


// ==========================================
// INTERPRETACIÓN DE LAS TIRADAS
// ==========================================

function interpretarTirada(lectura, tipo = "general") {

    if (!Array.isArray(lectura) || lectura.length === 0) {
        return "";
    }

    const configuracion =
        TIPOS_TIRADA[tipo] || TIPOS_TIRADA.general;

    const temas = {

        Copas: "las emociones, los vínculos y los sentimientos",

        Espadas: "los pensamientos, las decisiones y los conflictos",

        Bastos: "la creatividad, la energía y los nuevos proyectos",

        Oros: "el trabajo, los recursos y la estabilidad material"

    };


    function interpretarPosicion(item) {

        const carta = item.carta;

        const palabras = obtenerPalabrasClave(carta);

        const posicion = item.posicion || "Posición";

        const significado = item.invertida
            ? carta.invertido
            : carta.derecho;

        const orientacion = item.invertida
            ? "invertida"
            : "al derecho";

        const introduccion = `
            ${carta.nombre} aparece ${orientacion}
            en la posición "${posicion}".
        `;

        const mensaje = significado || `
            Esta carta invita a reflexionar sobre ${palabras}.
        `;

        return `

            <div class="reading-insight">

                <h3>${posicion}</h3>

                <p>
                    <strong>${introduccion}</strong>
                </p>

                <p>${mensaje}</p>

                <p>
                    Esta posición invita a observar
                    ${palabras} dentro de este aspecto de la lectura.
                </p>

            </div>

        `;

    }


    // Contar Arcanos Mayores
    const cantidadMayores = lectura.filter(item => {

        const id = Number(item.carta.id);

        return Number.isInteger(id) && id >= 0 && id <= 21;

    }).length;


    // Detectar predominio de un palo
    const conteoPalos = {};

    lectura.forEach(item => {

        const categoria = item.carta.categoria;

        if (temas[categoria]) {

            conteoPalos[categoria] =
                (conteoPalos[categoria] || 0) + 1;

        }

    });


    const paloRepetido = Object.entries(conteoPalos)
        .filter(([, cantidad]) => cantidad >= 2)
        .sort((a, b) => b[1] - a[1])[0];


    let influencia = "";


    if (cantidadMayores >= 2) {

        influencia += `

            <p>
                <strong>Influencia de los Arcanos Mayores:</strong>

                aparecen ${cantidadMayores} Arcanos Mayores.
                Esto destaca aprendizajes, transformaciones
                y decisiones significativas.
            </p>

        `;

    } else if (cantidadMayores === 1) {

        influencia += `

            <p>
                <strong>Influencia de los Arcanos Mayores:</strong>

                aparece un Arcano Mayor que aporta un tema
                especialmente relevante a esta lectura.
            </p>

        `;

    } else {

        influencia += `

            <p>
                <strong>Influencia de los Arcanos Menores:</strong>

                la tirada se concentra en experiencias cotidianas,
                decisiones y situaciones concretas.
            </p>

        `;

    }


    if (paloRepetido) {

        const [palo, cantidad] = paloRepetido;

        influencia += `

            <p>
                <strong>Predominio de ${palo}:</strong>

                este palo aparece ${cantidad} veces y destaca
                ${temas[palo]} como un asunto importante
                para reflexionar.
            </p>

        `;

    }


    // Contar cartas invertidas
    const cantidadInvertidas = lectura.filter(
        item => item.invertida
    ).length;


    let orientaciones = "";


    if (cantidadInvertidas === lectura.length) {

        orientaciones = `
            Todas las cartas aparecen invertidas.
            Esto invita a prestar atención a los aspectos internos,
            los bloqueos y las situaciones que necesitan revisión.
        `;

    } else if (cantidadInvertidas > 0) {

        orientaciones = `
            Hay ${cantidadInvertidas} carta(s) invertida(s).
            Estas posiciones agregan matices de revisión,
            obstáculos o aspectos que necesitan mayor conciencia.
        `;

    } else {

        orientaciones = `
            Todas las cartas aparecen al derecho.
            La lectura presenta sus energías de manera directa,
            invitando a reconocer oportunidades y desafíos.
        `;

    }


    const interpretaciones = lectura.map(item => {

        return interpretarPosicion(item);

    }).join("");


    const nombresCartas = lectura.map(
        item => item.carta.nombre
    );

    const resumen = nombresCartas.join(", ");


    return `

        <section class="reading-interpretation">

            <h2>${configuracion.nombre}</h2>

            <p>
                ${configuracion.descripcion}
            </p>

            <p>
                Esta lectura está formada por ${lectura.length} cartas.
                Cada una representa una dimensión diferente
                de la consulta.
            </p>

            <div class="reading-card-interpretations">

                ${interpretaciones}

            </div>

            <div class="reading-conclusion">

                <h3>Influencias de la tirada</h3>

                ${influencia}

                <p>
                    <strong>Orientación de las cartas:</strong>
                    ${orientaciones}
                </p>

            </div>

            <div class="reading-question">

                <h3>El mensaje de la tirada</h3>

                <p>
                    Las cartas que aparecieron son:
                    ${resumen}.

                    En conjunto, ofrecen diferentes perspectivas
                    sobre la situación que consultaste.
                </p>

                <h3>Para reflexionar</h3>

                <p>
                    ¿Qué relación encontrás entre las cartas?

                    ¿Cuál de sus mensajes te resulta más significativo?

                    ¿Qué decisión o aprendizaje podés llevarte
                    de esta lectura?
                </p>

            </div>

            <p class="reading-disclaimer">
                Esta interpretación es simbólica y orientativa.

                El tarot no establece un futuro inevitable:
                invita a reflexionar sobre experiencias,
                posibilidades y decisiones.
            </p>

        </section>

    `;

}


// ==========================================
// REALIZAR UNA TIRADA
// ==========================================

function realizarTirada(tipo = "general") {

    if (cartas.length < 4 || !threeReading) return;

    const configuracion = TIPOS_TIRADA[tipo];

    if (!configuracion) {

        console.error("Tipo de tirada desconocido:", tipo);

        return;

    }

    const cantidad = configuracion.posiciones.length;

    if (cartas.length < cantidad) {

        console.error(
            "No hay suficientes cartas para esta tirada."
        );

        return;

    }


    // Seleccionar cartas diferentes
    const seleccionadas = mezclarMazo().slice(0, cantidad);


    // Preparar las cartas
    tiradaActual = seleccionadas.map((carta, indice) => ({

        carta,

        invertida: estaInvertida(),

        posicion: configuracion.posiciones[indice],

        revelada: false

    }));


    tiradaActual.tipo = tipo;

    tiradaActual.nombre = configuracion.nombre;


    // Mostrar cartas boca abajo
    threeReading.innerHTML = `

        <div class="reading-active">

            <div class="reading-active-heading">

                <span class="section-subtitle">
                    TU CONSULTA
                </span>

                <h2>${configuracion.nombre}</h2>

                <p>${configuracion.descripcion}</p>

            </div>

            <div class="reading-cards">

                ${tiradaActual.map((item, indice) => `

                    <div class="reading-position">

                        <h3>${item.posicion}</h3>

                        <button
                            type="button"
                            class="tarot-reveal-button"
                            data-index="${indice}"
                            aria-label="Revelar carta de ${item.posicion}"
                        >

                            <span class="tarot-card-back">

                                <span class="tarot-back-symbol">
                                    ✧
                                </span>

                                <span class="tarot-back-title">
                                    Tarot Arcano
                                </span>

                                <span class="tarot-back-decoration">
                                    ☾ ✦ ☽
                                </span>

                            </span>

                        </button>

                        <p class="reveal-hint">
                            Hacé clic para revelar
                        </p>

                    </div>

                `).join("")}

            </div>

            <p class="reading-progress">
                Revelá las ${cantidad} cartas para descubrir tu lectura.
            </p>

            <div id="reading-result"></div>

        </div>

    `;


    threeReading.scrollIntoView({

        behavior: "smooth",

        block: "start"

    });

}


// ==========================================
// REVELAR CARTAS INDIVIDUALMENTE
// ==========================================

if (threeReading) {

    threeReading.addEventListener("click", event => {

        const boton = event.target.closest(
            ".tarot-reveal-button"
        );

        if (!boton || !tiradaActual) return;


        const indice = Number(boton.dataset.index);

        const item = tiradaActual[indice];


        if (!item || item.revelada) return;


        // Marcar como revelada
        item.revelada = true;


        // Mostrar carta con su orientación correspondiente
        boton.outerHTML = `

            <div class="tarot-revealed">

                ${crearCartaHTML(
                    item.carta,
                    item.invertida
                )}

            </div>

        `;


        // Calcular progreso
        const cantidad = tiradaActual.length;

        const reveladas = tiradaActual.filter(
            carta => carta.revelada
        ).length;


        const progreso = threeReading.querySelector(
            ".reading-progress"
        );


        if (progreso) {

            progreso.textContent = reveladas === cantidad

                ? "Todas las cartas han sido reveladas."

                : `Revelaste ${reveladas} de ${cantidad} cartas.`;

        }


        // Mostrar resultado cuando todas estén reveladas
        if (reveladas === cantidad) {

            const resultado = threeReading.querySelector(
                "#reading-result"
            );


            if (resultado) {

                resultado.innerHTML = interpretarTirada(
                    tiradaActual,
                    tiradaActual.tipo
                );

            }


            guardarLectura(tiradaActual);

        }

    });

}


// ==========================================
// EVENTOS DE LOS BOTONES DE TIRADA
// ==========================================

document.querySelectorAll(".reading-type-button").forEach(boton => {

    boton.addEventListener("click", () => {

        const tipo = boton.dataset.reading;

        realizarTirada(tipo);

    });

});


// ==========================================
// HISTORIAL DE LECTURAS
// ==========================================

function obtenerHistorial() {

    try {

        const historial = JSON.parse(
            localStorage.getItem(STORAGE_KEY) || "[]"
        );

        return Array.isArray(historial) ? historial : [];

    } catch (error) {

        console.error(
            "No se pudo recuperar el historial:",
            error
        );

        return [];

    }

}


// ==========================================
// GUARDAR LECTURA
// ==========================================

function guardarLectura(lectura) {

    const historial = obtenerHistorial();


    const nuevaLectura = {

        fecha: new Date().toISOString(),

        tipo: lectura.tipo || "general",

        nombre: lectura.nombre || "Lectura general",

        cartas: lectura.map(item => ({

            carta: item.carta,

            invertida: item.invertida,

            posicion: item.posicion

        }))

    };


    historial.unshift(nuevaLectura);


    try {

        localStorage.setItem(

            STORAGE_KEY,

            JSON.stringify(
                historial.slice(0, MAX_LECTURAS)
            )

        );

        mostrarHistorial();

    } catch (error) {

        console.error(
            "No se pudo guardar la lectura:",
            error
        );

    }

}


// ==========================================
// MOSTRAR HISTORIAL
// ==========================================

function mostrarHistorial() {

    if (!readingHistory) return;


    const historial = obtenerHistorial();


    if (historial.length === 0) {

        readingHistory.innerHTML = `

            <p class="history-empty">
                Todavía no tenés lecturas guardadas.
                Realizá una tirada para comenzar tu historial.
            </p>

        `;

        return;

    }


    readingHistory.innerHTML = historial.map(lectura => {

        const fecha = new Date(lectura.fecha);


        const fechaTexto = Number.isNaN(fecha.getTime())

            ? "Fecha no disponible"

            : fecha.toLocaleString("es-AR", {

                day: "2-digit",

                month: "long",

                year: "numeric",

                hour: "2-digit",

                minute: "2-digit"

            });


        const cartasLectura = Array.isArray(lectura.cartas)

            ? lectura.cartas

            : [];


        const tipo = TIPOS_TIRADA[lectura.tipo]

            ? lectura.tipo

            : "general";


        const nombre = lectura.nombre ||
            TIPOS_TIRADA[tipo].nombre;


        const cartasHTML = cartasLectura.map(item => `

            <div class="reading-position">

                <h3>${item.posicion || "Carta"}</h3>

                ${crearCartaHTML(
                    item.carta,
                    item.invertida
                )}

            </div>

        `).join("");


        const interpretacion = interpretarTirada(
            cartasLectura,
            tipo
        );


        return `

            <details class="history-entry">

                <summary>

                    <span>${nombre}</span>

                    <span>${fechaTexto}</span>

                </summary>

                <div class="history-entry-content">

                    <div class="reading-cards">

                        ${cartasHTML}

                    </div>

                    ${interpretacion}

                </div>

            </details>

        `;

    }).join("");

}


// ==========================================
// BORRAR HISTORIAL
// ==========================================

function borrarHistorial() {

    const historial = obtenerHistorial();

    if (historial.length === 0) return;


    const confirmar = window.confirm(
        "¿Estás seguro de que querés borrar todas tus lecturas?"
    );


    if (!confirmar) return;


    localStorage.removeItem(STORAGE_KEY);

    mostrarHistorial();

}


if (clearHistoryButton) {

    clearHistoryButton.addEventListener(
        "click",
        borrarHistorial
    );

}


// ==========================================
// BIBLIOTECA: CREAR MODAL EN BODY
// ==========================================

function crearModalBiblioteca() {

    let modal = document.getElementById("library-modal");

    if (modal) return modal;


    modal = document.createElement("div");

    modal.className = "library-modal";

    modal.id = "library-modal";

    modal.setAttribute("aria-hidden", "true");


    modal.innerHTML = `

        <button
            type="button"
            class="library-modal-close"
            aria-label="Cerrar ficha"
        >
            ×
        </button>

        <div
            class="library-modal-content"
            role="dialog"
            aria-modal="true"
            aria-label="Información de la carta"
            tabindex="-1"
        >

            <div
                class="library-modal-body"
                id="library-modal-body"
            ></div>

        </div>

    `;


    document.body.appendChild(modal);

    return modal;

}


// ==========================================
// BIBLIOTECA: ABRIR FICHA
// ==========================================

function abrirFichaCarta(carta, botonOrigen = null) {

    if (!carta) return;


    const modal = crearModalBiblioteca();


    const modalBody = modal.querySelector(
        "#library-modal-body"
    );

    if (!modalBody) return;


    ultimaPestanaActiva = botonOrigen || document.activeElement;


    const palabrasClave = Array.isArray(carta.palabrasClave)

        ? carta.palabrasClave

        : [];


    modalBody.innerHTML = `

        <div class="library-modal-card">

            <div class="library-modal-visual">

                ${crearCartaHTML(carta)}

            </div>

            <div class="library-modal-info">

                <span class="library-modal-category">
                    ${carta.categoria || "Arcano"}
                </span>

                <h2>${carta.nombre || "Carta del tarot"}</h2>

                <span class="library-modal-number">
                    ${carta.numero ?? ""}
                </span>

                <section>

                    <h3>✧ Significado al derecho</h3>

                    <p>
                        ${carta.derecho || "Sin información disponible."}
                    </p>

                </section>

                <section>

                    <h3>☾ Significado invertido</h3>

                    <p>
                        ${carta.invertido || "Sin información disponible."}
                    </p>

                </section>

                <section>

                    <h3>✦ Simbolismo</h3>

                    <p>
                        ${carta.simbolismo || "Sin información disponible."}
                    </p>

                </section>

                <section>

                    <h3>Palabras clave</h3>

                    <div class="tarot-card-keywords">

                        ${palabrasClave.map(palabra => `
                            <span>${palabra}</span>
                        `).join("")}

                    </div>

                </section>

            </div>

        </div>

    `;


    modal.classList.add("is-open");

    modal.setAttribute("aria-hidden", "false");

    document.body.classList.add("library-modal-open");


    modal.scrollTop = 0;


    const botonCerrar = modal.querySelector(
        ".library-modal-close"
    );


    if (botonCerrar) {
        botonCerrar.focus();
    }

}


// ==========================================
// BIBLIOTECA: CERRAR FICHA
// ==========================================

function cerrarFichaCarta() {

    const modal = document.getElementById("library-modal");


    if (!modal || !modal.classList.contains("is-open")) {
        return;
    }


    modal.classList.remove("is-open");

    modal.setAttribute("aria-hidden", "true");

    document.body.classList.remove("library-modal-open");


    if (
        ultimaPestanaActiva &&
        ultimaPestanaActiva.isConnected
    ) {

        ultimaPestanaActiva.focus();

    }


    ultimaPestanaActiva = null;

}


// ==========================================
// BIBLIOTECA: MOSTRAR CARTAS POR CATEGORÍA
// ==========================================

function mostrarBiblioteca() {

    if (!tarotLibrary || !cartas.length) return;

    const busqueda = buscadorCartas?.value
        .toLowerCase()
        .trim() || "";

    const categoriaActiva =
        tarotLibrary.dataset.categoriaActiva || "Arcanos Mayores";

    const paloActivo = tarotLibrary.dataset.paloActivo || "Todos";
    const esMenores = categoriaActiva === "Arcanos Menores";

    // Actualizar las dos categorías principales.
    document.querySelectorAll(".category-tab").forEach(boton => {
        const activa =
            (boton.dataset.category === "mayores" && !esMenores) ||
            (boton.dataset.category === "menores" && esMenores);

        boton.classList.toggle("active", activa);
        boton.setAttribute("aria-selected", String(activa));
    });

    const palos = ["Copas", "Bastos", "Oros", "Espadas"];

    const cartasFiltradas = cartas.filter(carta => {
        const coincideCategoria = esMenores
            ? palos.includes(carta.categoria) &&
              (paloActivo === "Todos" || carta.categoria === paloActivo)
            : carta.categoria === "Arcanos Mayores";

        const textoCarta = [
            carta.nombre || "",
            carta.simbolismo || "",
            ...(Array.isArray(carta.palabrasClave)
                ? carta.palabrasClave
                : [])
        ].join(" ").toLowerCase();

        return coincideCategoria && textoCarta.includes(busqueda);
    });

    const contador = document.getElementById("library-count");
    if (contador) {
        contador.textContent = `${cartasFiltradas.length} cartas`;
    }

    const filtrosMenores = esMenores ? `
        <div class="library-minor-tabs" role="group" aria-label="Filtrar arcanos menores">
            <button type="button" class="library-minor-tab ${paloActivo === "Todos" ? "active" : ""}" data-suit="Todos">Todos</button>
            <button type="button" class="library-minor-tab ${paloActivo === "Copas" ? "active" : ""}" data-suit="Copas">♡ Copas</button>
            <button type="button" class="library-minor-tab ${paloActivo === "Bastos" ? "active" : ""}" data-suit="Bastos">✧ Bastos</button>
            <button type="button" class="library-minor-tab ${paloActivo === "Oros" ? "active" : ""}" data-suit="Oros">◈ Oros</button>
            <button type="button" class="library-minor-tab ${paloActivo === "Espadas" ? "active" : ""}" data-suit="Espadas">⚔ Espadas</button>
        </div>
    ` : "";

    const contenidoCartas = cartasFiltradas.length ? `
        <div class="library-category-grid">
            ${cartasFiltradas.map(carta => `
                <button
                    type="button"
                    class="library-card-tab"
                    data-id="${carta.id}"
                    aria-label="Ver ${carta.nombre}"
                >
                    <img
                        src="${carta.imagen || ""}"
                        alt="${carta.nombre}"
                        loading="lazy"
                    >
                    <span>${carta.nombre}</span>
                </button>
            `).join("")}
        </div>
    ` : `
        <p class="library-empty">No se encontraron cartas en esta categoría.</p>
    `;

    tarotLibrary.innerHTML = `
        <section class="library-category-section">
            ${filtrosMenores}
            ${contenidoCartas}
        </section>
    `;
}

// ==========================================
// EVENTOS DE LA BIBLIOTECA
// ==========================================

// Buscador
if (buscadorCartas) {
    buscadorCartas.addEventListener("input", () => {
        mostrarBiblioteca();
    });
}

// Categorías principales: Arcanos Mayores / Arcanos Menores
document.querySelectorAll(".category-tab").forEach(boton => {
    boton.addEventListener("click", () => {
        if (!tarotLibrary) return;

        tarotLibrary.dataset.categoriaActiva =
            boton.dataset.category === "mayores"
                ? "Arcanos Mayores"
                : "Arcanos Menores";

        tarotLibrary.dataset.paloActivo = "Todos";
        mostrarBiblioteca();
    });
});


// ==========================================
// EVENTOS DE LA BIBLIOTECA Y EL MODAL
// ==========================================

document.addEventListener("click", event => {

    // Filtros de los cuatro palos de los Arcanos Menores.
    const botonPalo = event.target.closest(".library-minor-tab");

    if (botonPalo && tarotLibrary?.contains(botonPalo)) {
        tarotLibrary.dataset.paloActivo = botonPalo.dataset.suit;
        mostrarBiblioteca();
        return;
    }

    // Botones de categorías adicionales
    const botonCategoria = event.target.closest(
        ".library-category-button"
    );


    if (
        botonCategoria &&
        tarotLibrary?.contains(botonCategoria)
    ) {

        const categoria = botonCategoria.dataset.category;

        tarotLibrary.dataset.categoriaActiva = categoria;

        mostrarBiblioteca();

        return;

    }


    // Abrir ficha de una carta
    const pestana = event.target.closest(
        ".library-card-tab"
    );


    if (pestana && tarotLibrary?.contains(pestana)) {

        const id = pestana.dataset.id;


        const carta = cartas.find(
            item => String(item.id) === String(id)
        );


        if (carta) {

            abrirFichaCarta(carta, pestana);

        }

        return;

    }


    // Cerrar modal
    const modal = document.getElementById("library-modal");


    if (!modal || !modal.classList.contains("is-open")) {
        return;
    }


    if (event.target.closest(".library-modal-close")) {

        cerrarFichaCarta();

        return;

    }


    if (event.target === modal) {

        cerrarFichaCarta();

    }

});


// ==========================================
// CERRAR MODAL CON ESCAPE
// ==========================================

document.addEventListener("keydown", event => {

    if (event.key === "Escape") {

        cerrarFichaCarta();

    }

});


// ==========================================
// INICIAR TAROT ARCANO
// ==========================================

crearModalBiblioteca();

cargarCartas();

