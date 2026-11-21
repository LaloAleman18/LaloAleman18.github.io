'use strict';

/* store.js — Persistencia de tareas en un archivo JSON.
   Este módulo no sabe nada de HTTP: solo lee, escribe y administra los
   registros. Eso lo hace fácil de probar y de reutilizar. */

const fs = require('fs/promises');
const path = require('path');

const RUTA_POR_DEFECTO = path.join(__dirname, 'tareas.json');

/* Lee el archivo. Si no existe, empieza con una lista vacía.
   Si existe pero está corrupto, lanza el error para que la API responda 500. */
async function leerTareas(ruta) {
  try {
    const contenido = await fs.readFile(ruta, 'utf8');
    const datos = JSON.parse(contenido);
    if (!Array.isArray(datos)) {
      throw new Error('El archivo de tareas no contiene una lista.');
    }
    return datos;
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

/* Escribe primero en un archivo temporal y luego lo renombra.
   Así, si el proceso se corta a la mitad, el archivo original no queda roto. */
async function escribirTareas(ruta, tareas) {
  const rutaTemporal = ruta + '.tmp';
  await fs.writeFile(rutaTemporal, JSON.stringify(tareas, null, 2) + '\n', 'utf8');
  await fs.rename(rutaTemporal, ruta);
}

/* Fabrica un almacén ligado a una ruta.
   Las pruebas pasan una ruta temporal; el servidor usa la ruta por defecto. */
function crearAlmacen(ruta = RUTA_POR_DEFECTO) {
  return {
    async listar() {
      return leerTareas(ruta);
    },

    async obtener(id) {
      const tareas = await leerTareas(ruta);
      return tareas.find((tarea) => tarea.id === id) || null;
    },

    async crear({ titulo, prioridad, completada }) {
      const tareas = await leerTareas(ruta);
      const ahora = new Date().toISOString();
      const ultimoId = tareas.reduce((maximo, tarea) => Math.max(maximo, tarea.id || 0), 0);

      const tarea = {
        id: ultimoId + 1,
        titulo,
        prioridad,
        completada,
        creadaEn: ahora,
        actualizadaEn: ahora
      };

      tareas.push(tarea);
      await escribirTareas(ruta, tareas);
      return tarea;
    },

    async actualizar(id, cambios) {
      const tareas = await leerTareas(ruta);
      const indice = tareas.findIndex((tarea) => tarea.id === id);
      if (indice === -1) return null;

      const actualizada = {
        ...tareas[indice],
        ...cambios,
        id: tareas[indice].id,
        creadaEn: tareas[indice].creadaEn,
        actualizadaEn: new Date().toISOString()
      };

      tareas[indice] = actualizada;
      await escribirTareas(ruta, tareas);
      return actualizada;
    },

    async eliminar(id) {
      const tareas = await leerTareas(ruta);
      const indice = tareas.findIndex((tarea) => tarea.id === id);
      if (indice === -1) return false;

      tareas.splice(indice, 1);
      await escribirTareas(ruta, tareas);
      return true;
    }
  };
}

module.exports = { crearAlmacen, RUTA_POR_DEFECTO };
