const CARRITO_KEY = "carritoFoodie";

// ==========================================
// 1. BARRITA FLOTANTE (REEMPLAZO DE ALERTS)
// ==========================================
function mostrarNotificacion(mensaje, tipo = "normal") {
    let barra = document.getElementById("notificacion-flotante");
    
    // Si la barra aún no existe en el HTML, la crea dinámicamente
    if (!barra) {
        barra = document.createElement("div");
        barra.id = "notificacion-flotante";
        barra.className = "notificacion-bar";
        document.body.appendChild(barra);
    }

    // Configura color de fondo según el tipo
    if (tipo === "exito") {
        barra.style.backgroundColor = "#2bc48a"; // Verde
    } else {
        barra.style.backgroundColor = "#e63946"; // Rojo Foodie
    }

    barra.textContent = mensaje;
    barra.classList.add("activa");

    // Se oculta automáticamente después de 3.5 segundos
    setTimeout(() => {
        barra.classList.remove("activa");
    }, 3500);
}

// ==========================================
// 2. GESTIÓN DEL CARRITO (LOCALSTORAGE)
// ==========================================
function obtenerCarrito() {
    const datos = localStorage.getItem(CARRITO_KEY);
    return datos ? JSON.parse(datos) : [];
}

function guardarCarrito(carrito) {
    localStorage.setItem(CARRITO_KEY, JSON.stringify(carrito)); 
}

function actualizarContador() {
    const carrito = obtenerCarrito();
    const totalUnidades = carrito.reduce((suma, item) => suma + item.cantidad, 0);

    document.querySelectorAll("#contador-carrito").forEach(el => {
        el.textContent = totalUnidades;
    });
}

function agregarProducto(nombre, precio, imagen) {
    const carrito = obtenerCarrito();
    const existente = carrito.find(item => item.producto === nombre);

    if (existente) {
        existente.cantidad += 1;
    } else {
        carrito.push({ producto: nombre, precio: precio, cantidad: 1, imagen: imagen });
    }

    guardarCarrito(carrito);
    actualizarContador();
    mostrarNotificacion(`¡${nombre} agregado al carrito! 🛒`, "exito");
}

function renderizarCarrito() {
    const contenedor = document.getElementById("lista-carrito");
    if (!contenedor) return;

    const carrito = obtenerCarrito();
    contenedor.innerHTML = "";

    let totalProductos = 0;
    let subtotal = 0;

    carrito.forEach(item => {
        totalProductos += item.cantidad;
        subtotal += item.precio * item.cantidad;

        const div = document.createElement("div");
        div.className = "item-carrito";
        div.innerHTML = `
            <img src="${item.imagen}" alt="${item.producto}">
            <div class="item-info">
                <p class="item-nombre">${item.producto}</p>
                <div class="cantidad-control">
                    <button class="btn-restar">-</button>
                    <span class="cantidad">${item.cantidad}</span>
                    <button class="btn-sumar">+</button>
                </div>
            </div>
            <span class="item-subtotal">$${(item.precio * item.cantidad).toFixed(2)}</span>
        `;
        contenedor.appendChild(div);
    });
    
    if (document.getElementById("total-productos")) document.getElementById("total-productos").textContent = totalProductos;
    if (document.getElementById("subtotal")) document.getElementById("subtotal").textContent = "$" + subtotal.toFixed(2);
    if (document.getElementById("monto-total")) document.getElementById("monto-total").textContent = "$" + subtotal.toFixed(2);
}

function cambiarCantidad(nombre, delta) {
    const carrito = obtenerCarrito();
    const item = carrito.find(p => p.producto === nombre);
    if (!item) return;

    item.cantidad += delta;

    if (item.cantidad <= 0) {
        const nuevoCarrito = carrito.filter(p => p.producto !== nombre);
        guardarCarrito(nuevoCarrito);
    } else {
        guardarCarrito(carrito);
    }

    actualizarContador();
    renderizarCarrito();
}

function vaciarCarrito() {
    guardarCarrito([]);
    actualizarContador();
    renderizarCarrito();
}

// ==========================================
// 3. MAPA INTERACTIVO Y BÚSQUEDA
// ==========================================
let mapaLeaflet = null;
let marcadorLeaflet = null;

