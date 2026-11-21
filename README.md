# Portafolio — José Eduardo Casarrubias Aleman

Sitio personal público en [https://laloaleman18.github.io/](https://laloaleman18.github.io/).
Portafolio bilingüe (ES/EN) para buscar estadías profesionales en desarrollo web, frontend,
móvil, backend y videojuegos.

> Escrito a mano en HTML, CSS y JavaScript. Sin frameworks, sin build step, sin dependencias
> en producción y sin rastreadores. Las tipografías están alojadas en el propio repositorio.

## Estructura

```text
.
├── index.html                  Portafolio principal
├── work/
│   └── outbox.html             Caso de estudio de Outbox
├── labs/
│   ├── terra/                  Dashboard editorial de datos cafetaleros (SVG + CSV)
│   ├── rift/                   Arcade en canvas con WebAudio
│   └── lex/                    JSON → TypeScript / CSV / tabla
├── assets/
│   ├── css/                    site.css (sistema visual) y case.css (caso de estudio)
│   ├── js/                     site.js y case.js (idioma, reveal, reloj, índice)
│   ├── fonts/                  Instrument Serif, Inter Tight e IBM Plex Mono (woff2)
│   └── img/                    Capturas, favicon, OG
├── 404.html                    Página de error
└── .nojekyll                   Despliegue directo en GitHub Pages
```

## Idioma

El idioma se guarda en `localStorage` bajo `jeca.lang` y también se puede forzar con
`?lang=en` o `?lang=es`. Los textos viven en diccionarios dentro de `assets/js/site.js`
y `assets/js/case.js`; no hay sistema de plantillas externo.

## Desarrollo local

Cualquier servidor estático sirve. Por ejemplo:

```bash
python -m http.server 8090
# http://127.0.0.1:8090/
```

No hay instalación ni compilación. Para regenerar las capturas se usa Chrome headless
con Puppeteer, en un directorio temporal fuera del repositorio.

## Proyectos mostrados

| Proyecto | Enlace | Descripción |
| --- | --- | --- |
| Outbox | [caso de estudio](./work/outbox.html) · [demo](https://laloaleman18.github.io/outbox-offline/) · [código](https://github.com/LaloAleman18/outbox-offline) | PWA offline con IndexedDB, patrón Outbox y Background Sync |
| Terra | [demo](./labs/terra/) | Dashboard con series SVG, filtros, orden y exportación CSV |
| Rift | [juego](./labs/rift/) | Arcade procedural en canvas con audio sintetizado |
| Lex | [herramienta](./labs/lex/) | Generación de tipos TypeScript, CSV y tabla desde JSON |
| TaskFlow API | [código](./proyectos/taskflow-api/) | API REST con Node, Express y persistencia en JSON |
| Notas PWA | [demo](./proyectos/notas-pwa/) | Notas offline con IndexedDB, outbox y Background Sync |

Solo se muestran proyectos propios que se pueden defender en una entrevista.

## Publicación

El repositorio se llama `LaloAleman18.github.io` y publica la rama `main` desde la raíz.
El `.nojekyll` evita que GitHub Pages ignore archivos especiales.

```bash
git push origin main
```

## Contacto

GitHub: [https://github.com/LaloAleman18](https://github.com/LaloAleman18)

---

*Portfolio — José Eduardo Casarrubias Aleman, 2026.*
