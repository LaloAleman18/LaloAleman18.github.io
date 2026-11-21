/* sw.js — Service Worker de Notas PWA.
   Dos trabajos:
     1. Guarda la interfaz en caché para que la app abra sin internet.
     2. Escucha el evento `sync` (Background Sync) y vacía la cola de salida
        cuando el navegador tiene red. La página no tiene que estar abierta. */

'use strict';

var CACHE = 'notas-pwa-v1';
var SHELL = ['./', 'index.html', 'app.js'];

var DB_NAME = 'notas-pwa-db';
var DB_VERSION = 1;
var STORE_NOTAS = 'notas';
var STORE_OUTBOX = 'outbox';
var API_URL = 'https://jsonplaceholder.typicode.com/posts';

/* Caché de la interfaz ------------------------------------------------------ */

self.addEventListener('install', function (evento) {
  evento.waitUntil(
    caches.open(CACHE)
      .then(function (cache) { return cache.addAll(SHELL); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (evento) {
  evento.waitUntil(
    caches.keys().then(function (claves) {
      return Promise.all(
        claves
          .filter(function (clave) { return clave !== CACHE; })
          .map(function (clave) { return caches.delete(clave); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

/* Red primero, caché como respaldo (solo GET del propio origen o externo). */
self.addEventListener('fetch', function (evento) {
  if (evento.request.method !== 'GET') return;

  evento.respondWith(
    fetch(evento.request).then(function (respuesta) {
      var copia = respuesta.clone();
      caches.open(CACHE).then(function (cache) { cache.put(evento.request, copia); });
      return respuesta;
    }).catch(function () {
      return caches.match(evento.request);
    })
  );
});

/* Background Sync ----------------------------------------------------------- */

self.addEventListener('sync', function (evento) {
  if (evento.tag === 'sincronizar-notas') {
    evento.waitUntil(vaciarCola());
  }
});

/* IndexedDB dentro del Service Worker -------------------------------------- */

function promisificarSolicitud(solicitud) {
  return new Promise(function (resolver, rechazar) {
    solicitud.onsuccess = function () { resolver(solicitud.result); };
    solicitud.onerror = function () { rechazar(solicitud.error); };
  });
}

function abrirDB() {
  return new Promise(function (resolver, rechazar) {
    var solicitud = indexedDB.open(DB_NAME, DB_VERSION);

    solicitud.onupgradeneeded = function () {
      var base = solicitud.result;
      if (!base.objectStoreNames.contains(STORE_NOTAS)) {
        base.createObjectStore(STORE_NOTAS, { keyPath: 'id', autoIncrement: true });
      }
      if (!base.objectStoreNames.contains(STORE_OUTBOX)) {
        var outbox = base.createObjectStore(STORE_OUTBOX, { keyPath: 'id', autoIncrement: true });
        outbox.createIndex('porNota', 'notaId', { unique: false });
      }
    };

    solicitud.onsuccess = function () { resolver(solicitud.result); };
    solicitud.onerror = function () { rechazar(solicitud.error); };
  });
}

function obtenerPendientes(base) {
  return promisificarSolicitud(
    base.transaction(STORE_OUTBOX, 'readonly').objectStore(STORE_OUTBOX).getAll()
  );
}

function marcarSincronizada(base, notaId) {
  return new Promise(function (resolver, rechazar) {
    var tx = base.transaction([STORE_NOTAS, STORE_OUTBOX], 'readwrite');
    var storeNotas = tx.objectStore(STORE_NOTAS);

    storeNotas.get(notaId).onsuccess = function (evento) {
      var nota = evento.target.result;
      if (nota) {
        nota.estado = 'sincronizada';
        nota.sincronizadaEn = new Date().toISOString();
        storeNotas.put(nota);
      }

      var indice = tx.objectStore(STORE_OUTBOX).index('porNota');
      indice.getAllKeys(notaId).onsuccess = function (otroEvento) {
        otroEvento.target.result.forEach(function (clave) {
          tx.objectStore(STORE_OUTBOX).delete(clave);
        });
      };
    };

    tx.oncomplete = function () { resolver(true); };
    tx.onerror = function () { rechazar(tx.error); };
  });
}

/* Recorre la cola en orden y envía cada nota. Las que fallan se quedan. */
function vaciarCola() {
  return abrirDB()
    .then(function (base) {
      return obtenerPendientes(base).then(function (pendientes) {
        return pendientes.reduce(function (cadena, item) {
          return cadena.then(function () {
            return fetch(API_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title: 'Nota PWA', body: item.texto, userId: 1 }),
              cache: 'no-store'
            }).then(function (respuesta) {
              if (!respuesta.ok) throw new Error('HTTP ' + respuesta.status);
              return marcarSincronizada(base, item.notaId);
            }).catch(function (error) {
              console.warn('[SW] No se pudo enviar una nota:', error.message);
            });
          });
        }, Promise.resolve());
      });
    })
    .then(function () {
      return self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    })
    .then(function (clientes) {
      clientes.forEach(function (cliente) {
        cliente.postMessage({ type: 'NOTAS_SINCRONIZADAS' });
      });
    })
    .catch(function (error) {
      console.error('[SW] Error al vaciar la cola:', error);
    });
}
