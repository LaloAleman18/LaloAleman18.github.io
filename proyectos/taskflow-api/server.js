'use strict';

/* server.js — API REST de TaskFlow.
   Traduce las peticiones HTTP a operaciones del almacén y devuelve el código
   de estado correcto. No guarda datos en memoria: todo vive en tareas.json. */

const path = require('path');
const express = require('express');
const { crearAlmacen, RUTA_POR_DEFECTO } = require('./store');

const PRIORIDADES = ['baja', 'media', 'alta'];
const CAMPOS_PERMITIDOS = ['titulo', 'prioridad', 'completada'];

/* Valida los datos y devuelve una lista de errores.
   Con `parcial: true` solo revisa los campos enviados (para PUT). */
function validarDatos(datos, { parcial = false } = {}) {
  const errores = [];

  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
    return ['El cuerpo debe ser un objeto JSON.'];
  }

  const tiene = (campo) => Object.prototype.hasOwnProperty.call(datos, campo);

  if (!parcial || tiene('titulo')) {
    if (!parcial && !tiene('titulo')) {
      errores.push('El campo "titulo" es obligatorio.');
    } else if (typeof datos.titulo !== 'string' || datos.titulo.trim() === '') {
      errores.push('El campo "titulo" es obligatorio y no puede estar vacío.');
    } else if (datos.titulo.trim().length > 120) {
      errores.push('El campo "titulo" no puede superar los 120 caracteres.');
    }
  }

  if (tiene('prioridad') && !PRIORIDADES.includes(datos.prioridad)) {
    errores.push('El campo "prioridad" debe ser "baja", "media" o "alta".');
  }

  if (tiene('completada') && typeof datos.completada !== 'boolean') {
    errores.push('El campo "completada" debe ser booleano (true o false).');
  }

  return errores;
}

/* Envuelve rutas asíncronas para que un error inesperado llegue al manejador
   central en lugar de quedar como promesa rechazada. */
function conManejador(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

function crearApp({ rutaDatos = process.env.TAREAS_FILE || RUTA_POR_DEFECTO } = {}) {
  const app = express();
  const almacen = crearAlmacen(rutaDatos);

  app.use(express.json());

  app.get('/salud', (req, res) => {
    res.json({ ok: true, servicio: 'taskflow-api' });
  });

  app.get('/api/tareas', conManejador(async (req, res) => {
    const errores = [];
    let filtroCompletada;

    if (req.query.completada !== undefined) {
      if (req.query.completada === 'true') filtroCompletada = true;
      else if (req.query.completada === 'false') filtroCompletada = false;
      else errores.push('El filtro "completada" debe ser "true" o "false".');
    }

    if (req.query.prioridad !== undefined && !PRIORIDADES.includes(req.query.prioridad)) {
      errores.push('El filtro "prioridad" debe ser "baja", "media" o "alta".');
    }

    if (errores.length) return res.status(400).json({ errores });

    let tareas = await almacen.listar();
    if (filtroCompletada !== undefined) tareas = tareas.filter((t) => t.completada === filtroCompletada);
    if (req.query.prioridad !== undefined) tareas = tareas.filter((t) => t.prioridad === req.query.prioridad);

    return res.json(tareas);
  }));

  app.get('/api/tareas/:id', conManejador(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ errores: ['El id debe ser un número entero.'] });

    const tarea = await almacen.obtener(id);
    if (!tarea) return res.status(404).json({ error: 'Tarea no encontrada' });
    return res.json(tarea);
  }));

  app.post('/api/tareas', conManejador(async (req, res) => {
    const errores = validarDatos(req.body);
    if (errores.length) return res.status(400).json({ errores });

    const tarea = await almacen.crear({
      titulo: req.body.titulo.trim(),
      prioridad: req.body.prioridad === undefined ? 'media' : req.body.prioridad,
      completada: req.body.completada === undefined ? false : req.body.completada
    });

    return res.status(201).json(tarea);
  }));

  app.put('/api/tareas/:id', conManejador(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ errores: ['El id debe ser un número entero.'] });

    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ errores: ['El cuerpo debe ser un objeto JSON.'] });
    }

    const cambios = {};
    for (const campo of CAMPOS_PERMITIDOS) {
      if (Object.prototype.hasOwnProperty.call(req.body, campo)) cambios[campo] = req.body[campo];
    }

    if (Object.keys(cambios).length === 0) {
      return res.status(400).json({ errores: ['No se enviaron campos para actualizar.'] });
    }

    const errores = validarDatos(cambios, { parcial: true });
    if (errores.length) return res.status(400).json({ errores });

    if (cambios.titulo !== undefined) cambios.titulo = cambios.titulo.trim();

    const actualizada = await almacen.actualizar(id, cambios);
    if (!actualizada) return res.status(404).json({ error: 'Tarea no encontrada' });
    return res.json(actualizada);
  }));

  app.delete('/api/tareas/:id', conManejador(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ errores: ['El id debe ser un número entero.'] });

    const eliminada = await almacen.eliminar(id);
    if (!eliminada) return res.status(404).json({ error: 'Tarea no encontrada' });
    return res.status(204).end();
  }));

  /* Rutas desconocidas. */
  app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
  });

  /* Manejador de errores: JSON mal formado, errores de ruta o fallos del almacén. */
  // eslint-disable-next-line no-unused-vars
  app.use((error, req, res, next) => {
    if (error.type === 'entity.parse.failed' || error instanceof SyntaxError) {
      return res.status(400).json({ error: 'JSON mal formado' });
    }
    if (error.type === 'entity.too.large') {
      return res.status(413).json({ error: 'El cuerpo es demasiado grande' });
    }
    console.error(error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  });

  return app;
}

/* Solo escucha si el archivo se ejecuta directamente.
   Así las pruebas pueden importar la app sin abrir otro puerto. */
if (require.main === module) {
  const puerto = Number(process.env.PORT) || 3000;
  crearApp().listen(puerto, () => {
    console.log(`TaskFlow API escuchando en http://localhost:${puerto}`);
  });
}

module.exports = { crearApp, validarDatos };
