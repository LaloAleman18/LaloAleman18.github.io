/* Interfaz del portafolio: idioma, entrada de secciones y reloj. */
(function () {
  'use strict';

  var copy = {
    es: {
      title: 'José Eduardo Casarrubias Aleman — Desarrollo de software',
      description: 'Portafolio de José Eduardo Casarrubias Aleman. Productos web y móviles: PWAs offline, dashboards, herramientas para developers y juegos en canvas.',
      strings: {
        'skip': 'Saltar al contenido',
        'nav.work': 'Trabajo',
        'nav.personal': 'Personales',
        'nav.about': 'Sobre mí',
        'nav.contact': 'Contacto',
        'hero.status': 'Disponible para estadías · 2026',
        'hero.line1': 'Software que',
        'hero.em': 'aguanta',
        'hero.line2': 'la vida real.',
        'hero.lead': 'Diseño y construyo productos web y móviles. Me interesa lo que pasa cuando la red falla, el usuario tiene prisa o el dato no cabe en una tarjeta.',
        'hero.cta1': 'Ver proyectos',
        'hero.cta2': 'GitHub',
        'sheet.title': 'Ficha rápida',
        'sheet.edu.k': 'Formación',
        'sheet.edu.v': 'Desarrollo de software · UTEZ',
        'sheet.focus.k': 'Foco',
        'sheet.focus.v': 'Producto web, datos y móvil',
        'sheet.stack.k': 'Stack',
        'sheet.stack.v': 'JS/TS · Dart · C# · SQL',
        'sheet.base.k': 'Base',
        'sheet.base.v': 'México',
        'sheet.status.k': 'Estado',
        'sheet.status.v': 'Abierto a estadías',
        'sheet.note': 'Sin frameworks en producción.',
        'work.kicker': '01 — Trabajo seleccionado',
        'work.title': 'Cuatro proyectos, cuatro problemas distintos.',
        'work.note': 'Todos con demo o caso de estudio. Nada de mockups que no existen.',
        'p1.meta': 'Caso de estudio',
        'p1.sub': 'Pedidos que no se pierden',
        'p1.desc': 'PWA de pedidos para una tostaduría. La venta se guarda en IndexedDB antes de salir a la red; el Service Worker la sincroniza cuando vuelve la conexión.',
        'p2.meta': 'Demo en vivo',
        'p2.sub': 'Panel de rendimiento cafetalero',
        'p2.desc': 'Dashboard para una cooperativa: series de tiempo, filtros por finca y exportación a CSV. Datos de demostración generados con una semilla fija.',
        'p3.meta': 'Juego',
        'p3.sub': 'Arcade de una sola pantalla',
        'p3.desc': 'Juego endless en canvas: oleadas procedurales, partículas y sonido sintetizado. Sin assets externos; todo se dibuja en tiempo real.',
        'p4.meta': 'Herramienta',
        'p4.sub': 'JSON a TypeScript en un segundo',
        'p4.desc': 'Herramienta para inspeccionar payloads y generar interfaces, CSV o tabla. Detecta campos opcionales y une arrays; corre completo en el navegador.',
        'personales.kicker': '02 — Proyectos personales',
        'personales.title': 'Aprender haciendo, de principio a fin.',
        'personales.note': 'Cinco proyectos con su README y sus pruebas. Se publican a medida que se terminan.',
        'p5.meta': 'API REST',
        'p5.sub': 'Tareas que viven en un archivo JSON',
        'p5.desc': 'Node.js y Express con validación, filtros, códigos HTTP correctos y pruebas con node:test. Sin base de datos externa.',
        'p6.meta': 'Demo en vivo',
        'p6.sub': 'Notas que funcionan sin internet',
        'p6.desc': 'IndexedDB con patrón outbox: cada nota nace pendiente y se envía con Background Sync cuando vuelve la red. La interfaz también abre sin conexión.',
        'p7.meta': 'Demo en vivo',
        'p7.sub': 'Carrito que recuerda lo que elegiste',
        'p7.desc': 'Ocho productos, cantidades editables, subtotales y compra simulada con folio. El carrito se guarda en localStorage para que siga ahí al volver.',
        'about.kicker': '03 — Sobre mí',
        'about.title': 'Me gusta el tramo incómodo del software.',
        'about.p1': 'Soy José Eduardo Casarrubias Aleman. Estudio desarrollo de software en la UTEZ y me formé haciendo proyectos completos: de la pantalla a la base de datos.',
        'about.p2': 'Me interesa la parte que casi nadie presume: la cola que reintenta, el estado vacío que explica, el error que no culpa al usuario. También dibujo interfaces; creo que un buen diseño se nota cuando no tienes que preguntar dónde hacer clic.',
        'about.p3': 'Trabajo con JavaScript y TypeScript, Dart/Flutter, C# y SQL. He entregado una PWA offline, un cliente móvil con pruebas automatizadas y prototipos jugables en Unity.',
        'pr1.title': 'Primero el problema',
        'pr1.body': 'Antes de elegir herramienta, escribo qué tiene que pasar y qué no puede fallar.',
        'pr2.title': 'Interfaces con criterio',
        'pr2.body': 'Jerarquía, contraste y ritmo. Si hay que explicar dónde hacer clic, el diseño falló.',
        'pr3.title': 'Código que se defiende',
        'pr3.body': 'Nombres claros, estados explícitos y pruebas donde duele. Puedo explicar cada decisión.',
        'contact.kicker': '04 — Contacto',
        'contact.title': '¿Tienes una vacante de estadía o un proyecto en mente?',
        'contact.body': 'Estoy buscando prácticas profesionales donde pueda aportar desde el primer sprint y seguir aprendiendo de gente que lleva más camino.',
        'contact.cta': 'Escríbeme por GitHub',
        'contact.note': 'Respondo rápido. También puedes ver el código de este sitio.',
        'foot.colophon': 'Sitio escrito a mano en HTML, CSS y JavaScript. Sin frameworks, sin cookies, sin rastreadores. Tipografías: Instrument Serif, Inter Tight e IBM Plex Mono.',
        'foot.local': 'Hora local',
        'foot.updated': 'Actualizado'
      }
    },
    en: {
      title: 'José Eduardo Casarrubias Aleman — Software development',
      description: 'Portfolio of José Eduardo Casarrubias Aleman. Web and mobile products: offline PWAs, dashboards, developer tools and canvas games.',
      strings: {
        'skip': 'Skip to content',
        'nav.work': 'Work',
        'nav.personal': 'Personal',
        'nav.about': 'About',
        'nav.contact': 'Contact',
        'hero.status': 'Open to internships · 2026',
        'hero.line1': 'Software that',
        'hero.em': 'holds up',
        'hero.line2': 'to real life.',
        'hero.lead': 'I design and build web and mobile products. I care about what happens when the network drops, the user is in a hurry, or the data does not fit in a card.',
        'hero.cta1': 'See projects',
        'hero.cta2': 'GitHub',
        'sheet.title': 'Quick facts',
        'sheet.edu.k': 'Education',
        'sheet.edu.v': 'Software development · UTEZ',
        'sheet.focus.k': 'Focus',
        'sheet.focus.v': 'Web product, data, mobile',
        'sheet.stack.k': 'Stack',
        'sheet.stack.v': 'JS/TS · Dart · C# · SQL',
        'sheet.base.k': 'Based in',
        'sheet.base.v': 'Mexico',
        'sheet.status.k': 'Status',
        'sheet.status.v': 'Open to internships',
        'sheet.note': 'No frameworks in production.',
        'work.kicker': '01 — Selected work',
        'work.title': 'Four projects, four different problems.',
        'work.note': 'All with a live demo or case study. No mockups that do not exist.',
        'p1.meta': 'Case study',
        'p1.sub': 'Orders that do not get lost',
        'p1.desc': 'A bakery ordering PWA. Every order is written to IndexedDB before it hits the network; a Service Worker syncs it when the connection returns.',
        'p2.meta': 'Live demo',
        'p2.sub': 'Coffee performance dashboard',
        'p2.desc': 'A cooperative dashboard: time series, farm filters and CSV export. Demo data generated from a fixed seed.',
        'p3.meta': 'Game',
        'p3.sub': 'A one-screen arcade',
        'p3.desc': 'An endless canvas game: procedural waves, particles and synthesized sound. No external assets; everything is drawn at runtime.',
        'p4.meta': 'Tool',
        'p4.sub': 'JSON to TypeScript in a second',
        'p4.desc': 'A tool to inspect payloads and generate interfaces, CSV or a table. It detects optional fields and merges arrays; it runs entirely in the browser.',
        'personales.kicker': '02 — Personal projects',
        'personales.title': 'Learning by building, start to finish.',
        'personales.note': 'Five projects with their README and tests. Published as they are finished.',
        'p5.meta': 'REST API',
        'p5.sub': 'Tasks that live in a JSON file',
        'p5.desc': 'Node.js and Express with validation, filters, correct HTTP codes and node:test tests. No external database.',
        'p6.meta': 'Live demo',
        'p6.sub': 'Notes that work offline',
        'p6.desc': 'IndexedDB with an outbox pattern: every note starts pending and is sent with Background Sync when the network returns. The interface also opens offline.',
        'p7.meta': 'Live demo',
        'p7.sub': 'A cart that remembers your picks',
        'p7.desc': 'Eight products, editable quantities, subtotals and a simulated checkout with an order number. The cart is saved in localStorage so it is still there when you return.',
        'about.kicker': '03 — About',
        'about.title': 'I like the awkward part of software.',
        'about.p1': 'I am José Eduardo Casarrubias Aleman. I study software development at UTEZ, and I learned by building complete projects: from the screen to the database.',
        'about.p2': 'I care about the part nobody brags about: the queue that retries, the empty state that explains itself, the error that does not blame the user. I also draw interfaces; good design shows when you do not have to ask where to click.',
        'about.p3': 'I work with JavaScript and TypeScript, Dart/Flutter, C# and SQL. I have shipped an offline PWA, a mobile client with automated tests, and playable Unity prototypes.',
        'pr1.title': 'Problem first',
        'pr1.body': 'Before picking a tool, I write down what has to happen and what cannot fail.',
        'pr2.title': 'Interfaces with judgment',
        'pr2.body': 'Hierarchy, contrast, rhythm. If you have to explain where to click, the design failed.',
        'pr3.title': 'Code you can defend',
        'pr3.body': 'Clear names, explicit states, tests where it hurts. I can explain every decision.',
        'contact.kicker': '04 — Contact',
        'contact.title': 'Got an internship opening or a project in mind?',
        'contact.body': 'I am looking for an internship where I can contribute from the first sprint and keep learning from people with more miles.',
        'contact.cta': 'Message me on GitHub',
        'contact.note': 'I reply fast. You can also read the code behind this site.',
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

  /* Entrada de bloques al hacer scroll. */
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

  /* Reloj local, sin librerías. */
  var clock = document.getElementById('clock');
  function tick() {
    if (!clock) return;
    var now = new Date();
    try {
      clock.textContent = new Intl.DateTimeFormat(current === 'es' ? 'es-MX' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'America/Mexico_City'
      }).format(now);
    } catch (error) {
      clock.textContent = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    }
  }
  tick();
  setInterval(tick, 30000);
})();
