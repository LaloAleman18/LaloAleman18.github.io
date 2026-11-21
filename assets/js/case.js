/* Idioma, índice lateral y reloj del caso de estudio.
   Lee el mismo preferencia que la portafolio (jeca.lang). */
(function () {
  'use strict';

  var copy = {
    es: {
      title: 'Outbox — Caso de estudio | José Eduardo Casarrubias Aleman',
      description: 'Caso de estudio de Outbox: pedidos offline con IndexedDB, patrón Outbox y Background Sync, escrito en JavaScript sin dependencias.',
      strings: {
        'skip': 'Saltar al contenido',
        'nav.work': 'Trabajo',
        'nav.about': 'Sobre mí',
        'nav.contact': 'Contacto',
        'crumb': 'Caso de estudio',
        'case.kicker': 'Proyecto 01 / 04 · Persistencia offline',
        'case.sub': 'Pedidos que sobreviven a una red que falla.',
        'case.lead': 'Una tostaduría toma pedidos desde una tablet. La conexión va y viene, y el servidor tampoco es garantía. La regla de diseño fue una sola: el pedido se guarda antes de intentar salir.',
        'fact.role.k': 'Rol',
        'fact.role.v': 'Diseño de producto y desarrollo',
        'fact.year.k': 'Año',
        'fact.context.k': 'Contexto',
        'fact.context.v': 'Proyecto académico · UTEZ',
        'fact.stack.k': 'Stack',
        'fact.stack.v': 'JavaScript, IndexedDB, Service Worker',
        'fact.status.k': 'Estado',
        'fact.status.v': 'Demo pública y código abierto',
        'action.demo': 'Abrir demo',
        'action.repo': 'Ver código',
        'hero.caption': 'Cola sincronizada: tres pedidos enviados, cero pendientes',
        'index.title': 'En esta página',
        'index.1': 'El problema',
        'index.2': 'Cómo funciona',
        'index.3': 'Decisiones',
        'index.4': 'Pruébalo',
        'index.5': 'Qué sigue',
        'ch1.title': 'El problema',
        'ch1.p1': 'En un mostrador no hay tiempo para esperar una respuesta del servidor. Si la red cae a mitad de un pedido, una implementación ingenua pierde la venta o deja al empleado rellenando el formulario dos veces.',
        'ch1.p2': 'El reto era que la interfaz respondiera al instante, que el dato sobreviviera al cierre de la pestaña y que el envío se reanudara sin intervención cuando volviera la conexión. Todo eso sin librerías: la consigna pedía usar las APIs del navegador directamente.',
        'c1.title': 'Red intermitente',
        'c1.body': 'El POST puede fallar por caída de red, timeout o respuesta 500. La interfaz no debe depender de ese resultado para aceptar el pedido.',
        'c2.title': 'Dato persistente',
        'c2.body': 'Guardar en memoria o en <code class="inline">localStorage</code> no basta: hacían falta transacciones, índices y consultas por estado.',
        'c3.title': 'Backend de prueba',
        'c3.body': 'No había servicio propio. La misma app debía funcionar con un mock local y con una API pública de pruebas en Pages.',
        'pull': 'El pedido se guarda antes de intentar salir: eso es el Outbox.',
        'ch2.title': 'Cómo funciona',
        'ch2.p1': 'La página nunca hace el <code class="inline">fetch</code>. Solo encola y avisa. El motor de envío vive en el Service Worker, así que puede terminar el trabajo aunque la pestaña ya no esté abierta.',
        'ch2.p2': 'Cuatro piezas, una sola dirección: la interfaz escribe, la base guarda, el worker envía y la interfaz vuelve a leer el resultado.',
        'f1.tag': 'Interfaz',
        'f1.body': 'El formulario valida y llama a <code class="inline">Outbox.enqueue()</code>. La respuesta es inmediata.',
        'f2.tag': 'Cola local',
        'f2.body': 'El registro nace como <code class="inline">pendiente</code>, con clientId, payload, intentos y fechas.',
        'f3.tag': 'Motor de envío',
        'f3.body': 'Lee los pendientes en orden FIFO, hace el POST y marca <code class="inline">enviado</code> o <code class="inline">error</code>.',
        'f4.tag': 'Respuesta',
        'f4.body': 'El worker avisa a las pestañas abiertas; la UI refresca contadores y registro de actividad.',
        'st.pending': 'Pendiente',
        'st.syncing': 'Sincronizando',
        'st.sent': 'Enviado',
        'st.error': 'Error · reintenta',
        'st.note': 'En Chromium el disparador es Background Sync (tag <code class="inline">outbox-sync</code>). En Safari, donde no existe SyncManager, el evento <code class="inline">online</code> pide el vaciado por mensaje. La lógica de envío es la misma en los dos casos.',
        'ch3.title': 'Decisiones',
        'ch3.p1': 'Cada decisión responde a una falla concreta. Ninguna está ahí para llenar una diapositiva.',
        'd1.title': 'Outbox primero, red después',
        'd1.body': 'Si el envío falla, el pedido ya está a salvo en IndexedDB. La confirmación al usuario no espera a la red; la sincronización es responsable del resto.',
        'd2.title': 'Un clientId por pedido',
        'd2.body': 'Cada registro lleva un UUID con índice único. El backend puede usarlo como clave de idempotencia y descartar duplicados si el reintento llega dos veces.',
        'd3.title': 'Lectura y escritura en la misma transacción',
        'd3.body': 'El wrapper propio de IndexedDB resuelve la promesa en <code class="inline">oncomplete</code>, no en el éxito del request. Así un cambio de estado no se pierde a mitad de camino ni compite con otra escritura.',
        'd4.title': 'Un solo dueño del POST',
        'd4.body': 'La petición vive en <code class="inline">api.js</code> y la ejecuta únicamente el Service Worker. No hay dos caminos de envío que puedan duplicar pedidos; el bloqueo <code class="inline">activeSync</code> evita disparos concurrentes.',
        'd5.title': 'FIFO y reintentos acotados',
        'd5.body': 'Los registros se ordenan por fecha y se encadenan con promesas, uno por uno. Después de cinco intentos el pedido queda en error con su mensaje, sin bloquear a los demás.',
        'code.title': 'Registro en la cola',
        'figure.caption': 'Fig. 02 — Fallo simulado: los pedidos quedan en error con su motivo y se pueden reintentar',
        'ch4.title': 'Pruébalo',
        'ch4.p1': 'La demo pública apunta a una API de pruebas. Para ver el ciclo completo con el mock incluido, basta con levantar el servidor local del repositorio.',
        's1': 'Abre la demo y activa <strong>Simular caída de red</strong>. El interruptor se guarda en IndexedDB para que el Service Worker también lo respete.',
        's2': 'Crea un pedido. Aparece como <strong>pendiente</strong> con <code>attempts: 0</code> y su payload completo.',
        's3': 'Pulsa <strong>Sincronizar ahora</strong> con la red caída: el registro pasa a <strong>error</strong> y guarda el mensaje.',
        's4': 'Desactiva la simulación y usa <strong>Reintentar</strong>. El pedido vuelve a pendiente y se envía.',
        's5': 'Abre DevTools → Application → IndexedDB → <code>outbox-db</code> para ver los registros reales, no un estado dibujado.',
        'ch4.note': 'En local: <code class="inline">node tools/server.js</code> y abre <code class="inline">http://localhost:8765/</code>.',
        'ch5.title': 'Qué sigue',
        'ch5.p1': 'Lo que cambiaría antes de llevarlo a producción, y que puedo explicar sin memorizar un diagrama:',
        'n1': 'Validación y autenticación reales en el servidor, no solo en el formulario.',
        'n2': 'Idempotencia de verdad usando <code class="inline">clientId</code> como clave única en el backend.',
        'n3': 'Backoff exponencial y respeto a <code class="inline">Retry-After</code> en lugar de un máximo fijo.',
        'n4': 'Expiración de datos sensibles en IndexedDB y <code class="inline">AbortController</code> para cancelar el fetch del timeout.',
        'n5': 'Métricas y alertas cuando un pedido agota los intentos automáticos.',
        'end.text': '¿Quieres ver el código o probar la demo?',
        'end.link': 'Volver al portafolio ↗',
        'foot.colophon': 'Sitio escrito a mano en HTML, CSS y JavaScript. Sin frameworks, sin cookies, sin rastreadores. Tipografías: Instrument Serif, Inter Tight e IBM Plex Mono.',
        'foot.local': 'Hora local',
        'foot.updated': 'Actualizado'
      }
    },
    en: {
      title: 'Outbox — Case study | José Eduardo Casarrubias Aleman',
      description: 'Outbox case study: offline orders with IndexedDB, the Outbox pattern and Background Sync, written in dependency-free JavaScript.',
      strings: {
        'skip': 'Skip to content',
        'nav.work': 'Work',
        'nav.about': 'About',
        'nav.contact': 'Contact',
        'crumb': 'Case study',
        'case.kicker': 'Project 01 / 04 · Offline persistence',
        'case.sub': 'Orders that survive a failing network.',
        'case.lead': 'A coffee roaster takes orders on a tablet. The connection comes and goes, and the server is not a guarantee either. There was one design rule: save the order before trying to send it.',
        'fact.role.k': 'Role',
        'fact.role.v': 'Product design and development',
        'fact.year.k': 'Year',
        'fact.context.k': 'Context',
        'fact.context.v': 'Academic project · UTEZ',
        'fact.stack.k': 'Stack',
        'fact.stack.v': 'JavaScript, IndexedDB, Service Worker',
        'fact.status.k': 'Status',
        'fact.status.v': 'Public demo and open source',
        'action.demo': 'Open demo',
        'action.repo': 'View code',
        'hero.caption': 'Synced queue: three orders sent, none pending',
        'index.title': 'On this page',
        'index.1': 'The problem',
        'index.2': 'How it works',
        'index.3': 'Decisions',
        'index.4': 'Try it',
        'index.5': 'What is next',
        'ch1.title': 'The problem',
        'ch1.p1': 'At a counter there is no time to wait for a server response. If the network drops halfway through an order, a naive implementation loses the sale or makes the employee fill the form twice.',
        'ch1.p2': 'The interface had to respond instantly, the data had to survive a closed tab, and sending had to resume on its own once the connection came back. All without libraries: the assignment called for using browser APIs directly.',
        'c1.title': 'Flickering network',
        'c1.body': 'The POST can fail because of a dropped connection, a timeout or a 500 response. The interface must not depend on that result to accept the order.',
        'c2.title': 'Persistent data',
        'c2.body': 'Memory or <code class="inline">localStorage</code> is not enough: this needed transactions, indexes and queries by status.',
        'c3.title': 'Test backend',
        'c3.body': 'There was no service of our own. The same app had to work with a local mock and with a public test API on Pages.',
        'pull': 'Save the order before trying to send it: that is the Outbox.',
        'ch2.title': 'How it works',
        'ch2.p1': 'The page never makes the <code class="inline">fetch</code>. It only queues and notifies. The sending engine lives in the Service Worker, so it can finish the job even after the tab is gone.',
        'ch2.p2': 'Four pieces, one direction: the interface writes, the database stores, the worker sends, and the interface reads the result again.',
        'f1.tag': 'Interface',
        'f1.body': 'The form validates and calls <code class="inline">Outbox.enqueue()</code>. Confirmation is immediate.',
        'f2.tag': 'Local queue',
        'f2.body': 'The record is born as <code class="inline">pending</code>, with a clientId, payload, attempts and timestamps.',
        'f3.tag': 'Sending engine',
        'f3.body': 'Reads pending records FIFO, performs the POST and marks <code class="inline">sent</code> or <code class="inline">error</code>.',
        'f4.tag': 'Result',
        'f4.body': 'The worker notifies open tabs; the UI refreshes counters and the activity log.',
        'st.pending': 'Pending',
        'st.syncing': 'Syncing',
        'st.sent': 'Sent',
        'st.error': 'Error · retry',
        'st.note': 'In Chromium the trigger is Background Sync (tag <code class="inline">outbox-sync</code>). In Safari, where SyncManager does not exist, the <code class="inline">online</code> event asks for a flush via message. The sending logic is the same in both cases.',
        'ch3.title': 'Decisions',
        'ch3.p1': 'Every decision answers a specific failure. None of them is here to fill a slide.',
        'd1.title': 'Outbox first, network second',
        'd1.body': 'If sending fails, the order is already safe in IndexedDB. User confirmation does not wait for the network; syncing handles the rest.',
        'd2.title': 'One clientId per order',
        'd2.body': 'Each record carries a UUID with a unique index. The backend can use it as an idempotency key and discard duplicates if a retry arrives twice.',
        'd3.title': 'Read and write in one transaction',
        'd3.body': 'The small IndexedDB wrapper resolves the promise on <code class="inline">oncomplete</code>, not on request success. A state change cannot be lost halfway or race with another write.',
        'd4.title': 'A single owner of the POST',
        'd4.body': 'The request lives in <code class="inline">api.js</code> and only the Service Worker runs it. There are no two sending paths that could duplicate orders; the <code class="inline">activeSync</code> lock prevents concurrent triggers.',
        'd5.title': 'FIFO and bounded retries',
        'd5.body': 'Records are sorted by date and chained with promises, one at a time. After five attempts the order stays in error with its message, without blocking the others.',
        'code.title': 'Record in the queue',
        'figure.caption': 'Fig. 02 — Simulated failure: orders stay in error with their reason and can be retried',
        'ch4.title': 'Try it',
        'ch4.p1': 'The public demo points to a test API. To see the full cycle with the included mock, just start the repository’s local server.',
        's1': 'Open the demo and turn on <strong>Simulate network failure</strong>. The flag is stored in IndexedDB so the Service Worker respects it too.',
        's2': 'Create an order. It shows as <strong>pending</strong> with <code>attempts: 0</code> and its full payload.',
        's3': 'Press <strong>Sync now</strong> while the network is down: the record moves to <strong>error</strong> and keeps the message.',
        's4': 'Turn the simulation off and use <strong>Retry</strong>. The order goes back to pending and is sent.',
        's5': 'Open DevTools → Application → IndexedDB → <code>outbox-db</code> to see the real records, not a drawn state.',
        'ch4.note': 'Locally: <code class="inline">node tools/server.js</code> and open <code class="inline">http://localhost:8765/</code>.',
        'ch5.title': 'What is next',
        'ch5.p1': 'What I would change before taking it to production, and that I can explain without memorizing a diagram:',
        'n1': 'Real server-side validation and authentication, not just in the form.',
        'n2': 'True idempotency using <code class="inline">clientId</code> as a unique key in the backend.',
        'n3': 'Exponential backoff and respect for <code class="inline">Retry-After</code> instead of a fixed maximum.',
        'n4': 'Expiry of sensitive data in IndexedDB and <code class="inline">AbortController</code> to cancel the timeout fetch.',
        'n5': 'Metrics and alerts when an order exhausts its automatic attempts.',
        'end.text': 'Want to read the code or try the demo?',
        'end.link': 'Back to portfolio ↗',
        'foot.colophon': 'Site written by hand in HTML, CSS and JavaScript. No frameworks, no cookies, no trackers. Typefaces: Instrument Serif, Inter Tight and IBM Plex Mono.',
        'foot.local': 'Local time',
        'foot.updated': 'Updated'
      }
    }
  };

  var root = document.documentElement;
  var langButton = document.getElementById('lang');
  var metaDescription = document.querySelector('meta[name="description"]');
  var current = 'es';

  function setLanguage(lang, push) {
    if (!copy[lang]) lang = 'es';
    current = lang;
    var dict = copy[lang].strings;

    document.querySelectorAll('[data-i18n]').forEach(function (node) {
      var value = dict[node.getAttribute('data-i18n')];
      if (typeof value === 'string') node.innerHTML = value;
    });

    root.lang = lang;
    document.title = copy[lang].title;
    if (metaDescription) metaDescription.setAttribute('content', copy[lang].description);

    document.querySelectorAll('.lang [data-lang]').forEach(function (node) {
      node.classList.toggle('is-active', node.getAttribute('data-lang') === lang);
    });
    if (langButton) {
      langButton.setAttribute('aria-label', lang === 'es'
        ? 'Cambiar idioma a inglés'
        : 'Switch language to Spanish');
    }

    try { localStorage.setItem('jeca.lang', lang); } catch (error) { /* modo privado */ }

    if (push && window.history && window.history.replaceState) {
      var url = new URL(window.location.href);
      if (lang === 'es') url.searchParams.delete('lang');
      else url.searchParams.set('lang', 'en');
      window.history.replaceState({}, '', url.pathname + url.search + url.hash);
    }
  }

  function initialLanguage() {
    var fromUrl = new URLSearchParams(window.location.search).get('lang');
    if (fromUrl === 'es' || fromUrl === 'en') return fromUrl;
    try {
      var saved = localStorage.getItem('jeca.lang');
      if (saved === 'es' || saved === 'en') return saved;
    } catch (error) { /* modo privado */ }
    return 'es';
  }

  if (langButton) {
    langButton.addEventListener('click', function () {
      setLanguage(current === 'es' ? 'en' : 'es', true);
    });
  }

  setLanguage(initialLanguage(), false);

  /* Entrada de bloques. */
  var revealNodes = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealNodes.forEach(function (node) { observer.observe(node); });
  } else {
    revealNodes.forEach(function (node) { node.classList.add('is-in'); });
  }

  /* Índice lateral: marca el capítulo visible. */
  var links = Array.prototype.slice.call(document.querySelectorAll('.case__index a'));
  if ('IntersectionObserver' in window && links.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (link) {
          link.classList.toggle('is-current', link.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-20% 0px -65% 0px' });
    links.forEach(function (link) {
      var section = document.querySelector(link.getAttribute('href'));
      if (section) spy.observe(section);
    });
  }

  /* Reloj local. */
  var clock = document.getElementById('clock');
  function tick() {
    if (!clock) return;
    var now = new Date();
    try {
      clock.textContent = new Intl.DateTimeFormat(current === 'es' ? 'es-MX' : 'en-US', {
        hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Mexico_City'
      }).format(now);
    } catch (error) {
      clock.textContent = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    }
  }
  tick();
  setInterval(tick, 30000);
})();
