/* Clima MX — consume la API pública de Open-Meteo.
   Si la petición falla, se muestra un error: nunca se inventa un clima. */

(function () {
  'use strict';

  var CIUDADES = [
    { nombre: 'Cuernavaca, Mor.', latitud: 18.92, longitud: -99.23 },
    { nombre: 'Ciudad de México', latitud: 19.43, longitud: -99.13 },
    { nombre: 'Guadalajara, Jal.', latitud: 20.67, longitud: -103.35 },
    { nombre: 'Monterrey, N.L.', latitud: 25.67, longitud: -100.31 },
    { nombre: 'Puebla, Pue.', latitud: 19.04, longitud: -98.21 }
  ];

  var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  var CONDICIONES = [
    { codigos: [0], texto: 'Despejado', icono: 'i-sol' },
    { codigos: [1, 2], texto: 'Parcialmente nublado', icono: 'i-nube' },
    { codigos: [3], texto: 'Nublado', icono: 'i-nube' },
    { codigos: [45, 48], texto: 'Niebla', icono: 'i-niebla' },
    { codigos: [51, 53, 55, 56, 57], texto: 'Llovizna', icono: 'i-lluvia' },
    { codigos: [61, 63, 65, 66, 67, 80, 81, 82], texto: 'Lluvia', icono: 'i-lluvia' },
    { codigos: [71, 73, 75, 77, 85, 86], texto: 'Nieve', icono: 'i-nieve' },
    { codigos: [95, 96, 99], texto: 'Tormenta', icono: 'i-tormenta' }
  ];

  var contenedorCiudades = document.getElementById('ciudades');
  var panelCargando = document.getElementById('cargando');
  var panelError = document.getElementById('error');
  var errorTexto = document.getElementById('error-texto');
  var panelClima = document.getElementById('clima');
  var lugar = document.getElementById('lugar');
  var lugarKicker = document.getElementById('lugar-kicker');
  var icono = document.querySelector('#icono use');
  var temperatura = document.getElementById('temperatura');
  var descripcion = document.getElementById('descripcion');
  var sensacion = document.getElementById('sensacion');
  var humedad = document.getElementById('humedad');
  var viento = document.getElementById('viento');
  var actualizacion = document.getElementById('actualizacion');

  var indiceActual = 0;
  var botones = [];

  function condicion(codigo) {
    for (var i = 0; i < CONDICIONES.length; i += 1) {
      if (CONDICIONES[i].codigos.indexOf(codigo) !== -1) return CONDICIONES[i];
    }
    return { texto: 'Condición no identificada', icono: 'i-nube' };
  }

  function numero(valor, decimales) {
    if (typeof valor !== 'number' || !isFinite(valor)) return '—';
    return valor.toFixed(decimales === undefined ? 0 : decimales);
  }

  /* La hora de Open-Meteo ya viene en hora local de la ciudad.
     La armamos como texto para que el navegador no la cambie de zona. */
  function formatearHora(iso) {
    if (!iso || typeof iso !== 'string') return 'hora no disponible';
    var partes = iso.split('T');
    var fecha = (partes[0] || '').split('-');
    var hora = partes[1] || '';
    if (fecha.length !== 3) return iso;
    return Number(fecha[2]) + ' ' + (MESES[Number(fecha[1]) - 1] || '???') + ' ' + fecha[0] + ' · ' + hora;
  }

  function mostrarEstado(cual) {
    panelCargando.hidden = cual !== 'cargando';
    panelError.hidden = cual !== 'error';
    panelClima.hidden = cual !== 'clima';
  }

  /* El fondo reacciona al clima: no es decoración fija, viene del dato. */
  function cielo(codigo) {
    if (codigo === 0 || codigo === 1) return 'radial-gradient(circle at 75% -8%, rgba(255, 186, 105, .30), transparent 55%), #16211f';
    if ([2, 3, 45, 48].indexOf(codigo) !== -1) return 'radial-gradient(circle at 75% -8%, rgba(196, 210, 220, .20), transparent 55%), #121d25';
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].indexOf(codigo) !== -1) return 'radial-gradient(circle at 75% -8%, rgba(70, 140, 205, .32), transparent 58%), #081724';
    if ([71, 73, 75, 77, 85, 86].indexOf(codigo) !== -1) return 'radial-gradient(circle at 75% -8%, rgba(205, 230, 255, .28), transparent 58%), #101d2b';
    if ([95, 96, 99].indexOf(codigo) !== -1) return 'radial-gradient(circle at 75% -8%, rgba(160, 100, 220, .32), transparent 58%), #0b1020';
    return 'radial-gradient(circle at 75% -8%, rgba(127, 200, 194, .18), transparent 52%), #0c1b24';
  }

  function pintarClima(ciudad, actual) {
    var cond = condicion(actual.weather_code);
    document.body.style.setProperty('--cielo', cielo(actual.weather_code));

    lugar.textContent = ciudad.nombre;
    lugarKicker.textContent = 'Clima actual · ' + ciudad.nombre;
    icono.setAttribute('href', '#' + cond.icono);
    temperatura.textContent = numero(actual.temperature_2m, 0) + '°';
    descripcion.textContent = cond.texto;
    sensacion.textContent = numero(actual.apparent_temperature, 0) + '°';
    humedad.textContent = numero(actual.relative_humidity_2m, 0) + '%';
    viento.textContent = numero(actual.wind_speed_10m, 0) + ' km/h';
    actualizacion.textContent = 'Actualizado: ' + formatearHora(actual.time);

    mostrarEstado('clima');
  }

  function mostrarError(mensaje) {
    errorTexto.textContent = mensaje;
    mostrarEstado('error');
  }

  function urlDe(ciudad) {
    var params = [
      'latitude=' + ciudad.latitud,
      'longitude=' + ciudad.longitud,
      'current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
      'timezone=auto'
    ];
    return 'https://api.open-meteo.com/v1/forecast?' + params.join('&');
  }

  function cargar(indice) {
    indiceActual = indice;
    botones.forEach(function (boton, i) {
      boton.classList.toggle('activa', i === indice);
      boton.setAttribute('aria-pressed', i === indice ? 'true' : 'false');
    });

    mostrarEstado('cargando');

    fetch(urlDe(CIUDADES[indice]), { cache: 'no-store' })
      .then(function (respuesta) {
        if (!respuesta.ok) throw new Error('HTTP ' + respuesta.status);
        return respuesta.json();
      })
      .then(function (datos) {
        if (!datos || !datos.current || typeof datos.current.temperature_2m !== 'number') {
          throw new Error('Respuesta inesperada');
        }
        pintarClima(CIUDADES[indice], datos.current);
      })
      .catch(function (error) {
        console.warn('No se pudo consultar el clima:', error.message);
        mostrarError('No se pudo consultar el clima. Revisa tu conexión a internet e inténtalo de nuevo. No se muestra ningún dato inventado.');
      });
  }

  function construirBotones() {
    CIUDADES.forEach(function (ciudad, indice) {
      var boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'ciudad';
      boton.textContent = ciudad.nombre;
      boton.setAttribute('aria-pressed', 'false');
      boton.addEventListener('click', function () { cargar(indice); });
      contenedorCiudades.appendChild(boton);
      botones.push(boton);
    });
  }

  construirBotones();
  cargar(indiceActual);
})();
