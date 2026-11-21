'use strict';

/* tareas.test.js — Pruebas de la API con el runner nativo de Node.
   Usa una ruta temporal para no tocar las tareas reales del usuario. */

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { crearApp } = require('./server');

let servidor;
let base;
let carpetaTemporal;
let rutaDatos;

before(async () => {
  carpetaTemporal = fs.mkdtempSync(path.join(os.tmpdir(), 'taskflow-'));
  rutaDatos = path.join(carpetaTemporal, 'tareas.json');
  servidor = crearApp({ rutaDatos }).listen(0);
  await new Promise((resolver) => servidor.once('listening', resolver));
  base = `http://127.0.0.1:${servidor.address().port}`;
});

after(async () => {
  await new Promise((resolver) => servidor.close(resolver));
  fs.rmSync(carpetaTemporal, { recursive: true, force: true });
});

async function peticion(metodo, ruta, cuerpo) {
  const opciones = { method: metodo, headers: {} };
  if (cuerpo !== undefined) {
    opciones.headers['Content-Type'] = 'application/json';
    opciones.body = JSON.stringify(cuerpo);
  }
  const respuesta = await fetch(base + ruta, opciones);
  let datos = null;
  const texto = await respuesta.text();
  if (texto) datos = JSON.parse(texto);
  return { estado: respuesta.status, datos };
}

test('GET /salud responde ok', async () => {
  const { estado, datos } = await peticion('GET', '/salud');
  assert.equal(estado, 200);
  assert.deepEqual(datos, { ok: true, servicio: 'taskflow-api' });
});

test('CRUD completo: crear, listar, leer, editar, borrar y 404', async () => {
  const creada = await peticion('POST', '/api/tareas', {
    titulo: 'Aprender Express',
    prioridad: 'alta'
  });
  assert.equal(creada.estado, 201);
  assert.equal(creada.datos.id, 1);
  assert.equal(creada.datos.titulo, 'Aprender Express');
  assert.equal(creada.datos.prioridad, 'alta');
  assert.equal(creada.datos.completada, false);
  assert.ok(creada.datos.creadaEn);

  const lista = await peticion('GET', '/api/tareas');
  assert.equal(lista.estado, 200);
  assert.equal(lista.datos.length, 1);

  const una = await peticion('GET', '/api/tareas/1');
  assert.equal(una.estado, 200);
  assert.equal(una.datos.titulo, 'Aprender Express');

  const editada = await peticion('PUT', '/api/tareas/1', {
    titulo: 'Aprender Express y probarlo',
    completada: true
  });
  assert.equal(editada.estado, 200);
  assert.equal(editada.datos.titulo, 'Aprender Express y probarlo');
  assert.equal(editada.datos.completada, true);
  assert.equal(editada.datos.creadaEn, creada.datos.creadaEn);

  const borrada = await peticion('DELETE', '/api/tareas/1');
  assert.equal(borrada.estado, 204);

  const ausente = await peticion('GET', '/api/tareas/1');
  assert.equal(ausente.estado, 404);
  assert.equal(ausente.datos.error, 'Tarea no encontrada');
});

test('Validación: título obligatorio, longitud, prioridad y booleano', async () => {
  const sinTitulo = await peticion('POST', '/api/tareas', { prioridad: 'media' });
  assert.equal(sinTitulo.estado, 400);
  assert.ok(Array.isArray(sinTitulo.datos.errores));
  assert.ok(sinTitulo.datos.errores.length > 0);

  const tituloLargo = await peticion('POST', '/api/tareas', { titulo: 'x'.repeat(121) });
  assert.equal(tituloLargo.estado, 400);

  const prioridadMala = await peticion('POST', '/api/tareas', { titulo: 'Revisar', prioridad: 'urgente' });
  assert.equal(prioridadMala.estado, 400);

  const completadaMala = await peticion('POST', '/api/tareas', { titulo: 'Revisar', completada: 'sí' });
  assert.equal(completadaMala.estado, 400);
});

test('Filtros por estado y prioridad, y ruta desconocida', async () => {
  await peticion('POST', '/api/tareas', { titulo: 'Comprar café', prioridad: 'baja' });
  await peticion('POST', '/api/tareas', { titulo: 'Enviar tarea', prioridad: 'alta', completada: true });

  const pendientes = await peticion('GET', '/api/tareas?completada=false');
  assert.equal(pendientes.estado, 200);
  assert.ok(pendientes.datos.every((t) => t.completada === false));

  const altas = await peticion('GET', '/api/tareas?prioridad=alta');
  assert.equal(altas.estado, 200);
  assert.ok(altas.datos.every((t) => t.prioridad === 'alta'));

  const filtroMalo = await peticion('GET', '/api/tareas?completada=quizas');
  assert.equal(filtroMalo.estado, 400);

  const inexistente = await peticion('GET', '/ruta-que-no-existe');
  assert.equal(inexistente.estado, 404);
  assert.equal(inexistente.datos.error, 'Ruta no encontrada');
});
