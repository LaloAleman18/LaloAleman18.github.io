/* Notas PWA — lógica de la app.
   Dos almacenes en IndexedDB:
     notas  -> la nota que ve el usuario, con su estado.
     outbox -> cola de salida: lo que aún no se ha enviado.
   El Service Worker (sw.js) también puede vaciar la cola cuando hay red. */

(function () {
  'use strict';

  var DB_NAME = 'notas-pwa-db';
  var DB_VERSION = 1;
  var STORE_NOTAS = 'notas';
  var STORE_OUTBOX = 'outbox';
  var API_URL = 'https://jsonplaceholder.typicode.com/posts';
  var MAXIMO_CARACTERES = 500;

  var textoInput = document.getElementById('texto');
  var contador = document.getElementById('contador');
  var guardarBoton = document.getElementById('guardar');
  var sincronizarBoton = document.getElementById('sincronizar');
  var mensajeParrafo = document.getElementById('mensaje');
  var lista = document.getElementById('notas');
  var conteo = document.getElementById('conteo');
  var pendientes = document.getElementById('pendientes');
  var vacio = document.getElementById('vacio');
  var red = document.getElementById('red');
  var redTexto = document.getElementById('red-texto');

  var db = null;
  var sincronizando = false;

  /* IndexedDB ---------------------------------------------------------------- */

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
          var notas = base.createObjectStore(STORE_NOTAS, { keyPath: 'id', autoIncrement: true });
          notas.createIndex('porCreadaEn', 'creadaEn', { unique: false });
        }

        if (!base.objectStoreNames.contains(STORE_OUTBOX)) {
          var outbox = base.createObjectStore(STORE_OUTBOX, { keyPath: 'id', autoIncrement: true });
          outbox.createIndex('porNota', 'notaId', { unique: false });
        }
      };

      solicitud.onsuccess = function () { resolver(solicitud.result); };
      solicitud.onerror = function () { rechazar(solicitud.error); };
      solicitud.onblocked = function () { rechazar(new Error('La base está bloqueada por otra pestaña.')); };
    });
  }

  function obtenerDB() {
    if (!db) db = abrirDB();
    return db;
  }

  /* Crea la nota y, en la misma transacción, su registro en la cola de salida.
     Si una de las dos escrituras falla, la transacción se cancela completa. */
  function guardarNota(base, texto) {
    return new Promise(function (resolver, rechazar) {
      var tx = base.transaction([STORE_NOTAS, STORE_OUTBOX], 'readwrite');
      var ahora = new Date().toISOString();

      var peticionNota = tx.objectStore(STORE_NOTAS).add({
        texto: texto,
        creadaEn: ahora,
        estado: 'pendiente',
        sincronizadaEn: null
      });

      peticionNota.onsuccess = function () {
        var notaId = peticionNota.result;
        tx.objectStore(STORE_OUTBOX).add({
          notaId: notaId,
          texto: texto,
          creadaEn: ahora,
          intentos: 0
        });
      };

      tx.oncomplete = function () { resolver(true); };
      tx.onerror = function () { rechazar(tx.error); };
      tx.onabort = function () { rechazar(tx.error || new Error('Transacción cancelada')); };
    });
  }

  function listarNotas(base) {
    return promisificarSolicitud(base.transaction(STORE_NOTAS, 'readonly').objectStore(STORE_NOTAS).getAll())
      .then(function (notas) {
        return notas.sort(function (a, b) {
          var porFecha = String(b.creadaEn).localeCompare(String(a.creadaEn));
          return porFecha !== 0 ? porFecha : b.id - a.id;
        });
      });
  }

  function eliminarNota(base, id) {
    return new Promise(function (resolver, rechazar) {
      var tx = base.transaction([STORE_NOTAS, STORE_OUTBOX], 'readwrite');
      tx.objectStore(STORE_NOTAS).delete(id);

      var indice = tx.objectStore(STORE_OUTBOX).index('porNota');
      indice.getAllKeys(id).onsuccess = function (evento) {
        evento.target.result.forEach(function (clave) {
          tx.objectStore(STORE_OUTBOX).delete(clave);
        });
      };

      tx.oncomplete = function () { resolver(true); };
      tx.onerror = function () { rechazar(tx.error); };
    });
  }

  function obtenerPendientes(base) {
    return promisificarSolicitud(base.transaction(STORE_OUTBOX, 'readonly').objectStore(STORE_OUTBOX).getAll());
  }

  /* Marca la nota como sincronizada y la saca de la cola. */
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

  /* Interfaz ------------------------------------------------------------------ */

  function formatearFecha(iso) {
    try {
      return new Intl.DateTimeFormat('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(iso));
    } catch (error) {
      return iso;
    }
  }

  function ponerMensaje(texto, tipo) {
    mensajeParrafo.textContent = texto;
    mensajeParrafo.className = 'mensaje' + (tipo ? ' mensaje--' + tipo : '');
  }

  function actualizarRed() {
    var enLinea = navigator.onLine;
    red.classList.toggle('status--off', !enLinea);
    redTexto.textContent = enLinea ? 'En línea' : 'Sin conexión';
  }

  function pintarNotas(notas) {
    lista.textContent = '';
    conteo.textContent = '(' + notas.length + ')';
    vacio.hidden = notas.length > 0;

    var pendientesCount = notas.filter(function (n) { return n.estado !== 'sincronizada'; }).length;
    pendientes.textContent = pendientesCount > 0
      ? pendientesCount + (pendientesCount === 1 ? ' nota pendiente de sincronizar' : ' notas pendientes de sincronizar')
      : 'Todo sincronizado';

    notas.forEach(function (nota) {
      var elemento = document.createElement('li');
      elemento.className = 'nota';

      var cuerpo = document.createElement('div');
      cuerpo.className = 'nota__cuerpo';

      var texto = document.createElement('p');
      texto.className = 'nota__texto';
      texto.textContent = nota.texto;

      var meta = document.createElement('div');
      meta.className = 'nota__meta';

      var insignia = document.createElement('span');
      var sincronizada = nota.estado === 'sincronizada';
      insignia.className = 'badge ' + (sincronizada ? 'badge--sincronizada' : 'badge--pendiente');
      insignia.textContent = sincronizada ? 'Sincronizada' : 'Pendiente de sincronizar';

      var fecha = document.createElement('span');
      fecha.className = 'nota__fecha';
      fecha.textContent = formatearFecha(nota.creadaEn);

      meta.appendChild(insignia);
      meta.appendChild(fecha);
      cuerpo.appendChild(texto);
      cuerpo.appendChild(meta);

      var borrar = document.createElement('button');
      borrar.type = 'button';
      borrar.className = 'nota__borrar';
      borrar.textContent = '×';
      borrar.setAttribute('aria-label', 'Eliminar nota');
      borrar.addEventListener('click', function () { eliminar(nota.id); });

      elemento.appendChild(cuerpo);
      elemento.appendChild(borrar);
      lista.appendChild(elemento);
    });
  }

  function renderizar() {
    return obtenerDB()
      .then(function (base) { return listarNotas(base); })
      .then(pintarNotas)
      .catch(function (error) {
        console.error(error);
        ponerMensaje('No se pudieron cargar las notas.', 'error');
      });
  }

  function eliminar(id) {
    obtenerDB()
      .then(function (base) { return eliminarNota(base, id); })
      .then(renderizar)
      .then(function () { ponerMensaje('Nota eliminada.'); })
      .catch(function (error) {
        console.error(error);
        ponerMensaje('No se pudo eliminar la nota.', 'error');
      });
  }

  /* Sincronización ------------------------------------------------------------ */

  function sincronizarAhora() {
    if (sincronizando) return Promise.resolve();
    sincronizando = true;
    sincronizarBoton.disabled = true;
    sincronizarBoton.textContent = 'Sincronizando...';

    return obtenerDB()
      .then(function (base) {
        return obtenerPendientes(base).then(function (pendientes) {
          var enviadas = 0;
          var fallidas = 0;

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
              }).then(function () {
                enviadas += 1;
              }).catch(function (error) {
                console.warn('No se pudo enviar una nota:', error.message);
                fallidas += 1;
              });
            });
          }, Promise.resolve()).then(function () {
            sincronizando = false;
            sincronizarBoton.disabled = false;
            sincronizarBoton.textContent = 'Sincronizar ahora';

            return renderizar().then(function () {
              if (enviadas > 0 && fallidas === 0) {
                ponerMensaje('Se sincronizaron ' + enviadas + (enviadas === 1 ? ' nota.' : ' notas.'), 'ok');
              } else if (fallidas > 0) {
                ponerMensaje('No se pudieron enviar ' + fallidas + (fallidas === 1 ? ' nota.' : ' notas.') + ' Se quedaron en la cola.', 'error');
              } else {
                ponerMensaje('No hay notas pendientes.');
              }
            });
          });
        });
      })
      .catch(function (error) {
        console.error(error);
        sincronizando = false;
        sincronizarBoton.disabled = false;
        sincronizarBoton.textContent = 'Sincronizar ahora';
        ponerMensaje('No se pudo completar la sincronización.', 'error');
      });
  }

  function programarSincronizacion() {
    if (!('serviceWorker' in navigator) || !('SyncManager' in window)) return Promise.resolve(false);
    return navigator.serviceWorker.ready
      .then(function (registro) { return registro.sync.register('sincronizar-notas'); })
      .catch(function (error) {
        console.warn('Background Sync no disponible:', error.message);
        return false;
      });
  }

  function registrarServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(function (error) {
        console.error('No se pudo registrar el Service Worker:', error);
      });
    });

    navigator.serviceWorker.addEventListener('message', function (evento) {
      if (evento.data && evento.data.type === 'NOTAS_SINCRONIZADAS') {
        renderizar().then(function () {
          ponerMensaje('El Service Worker terminó de sincronizar.', 'ok');
        });
        programarSincronizacion();
      }
    });
  }

  /* Eventos ------------------------------------------------------------------- */

  textoInput.addEventListener('input', function () {
    contador.textContent = textoInput.value.length + ' / ' + MAXIMO_CARACTERES;
  });

  guardarBoton.addEventListener('click', function () {
    var texto = textoInput.value.trim();
    if (!texto) {
      ponerMensaje('Escribe algo antes de guardar.', 'error');
      textoInput.focus();
      return;
    }

    obtenerDB()
      .then(function (base) { return guardarNota(base, texto); })
      .then(function () {
        textoInput.value = '';
        contador.textContent = '0 / ' + MAXIMO_CARACTERES;
        return renderizar();
      })
      .then(function () {
        ponerMensaje('Nota guardada. Pendiente de sincronizar.', 'ok');
        programarSincronizacion();
      })
      .catch(function (error) {
        console.error(error);
        ponerMensaje('No se pudo guardar la nota.', 'error');
      });
  });

  sincronizarBoton.addEventListener('click', sincronizarAhora);

  window.addEventListener('online', function () {
    actualizarRed();
    sincronizarAhora();
  });
  window.addEventListener('offline', actualizarRed);

  /* Arranque ------------------------------------------------------------------ */

  actualizarRed();
  registrarServiceWorker();
  renderizar();
  programarSincronizacion();
})();
