# Tiendita MX

Tienda en línea de demostración hecha con **JavaScript vanilla**, sin
librerías ni frameworks.

> Proyecto personal de José Eduardo Casarrubias Aleman.

## Qué demuestra

- Un catálogo de 8 productos con precios en MXN.
- Carrito con cantidades: agregar, sumar, quitar de uno en uno, ver subtotal
  por producto y total general, quitar producto y vaciar carrito.
- Persistencia del carrito con `localStorage` (clave `tiendita-mx-carrito`).
- Compra simulada con folio `TMX-######` y total. Nunca hace un cargo real.
- Diseño adaptable a celular y computadora, con ilustraciones SVG propias.

## Cómo se corre

```bash
cd proyectos/tiendita
python -m http.server 8080
```

Abre <http://127.0.0.1:8080/>.

También está publicado en
<https://laloaleman18.github.io/proyectos/tiendita/>.

## Cómo probarla

1. Agrega dos productos distintos. El contador del carrito debe subir y
   aparecer el subtotal de cada uno.
2. Pulsa `+` y `−` en un producto. Al llegar a 0, el producto desaparece del
   carrito.
3. Recarga la página: el carrito sigue ahí porque está en `localStorage`.
4. Pulsa **Vaciar carrito** para limpiarlo.
5. Con el carrito vacío, pulsa **Comprar ahora**: debe decir que está vacío.
6. Agrega productos y pulsa **Comprar ahora**: debe mostrar un folio y el
   total, y el carrito debe quedar vacío.

## ¿Qué es localStorage?

Es un pequeño espacio de almacenamiento que el navegador reserva para cada
sitio. Guarda texto con una clave y un valor. Aquí guardo el carrito como JSON:

```json
{ "1": 2, "5": 1 }
```

Eso significa dos playeras y una libreta. Como se guarda en el navegador, el
carrito sobrevive al cierre de la pestaña. No es una base de datos: otro
dispositivo no ve ese carrito y se puede borrar desde los datos del sitio.

## Archivos

```text
proyectos/tiendita/
├── index.html    Catálogo, carrito, estilos e ilustraciones SVG
├── app.js        Productos, carrito, localStorage y compra simulada
└── README.md
```

## Nota honesta

No hay backend, pasarela de pago ni inventario real. Los precios y productos
son de demostración y la compra solo muestra un folio en pantalla.
