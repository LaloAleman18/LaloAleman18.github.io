# TaskFlow API

API REST de tareas hecha con **Node.js + Express**, con persistencia en un
archivo JSON. Sin base de datos externa y sin ORM: se usa el sistema de
archivos con escritura atómica.

> Proyecto personal de José Eduardo Casarrubias Aleman.

## Qué demuestra

- Una API REST completa: listar, filtrar, leer, crear, actualizar y eliminar.
- Validación de entrada con respuestas `400` y lista de errores clara.
- Persistencia real en disco (`tareas.json`), con `id` autoincremental y
  marcas de tiempo ISO.
- Separación de responsabilidades: `store.js` guarda datos y `server.js`
  habla HTTP.
- Pruebas automatizadas con el runner nativo de Node (`node:test`), sin
  librerías de test adicionales.

## Requisitos

- Node.js 18 o superior (probado con Node 24).
- `npm` (viene con Node).

## Cómo se corre

```bash
cd proyectos/taskflow-api
npm install
npm start
```

La API queda en `http://localhost:3000` (o en el puerto que indique la
variable `PORT`).

## Endpoints

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/salud` | Verifica que el servicio está vivo |
| GET | `/api/tareas` | Lista tareas; acepta `?completada=true\|false` y `?prioridad=baja\|media\|alta` |
| GET | `/api/tareas/:id` | Devuelve una tarea |
| POST | `/api/tareas` | Crea una tarea (201) |
| PUT | `/api/tareas/:id` | Actualiza una tarea |
| DELETE | `/api/tareas/:id` | Elimina una tarea (204) |

## Ejemplos con curl

```bash
# Salud
curl http://localhost:3000/salud

# Crear una tarea
curl -X POST http://localhost:3000/api/tareas \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Estudiar Node","prioridad":"alta"}'

# Listar todas
curl http://localhost:3000/api/tareas

# Filtrar por estado y prioridad
curl "http://localhost:3000/api/tareas?completada=false"
curl "http://localhost:3000/api/tareas?prioridad=alta"

# Leer una tarea
curl http://localhost:3000/api/tareas/1

# Actualizar una tarea
curl -X PUT http://localhost:3000/api/tareas/1 \
  -H "Content-Type: application/json" \
  -d '{"completada":true}'

# Eliminar una tarea (respuesta 204, sin cuerpo)
curl -i -X DELETE http://localhost:3000/api/tareas/1
```

## Errores

- `400` con `{ "errores": [...] }` cuando la validación falla.
- `400` con `{ "error": "JSON mal formado" }` cuando el cuerpo no es JSON válido.
- `404` con `{ "error": "Tarea no encontrada" }` o
  `{ "error": "Ruta no encontrada" }`.
- `204` sin cuerpo al eliminar.

Reglas de validación:

- `titulo`: obligatorio, texto no vacío, máximo 120 caracteres.
- `prioridad`: `baja`, `media` o `alta` (por defecto `media`).
- `completada`: booleano (por defecto `false`).

## Pruebas

```bash
cd proyectos/taskflow-api
npm test
```

Las pruebas usan un archivo temporal y un puerto libre, así que no tocan
`tareas.json`.

## Estructura

```text
proyectos/taskflow-api/
├── package.json
├── server.js          API: validación y rutas HTTP
├── store.js           Persistencia en tareas.json
├── tareas.test.js     Pruebas con node:test
└── README.md
```

## Despliegue

GitHub Pages solo publica archivos estáticos, por lo que esta API **no se
ejecuta** en `laloaleman18.github.io`. Para probarla en internet hace falta un
servicio que ejecute Node (por ejemplo Render, Railway o Fly.io) o correrla en
local. El código y este README sí están en el repositorio.
