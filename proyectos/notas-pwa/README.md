# Notas PWA

Aplicación de notas que **funciona sin internet**, escrita en JavaScript
vanilla, sin librerías.

> Proyecto personal de José Eduardo Casarrubias Aleman.

## Qué demuestra

- Persistencia local con **IndexedDB**: las notas sobreviven al cierre del
  navegador.
- **Patrón outbox**: cada nota nace como “Pendiente de sincronizar” y queda en
  una cola local antes de intentar enviarse.
- **Service Worker** con caché de la interfaz: la app abre aunque no haya red.
- **Background Sync**: el navegador despierta al Service Worker cuando recupera
  conexión y vacía la cola. Si el navegador no soporta Background Sync, el
  evento `online` de la página es el respaldo.
- Interfaz con estado por nota, botón “Sincronizar ahora” y diseño adaptable a
  celular y computadora.

## Cómo se corre

El Service Worker **no funciona con `file://`**. Necesitas un servidor local:

```bash
cd proyectos/notas-pwa
python -m http.server 8080
```

Abre <http://127.0.0.1:8080/>.

En GitHub Pages también funciona, porque es HTTPS:
<https://laloaleman18.github.io/proyectos/notas-pwa/>

## Cómo probarla

1. Abre la app y escribe una nota. Aparece con la etiqueta
   **“Pendiente de sincronizar”**.
2. En DevTools → **Network**, activa **Offline**.
3. Recarga la página: las notas siguen ahí (vienen de la caché y de IndexedDB)
   y la que acabas de crear sigue pendiente.
4. Desactiva **Offline**. Pulsa **“Sincronizar ahora”**.
5. La nota cambia a **“Sincronizada”** y desaparece de la cola de salida.

Para ver la cola por dentro: DevTools → **Application** → **IndexedDB** →
`notas-pwa-db` → `outbox`.

## Conceptos en lenguaje sencillo

### IndexedDB

Es una base de datos dentro del navegador. A diferencia de `localStorage`, es
asíncrona, transaccional y puede guardar objetos. Aquí se crean dos almacenes:

- `notas`: la nota que ve el usuario (`texto`, `creadaEn`, `estado`).
- `outbox`: la cola de salida (`notaId`, `texto`, `creadaEn`).

### Patrón outbox

En lugar de hacer `fetch` directo al guardar, la app escribe primero en la base
local y deja un registro en la cola. Si no hay red, el registro se queda ahí;
cuando hay red, se envía y se marca la nota como sincronizada. Así una nota no
se pierde por un fallo de red.

### Service Worker y Background Sync

El Service Worker es un script que corre aparte de la página. Aquí hace dos
cosas: guarda la interfaz en caché y escucha el evento `sync`. Cuando el
navegador recupera conexión, dispara el tag `sincronizar-notas`; el worker
vacía la cola y avisa a la página con `postMessage`. En navegadores sin
`SyncManager`, el evento `online` de la página cumple la misma función.

## Archivos

```text
proyectos/notas-pwa/
├── index.html    Interfaz y estilos (sin CSS externo)
├── app.js        IndexedDB, interfaz y sincronización desde la página
├── sw.js         Caché offline + Background Sync
└── README.md
```

## Notas honestas

- Los envíos van a `jsonplaceholder.typicode.com`, una API pública de prueba.
  No se guarda ningún dato real y no hay backend propio.
- Si la API falla o no hay internet, las notas **no se borran**: permanecen en
  la cola con su estado pendiente.
- Background Sync depende del navegador. Si no está disponible, el respaldo es
  el evento `online` o el botón “Sincronizar ahora”.
