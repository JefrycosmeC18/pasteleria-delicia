// Importar CSS y JavaScript de Bootstrap desde node_modules
import 'bootstrap/dist/css/bootstrap.min.css';
import * as bootstrap from 'bootstrap';
import './style.css';

const $ = (s) => document.querySelector(s);

function avisar(mensaje) {
  $("#avisoTexto").textContent = mensaje;
  bootstrap.Toast.getOrCreateInstance($("#aviso")).show();
}

$("#formPedido").addEventListener("submit", (e) => {
  e.preventDefault();
  $("#alertaPedido").hidden = false;
  e.target.reset();
});

// ---------- Funciones auxiliares ----------
const soles = (monto) => `S/ ${monto.toFixed(2)}`;
const sumar = (...numeros) => numeros.reduce((a, n) => a + n, 0);
const aplicarDescuento = (total, porcentaje = 10) => total * (1 - porcentaje / 100);

function contarUnidades(lista) {
  if (lista.length === 0) return 0;
  const [primero, ...resto] = lista;
  return primero.cantidad + contarUnidades(resto);
}

function crearCarrito(itemsIniciales = []) {
  let items = itemsIniciales;
  return {
    agregar(producto, cantidad = 1) {
      const existe = items.find((it) => it.id === producto.id);
      if (existe) existe.cantidad += cantidad;
      else items.push({ ...producto, cantidad });
    },
    quitar(id) { items = items.filter((it) => it.id !== id); },
    vaciar() { items = []; },
    lista: () => items,
    subtotal: () => sumar(...items.map((it) => it.precio * it.cantidad)),
    unidades: () => contarUnidades(items),
  };
}

// ---------- Estado del Carrito ----------
const carrito = crearCarrito(JSON.parse(localStorage.getItem("carrito-delicia") || "[]"));

function pintarCarrito() {
  const sub = carrito.subtotal();
  const conDescuento = sub > 100;
  const total = conDescuento ? aplicarDescuento(sub) : sub;

  $("#listaCarrito").innerHTML = carrito.lista().map((it) => `
    <li class="list-group-item d-flex justify-content-between align-items-center px-0">
      <div>
        <strong class="d-block">${it.nombre}</strong>
        <small class="text-muted">x${it.cantidad}</small>
      </div>
      <div>
        <span class="fw-bold me-2">${soles(it.precio * it.cantidad)}</span>
        <button class="btn btn-sm btn-outline-danger" data-quitar="${it.id}">✕</button>
      </div>
    </li>`).join("") || `<li class="list-group-item border-0 text-muted px-0">Aún no agregas productos.</li>`;

  $("#subtotal").textContent = soles(sub);
  $("#descuento").textContent = conDescuento ? "Descuento del 10% aplicado" : "";
  $("#total").textContent = soles(total);
  $("#contador").textContent = carrito.unidades();
  localStorage.setItem("carrito-delicia", JSON.stringify(carrito.lista()));
}

$("#listaCarrito").addEventListener("click", (e) => {
  const boton = e.target.closest("[data-quitar]");
  if (!boton) return;
  carrito.quitar(Number(boton.dataset.quitar));
  pintarCarrito();
});

$("#vaciar").addEventListener("click", () => {
  carrito.vaciar();
  pintarCarrito();
});

// ---------- Catálogo de productos ----------
const productos = [
  { id: 1, nombre: "Torta de chocolate", precio: 55, categoria: "Tortas" },
  { id: 2, nombre: "Torta tres leches", precio: 48, categoria: "Tortas" },
  { id: 3, nombre: "Pan de yema", precio: 1.5, categoria: "Panes" },
  { id: 4, nombre: "Pan integral", precio: 1, categoria: "Panes" },
  { id: 5, nombre: "Alfajores (docena)", precio: 18, categoria: "Dulces" },
  { id: 6, nombre: "Cheesecake de fresa", precio: 40, categoria: "Dulces" },
  { id: 7, nombre: "Empanada de carne", precio: 4.5, categoria: "Salados" },
  { id: 8, nombre: "Pan con chicharrón", precio: 8, categoria: "Salados" },
  { id: 9, nombre: "Empanada de queso", precio: 4, categoria: "Salados" },
  { id: 10, nombre: "Tamal pequeño", precio: 6, categoria: "Salados" },
];

let categoria = "Todos";
let texto = "";

const tarjetaProducto = (p) => `
  <div class="col">
    <article class="card h-100 border-0 shadow-sm">
      <div class="card-body d-flex flex-column">
        <span class="badge text-bg-primary align-self-start mb-2">${p.categoria}</span>
        <h3 class="h5 card-title fw-bold">${p.nombre}</h3>
        <p class="precio mt-auto mb-3">${soles(p.precio)}</p>
        <button class="btn btn-outline-primary w-100" data-id="${p.id}">Agregar al carrito</button>
      </div>
    </article>
  </div>`;

function pintarFiltros() {
  const cats = ["Todos", ...new Set(productos.map((p) => p.categoria))];
  $("#filtros").innerHTML = cats.map((c) => `
    <li class="nav-item">
      <button class="nav-link ${c === categoria ? "active" : ""}" data-cat="${c}">${c}</button>
    </li>`).join("");
}

function pintarProductos() {
  const visibles = productos.filter((p) =>
    (categoria === "Todos" || p.categoria === categoria) &&
    p.nombre.toLowerCase().includes(texto.toLowerCase()));
  $("#productos").innerHTML = visibles.length
    ? visibles.map(tarjetaProducto).join("")
    : `<p class="text-muted">No hay productos con ese filtro.</p>`;
}

$("#productos").addEventListener("click", (e) => {
  const boton = e.target.closest("[data-id]");
  if (!boton) return;
  const p = productos.find((x) => x.id === Number(boton.dataset.id));
  carrito.agregar(p);
  pintarCarrito();
  avisar(`¡${p.nombre} agregado al carrito!`);
});

$("#filtros").addEventListener("click", (e) => {
  const boton = e.target.closest("[data-cat]");
  if (!boton) return;
  categoria = boton.dataset.cat;
  pintarFiltros();
  pintarProductos();
});

$("#buscar").addEventListener("input", (e) => {
  texto = e.target.value;
  pintarProductos();
});

pintarFiltros();
pintarProductos();
pintarCarrito();