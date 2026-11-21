/* Tiendita MX — catálogo y carrito en JavaScript vanilla.
   El carrito es un objeto { idProducto: cantidad } guardado en localStorage.
   No hay backend: la compra es una simulación. */

(function () {
  'use strict';

  var CLAVE_CARRITO = 'tiendita-mx-carrito';

  var PRODUCTOS = [
    { id: 1, nombre: 'Playera básica negra', precio: 199, icono: 'i-playera' },
    { id: 2, nombre: 'Taza de cerámica', precio: 149, icono: 'i-taza' },
    { id: 3, nombre: 'Mochila urbana', precio: 549, icono: 'i-mochila' },
    { id: 4, nombre: 'Audífonos alámbricos', precio: 299, icono: 'i-audifonos' },
    { id: 5, nombre: 'Libreta cosida A5', precio: 89, icono: 'i-libreta' },
    { id: 6, nombre: 'Termo de acero 750 ml', precio: 349, icono: 'i-termo' },
    { id: 7, nombre: 'Teclado mecánico', precio: 899, icono: 'i-teclado' },
    { id: 8, nombre: 'Planta suculenta', precio: 120, icono: 'i-suculenta' }
  ];

  var catalogo = document.getElementById('catalogo');
  var items = document.getElementById('items');
  var carritoVacio = document.getElementById('carrito-vacio');
  var carritoSub = document.getElementById('carrito-sub');
  var badge = document.getElementById('badge-carrito');
  var subtotal = document.getElementById('subtotal');
  var total = document.getElementById('total');
  var comprar = document.getElementById('comprar');
  var vaciar = document.getElementById('vaciar');
  var modal = document.getElementById('modal');
  var modalTexto = document.getElementById('modal-texto');
  var modalFolio = document.getElementById('modal-folio');
  var modalCerrar = document.getElementById('modal-cerrar');

  var formatoMXN = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  });

  function dinero(valor) {
    return formatoMXN.format(valor);
  }

  function productoPorId(id) {
    return PRODUCTOS.find(function (producto) { return producto.id === id; });
  }

  /* Lee el carrito y descarta datos raros (ids desconocidos o cantidades malas). */
  function cargarCarrito() {
    var guardado;
    try {
      guardado = JSON.parse(localStorage.getItem(CLAVE_CARRITO) || '{}');
    } catch (error) {
      guardado = {};
    }

    var limpio = {};
    Object.keys(guardado).forEach(function (clave) {
      var id = Number(clave);
      var cantidad = Number(guardado[clave]);
      if (productoPorId(id) && Number.isInteger(cantidad) && cantidad > 0) {
        limpio[id] = cantidad;
      }
    });
    return limpio;
  }

  function guardarCarrito(carrito) {
    try {
      localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
    } catch (error) {
      console.error('No se pudo guardar el carrito:', error);
    }
  }

  function totales(carrito) {
    return Object.keys(carrito).reduce(function (acumulado, clave) {
      var producto = productoPorId(Number(clave));
      if (producto) acumulado += producto.precio * carrito[clave];
      return acumulado;
    }, 0);
  }

  function cantidadProductos(carrito) {
    return Object.keys(carrito).reduce(function (suma, clave) { return suma + carrito[clave]; }, 0);
  }

  function agregar(id) {
    var carrito = cargarCarrito();
    carrito[id] = (carrito[id] || 0) + 1;
    guardarCarrito(carrito);
    renderizarCarrito();
  }

  function cambiarCantidad(id, delta) {
    var carrito = cargarCarrito();
    var nueva = (carrito[id] || 0) + delta;
    if (nueva <= 0) delete carrito[id];
    else carrito[id] = nueva;
    guardarCarrito(carrito);
    renderizarCarrito();
  }

  function quitar(id) {
    var carrito = cargarCarrito();
    delete carrito[id];
    guardarCarrito(carrito);
    renderizarCarrito();
  }

  function renderizarCatalogo() {
    catalogo.textContent = '';

    PRODUCTOS.forEach(function (producto) {
      var tarjeta = document.createElement('article');
      tarjeta.className = 'producto';

      var arte = document.createElement('div');
      arte.className = 'producto__arte';
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 100 100');
      svg.setAttribute('aria-hidden', 'true');
      var uso = document.createElementNS('http://www.w3.org/2000/svg', 'use');
      uso.setAttribute('href', '#' + producto.icono);
      svg.appendChild(uso);
      arte.appendChild(svg);

      var nombre = document.createElement('h3');
      nombre.textContent = producto.nombre;

      var precio = document.createElement('p');
      precio.className = 'producto__precio';
      precio.textContent = dinero(producto.precio);

      var boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'producto__accion';
      boton.textContent = 'Agregar al carrito';
      boton.setAttribute('data-agregar', String(producto.id));

      tarjeta.appendChild(arte);
      tarjeta.appendChild(nombre);
      tarjeta.appendChild(precio);
      tarjeta.appendChild(boton);
      catalogo.appendChild(tarjeta);
    });
  }

  function renderizarCarrito() {
    var carrito = cargarCarrito();
    var claves = Object.keys(carrito).map(Number).sort(function (a, b) { return a - b; });
    var piezas = cantidadProductos(carrito);
    var monto = totales(carrito);

    items.textContent = '';
    carritoVacio.hidden = claves.length > 0;
    badge.textContent = String(piezas);
    carritoSub.textContent = piezas === 1 ? '1 producto' : piezas + ' productos';

    claves.forEach(function (id) {
      var producto = productoPorId(id);
      if (!producto) return;

      var item = document.createElement('li');
      item.className = 'item';

      var nombre = document.createElement('p');
      nombre.className = 'item__nombre';
      nombre.textContent = producto.nombre;

      var fila = document.createElement('div');
      fila.className = 'item__fila';

      var cantidad = document.createElement('div');
      cantidad.className = 'cantidad';

      var menos = document.createElement('button');
      menos.type = 'button';
      menos.textContent = '−';
      menos.setAttribute('aria-label', 'Quitar uno de ' + producto.nombre);
      menos.setAttribute('data-menos', String(id));

      var numero = document.createElement('span');
      numero.textContent = String(carrito[id]);

      var mas = document.createElement('button');
      mas.type = 'button';
      mas.textContent = '+';
      mas.setAttribute('aria-label', 'Agregar uno de ' + producto.nombre);
      mas.setAttribute('data-mas', String(id));

      cantidad.appendChild(menos);
      cantidad.appendChild(numero);
      cantidad.appendChild(mas);

      var subtotalItem = document.createElement('span');
      subtotalItem.className = 'item__total';
      subtotalItem.textContent = dinero(producto.precio * carrito[id]);

      fila.appendChild(cantidad);
      fila.appendChild(subtotalItem);

      var quitarBoton = document.createElement('button');
      quitarBoton.type = 'button';
      quitarBoton.className = 'item__quitar';
      quitarBoton.textContent = 'Quitar producto';
      quitarBoton.setAttribute('data-quitar', String(id));

      item.appendChild(nombre);
      item.appendChild(fila);
      item.appendChild(quitarBoton);
      items.appendChild(item);
    });

    subtotal.textContent = dinero(monto);
    total.textContent = dinero(monto);
  }

  function abrirModal(titulo, texto, folio) {
    document.getElementById('modal-title').textContent = titulo;
    modalTexto.textContent = texto;
    modalFolio.textContent = folio || '';
    modalFolio.hidden = !folio;
    modal.hidden = false;
    modalCerrar.focus();
  }

  function cerrarModal() {
    modal.hidden = true;
  }

  function generarFolio() {
    return 'TMX-' + Math.floor(100000 + Math.random() * 900000);
  }

  catalogo.addEventListener('click', function (evento) {
    var boton = evento.target.closest('[data-agregar]');
    if (boton) agregar(Number(boton.getAttribute('data-agregar')));
  });

  items.addEventListener('click', function (evento) {
    var menos = evento.target.closest('[data-menos]');
    var mas = evento.target.closest('[data-mas]');
    var quitarBoton = evento.target.closest('[data-quitar]');

    if (menos) cambiarCantidad(Number(menos.getAttribute('data-menos')), -1);
    else if (mas) cambiarCantidad(Number(mas.getAttribute('data-mas')), 1);
    else if (quitarBoton) quitar(Number(quitarBoton.getAttribute('data-quitar')));
  });

  vaciar.addEventListener('click', function () {
    var carrito = cargarCarrito();
    if (Object.keys(carrito).length === 0) {
      abrirModal('Carrito vacío', 'No hay productos que vaciar. Agrega algo primero.', '');
      return;
    }
    guardarCarrito({});
    renderizarCarrito();
    abrirModal('Carrito vaciado', 'Se quitaron todos los productos del carrito.', '');
  });

  comprar.addEventListener('click', function () {
    var carrito = cargarCarrito();
    if (Object.keys(carrito).length === 0) {
      abrirModal('No puedes comprar aún', 'Tu carrito está vacío. Agrega un producto antes de continuar.', '');
      return;
    }

    var monto = dinero(totales(carrito));
    var folio = generarFolio();
    guardarCarrito({});
    renderizarCarrito();
    abrirModal(
      '¡Compra simulada!',
      'Tu pedido de ' + monto + ' se registró con el folio:',
      folio
    );
  });

  modalCerrar.addEventListener('click', cerrarModal);
  modal.addEventListener('click', function (evento) {
    if (evento.target === modal) cerrarModal();
  });
  document.addEventListener('keydown', function (evento) {
    if (evento.key === 'Escape' && !modal.hidden) cerrarModal();
  });

  renderizarCatalogo();
  renderizarCarrito();
})();