function inicializarMapa() {
    const contenedorMapa = document.getElementById("mapa");
    if (!contenedorMapa) return;

    // Coordenadas de Metrocentro, San Salvador
    const latInicial = 13.6989;
    const lngInicial = -89.2182;

    const limitesElSalvador = [
        [12.9, -90.15],
        [14.5, -87.65]
    ];

    mapaLeaflet = L.map("mapa", {
        maxBounds: limitesElSalvador,
        maxBoundsViscosity: 1.0,
        minZoom: 8
    }).setView([latInicial, lngInicial], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap"
    }).addTo(mapaLeaflet);

    marcadorLeaflet = L.marker([latInicial, lngInicial]).addTo(mapaLeaflet);

    mapaLeaflet.on("click", (evento) => {
        const nuevaLat = evento.latlng.lat;
        const nuevaLng = evento.latlng.lng;
        marcadorLeaflet.setLatLng([nuevaLat, nuevaLng]);
    });
}

async function buscarDireccion(texto) {
    if (!texto.trim()) return;

    const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=sv&q=${encodeURIComponent(texto)}`;

    try {
        const respuesta = await fetch(url);
        const resultados = await respuesta.json();

        if (resultados.length === 0) {
            mostrarNotificacion("No se encontró esa dirección en El Salvador. Intenta ser más específico.");
            return;
        }

        const lugar = resultados[0];
        const lat = parseFloat(lugar.lat);
        const lng = parseFloat(lugar.lon);

        mapaLeaflet.setView([lat, lng], 16);
        marcadorLeaflet.setLatLng([lat, lng]);
    } catch (e) {
        mostrarNotificacion("Error al conectar con el servicio de mapas.");
    }
}

// ==========================================
// 4. CARRUSEL INFINITO
// ==========================================
function inicializarCarrusel() {
    const pista = document.getElementById("carrusel");
    if (!pista) return;

    function arrancar() {
        const totalOriginal = pista.children.length;
        pista.innerHTML += pista.innerHTML;

        const primeraTarjeta = pista.children[0];
        const primeraCopia = pista.children[totalOriginal];
        const distancia = primeraCopia.offsetLeft - primeraTarjeta.offsetLeft;

        pista.style.setProperty("--ancho-carrusel", distancia + "px");
        pista.classList.add("listo");
    }

    const imagenes = pista.querySelectorAll("img");
    let cargadas = 0;

    if (imagenes.length === 0) {
        arrancar();
    } else {
        imagenes.forEach(img => {
            if (img.complete) {
                cargadas++;
                if (cargadas === imagenes.length) arrancar();
            } else {
                img.addEventListener("load", () => {
                    cargadas++;
                    if (cargadas === imagenes.length) arrancar();
                });
            }
        });
    }

    pista.addEventListener("mouseenter", () => pista.classList.add("pausado"));
    pista.addEventListener("mouseleave", () => pista.classList.remove("pausado"));
    pista.addEventListener("touchstart", () => pista.classList.add("pausado"));
    pista.addEventListener("touchend", () => pista.classList.remove("pausado"));
}

// ==========================================
// 5. PROCESO DE FINALIZACIÓN Y MODAL DE PAGO
// ==========================================
function finalizarPedido() {
    const carrito = obtenerCarrito();

    if (carrito.length === 0) {
        mostrarNotificacion("Tu Carrito está vacío. Agrega productos antes de finalizar el pedido.");
        return;
    } 

    const inputDireccion = document.querySelector(".direccion-entrega input[type='text']");
    const direccion = inputDireccion ? inputDireccion.value.trim() : "";

    if (direccion === "") {
        mostrarNotificacion("Por favor ingresa tu dirección de entrega antes de finalizar.");
        return;
    }

    // Copia la dirección escrita a la tarjeta modal
    const inputModalDireccion = document.getElementById("direccion");
    if (inputModalDireccion) inputModalDireccion.value = direccion;

    const modalPago = document.getElementById("modal-pago");
    if (modalPago) modalPago.style.display = "flex";
}

// ==========================================
// 6. INICIALIZACIÓN PRINCIPAL (DOM READY)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    actualizarContador();
    renderizarCarrito();
    inicializarMapa();
    inicializarCarrusel();

    // Evento para botones "Agregar"
    document.body.addEventListener("click", (evento) => {
        const boton = evento.target.closest(".btn-agregar");
        if (!boton) return;

        const nombre = boton.dataset.producto;
        const precio = parseFloat(boton.dataset.precio);
        const imagen = boton.dataset.imagen;
        agregarProducto(nombre, precio, imagen);
    });

    // Eventos +/- en la vista del carrito
    const contenedorCarrito = document.getElementById("lista-carrito");
    if (contenedorCarrito) {
        contenedorCarrito.addEventListener("click", (evento) => {
            const boton = evento.target;
            const fila = boton.closest(".item-carrito");
            if (!fila) return;

            const nombre = fila.querySelector(".item-nombre").textContent;
            if (boton.classList.contains("btn-sumar")) cambiarCantidad(nombre, 1);
            if (boton.classList.contains("btn-restar")) cambiarCantidad(nombre, -1);
        });
    }

    // Buscar dirección al presionar Enter en el input
    const inputDireccion = document.querySelector(".direccion-entrega input[type='text']");
    if (inputDireccion) {
        inputDireccion.addEventListener("keydown", (evento) => {
            if (evento.key === "Enter") {
                evento.preventDefault();
                buscarDireccion(inputDireccion.value);
            }
        });
    }

    // Botón de finalizar pedido
    const botonFinalizar = document.querySelector(".btn-finalizar");
    if (botonFinalizar) {
        botonFinalizar.addEventListener("click", finalizarPedido);
    }

    // --------------------------------------------------
    // AUTO-FORMATO Y VALIDACIONES ESTRICTAS DE TARJETA
    // --------------------------------------------------
    const modalPago = document.getElementById("modal-pago");
    const formPago = document.getElementById("form-pago");

    if (formPago) {
        const inputs = formPago.querySelectorAll("input");
        const inputExpiracion = inputs[2]; // Tercer input es Expiración (MM/AA)

        // Formato automático MM/AA en tiempo real
        if (inputExpiracion) {
            inputExpiracion.addEventListener("input", (e) => {
                let valor = e.target.value.replace(/\D/g, ""); // Mantiene solo dígitos
                if (valor.length >= 2) {
                    valor = valor.substring(0, 2) + "/" + valor.substring(2, 4);
                }
                e.target.value = valor.substring(0, 5); // Máximo 5 caracteres (MM/AA)
            });
        }

        // Procesar formulario al dar clic en Confirmar Pedido
        formPago.addEventListener("submit", (e) => {
            e.preventDefault();

            const inputsForm = formPago.querySelectorAll("input");
            const nombre = inputsForm[0] ? inputsForm[0].value.trim() : "";
            const numTarjeta = inputsForm[1] ? inputsForm[1].value.replace(/\s+/g, '') : ""; // Quita espacios
            const expiracion = inputsForm[2] ? inputsForm[2].value.trim() : "";
            const cvv = inputsForm[3] ? inputsForm[3].value.trim() : "";

            // 1. Validar Nombre Completo
            if (nombre.length < 3) {
                mostrarNotificacion("Por favor ingresa un nombre completo válido.");
                return;
            }

            // 2. Validar Número de Tarjeta (16 dígitos numéricos)
            if (!/^\d{16}$/.test(numTarjeta)) {
                mostrarNotificacion("El número de tarjeta debe contener exactamente 16 dígitos.");
                return;
            }

            // 3. Validar Formato de Expiración (MM/AA)
            const expRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
            if (!expRegex.test(expiracion)) {
                mostrarNotificacion("Formato de fecha inválido. Usa el formato MM/AA (ej: 08/28).");
                return;
            }

            // 4. Validar que la tarjeta no esté vencida
            const partes = expiracion.split("/");
            const mes = parseInt(partes[0], 10);
            const anio = parseInt("20" + partes[1], 10);
            
            const hoy = new Date();
            const anioActual = hoy.getFullYear();
            const mesActual = hoy.getMonth() + 1;

            if (anio < anioActual || (anio === anioActual && mes < mesActual)) {
                mostrarNotificacion("La tarjeta ingresada se encuentra vencida.");
                return;
            }

            // 5. Validar CVV (3 o 4 dígitos)
            if (!/^\d{3,4}$/.test(cvv)) {
                mostrarNotificacion("El CVV debe contener 3 o 4 dígitos numéricos.");
                return;
            }

            // --- SI PASA TODAS LAS VALIDACIONES ---
            mostrarNotificacion("¡Pago realizado con éxito! 🎉 Tu pedido va en camino 🍕🛵", "exito");
            
            vaciarCarrito();
            if (inputDireccion) inputDireccion.value = "";
            const textareaNotas = document.querySelector(".direccion-entrega textarea");
            if (textareaNotas) textareaNotas.value = "";

            if (modalPago) modalPago.style.display = "none";
            formPago.reset();
        });
    }

    // Cerrar modal al hacer clic en el fondo oscuro
    if (modalPago) {
        window.addEventListener("click", (e) => {
            if (e.target === modalPago) {
                modalPago.style.display = "none";
            }
        });
    }
});