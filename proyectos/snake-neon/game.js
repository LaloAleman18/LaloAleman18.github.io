/* Snake Neón — juego en Canvas 2D, sin librerías.
   Bucle: cada N milisegundos avanza la serpiente una celda y se redibuja.
   Colisiones: paredes, cuerpo propio y comida. */

(function () {
  'use strict';

  var canvas = document.getElementById('juego');
  var ctx = canvas.getContext('2d');
  var GRID = 20;
  var CELDA = canvas.width / GRID;
  var CLAVE_RECORD = 'snake-neon-record';

  var puntosEl = document.getElementById('puntos');
  var nivelEl = document.getElementById('nivel');
  var recordEl = document.getElementById('record');
  var overlay = document.getElementById('overlay');
  var overlayMarca = document.getElementById('overlay-marca');
  var overlayTitulo = document.getElementById('overlay-titulo');
  var overlayTexto = document.getElementById('overlay-texto');
  var overlayRecord = document.getElementById('overlay-record');
  var botonJugar = document.getElementById('jugar');
  var botonPausa = document.getElementById('pausa');

  var VECTORES = {
    arriba: { x: 0, y: -1 },
    abajo: { x: 0, y: 1 },
    izquierda: { x: -1, y: 0 },
    derecha: { x: 1, y: 0 }
  };

  var juego = {
    serpiente: [],
    direccion: VECTORES.derecha,
    colaDirecciones: [],
    comida: null,
    puntos: 0,
    nivel: 1,
    velocidad: 150,
    record: 0,
    modo: 'inicio',
    acumulado: 0,
    ultimo: 0,
    animacion: null
  };

  function leerRecord() {
    try {
      var valor = Number(localStorage.getItem(CLAVE_RECORD));
      return isFinite(valor) && valor > 0 ? valor : 0;
    } catch (error) {
      return 0;
    }
  }

  function guardarRecord(valor) {
    try { localStorage.setItem(CLAVE_RECORD, String(valor)); } catch (error) { /* modo privado */ }
  }

  function mismoLugar(a, b) {
    return !!a && !!b && a.x === b.x && a.y === b.y;
  }

  function generarComida() {
    var libres = [];
    for (var y = 0; y < GRID; y += 1) {
      for (var x = 0; x < GRID; x += 1) {
        var ocupada = juego.serpiente.some(function (parte) { return parte.x === x && parte.y === y; });
        if (!ocupada) libres.push({ x: x, y: y });
      }
    }
    if (libres.length === 0) return null;
    return libres[Math.floor(Math.random() * libres.length)];
  }

  function actualizarMarcador() {
    puntosEl.textContent = String(juego.puntos);
    nivelEl.textContent = String(juego.nivel);
    recordEl.textContent = String(juego.record);
  }

  function mostrarOverlay(marca, titulo, texto, record) {
    overlayMarca.textContent = marca;
    overlayTitulo.textContent = titulo;
    overlayTexto.innerHTML = texto;
    overlayRecord.hidden = !record;
    if (record) overlayRecord.textContent = record;
    overlay.hidden = false;
  }

  function empezar() {
    if (juego.animacion) cancelAnimationFrame(juego.animacion);

    var centro = Math.floor(GRID / 2);
    juego.serpiente = [
      { x: centro, y: centro },
      { x: centro - 1, y: centro },
      { x: centro - 2, y: centro },
      { x: centro - 3, y: centro }
    ];
    juego.direccion = VECTORES.derecha;
    juego.colaDirecciones = [];
    juego.puntos = 0;
    juego.nivel = 1;
    juego.velocidad = 150;
    juego.acumulado = 0;
    juego.comida = generarComida();
    juego.modo = 'jugando';
    juego.record = leerRecord();

    overlay.hidden = true;
    actualizarMarcador();
    dibujar();

    juego.ultimo = performance.now();
    juego.animacion = requestAnimationFrame(bucle);
  }

  function pausar() {
    if (juego.modo !== 'jugando') return;
    juego.modo = 'pausa';
    if (juego.animacion) cancelAnimationFrame(juego.animacion);
    juego.animacion = null;
    mostrarOverlay('En pausa', 'Pausa', 'Pulsa <strong>Pausa</strong> otra vez para continuar.', '');
  }

  function reanudar() {
    if (juego.modo !== 'pausa') return;
    juego.modo = 'jugando';
    overlay.hidden = true;
    juego.ultimo = performance.now();
    juego.animacion = requestAnimationFrame(bucle);
  }

  function terminar() {
    juego.modo = 'fin';
    if (juego.animacion) cancelAnimationFrame(juego.animacion);
    juego.animacion = null;

    var esRecord = juego.puntos > juego.record;
    if (esRecord) {
      juego.record = juego.puntos;
      guardarRecord(juego.record);
      actualizarMarcador();
    }

    mostrarOverlay(
      'Fin del juego',
      esRecord ? '¡Nuevo récord!' : 'Fin del juego',
      'Obtuviste <strong>' + juego.puntos + ' puntos</strong> en el nivel ' + juego.nivel + '.<br>Pulsa <strong>Jugar</strong> para intentarlo otra vez.',
      esRecord ? 'Récord: ' + juego.record + ' puntos' : 'Récord actual: ' + juego.record + ' puntos'
    );
  }

  function cambiarDireccion(nombre) {
    var vector = VECTORES[nombre];
    if (!vector || juego.modo !== 'jugando') return;

    var ultima = juego.colaDirecciones.length
      ? juego.colaDirecciones[juego.colaDirecciones.length - 1]
      : juego.direccion;

    if (vector.x === -ultima.x && vector.y === -ultima.y) return;
    if (vector.x === ultima.x && vector.y === ultima.y) return;
    if (juego.colaDirecciones.length < 2) juego.colaDirecciones.push(vector);
  }

  function paso() {
    if (juego.colaDirecciones.length) juego.direccion = juego.colaDirecciones.shift();

    var cabeza = juego.serpiente[0];
    var nueva = { x: cabeza.x + juego.direccion.x, y: cabeza.y + juego.direccion.y };

    var fuera = nueva.x < 0 || nueva.x >= GRID || nueva.y < 0 || nueva.y >= GRID;
    if (fuera) { terminar(); return; }

    var vaAComer = mismoLugar(nueva, juego.comida);
    var cuerpo = vaAComer ? juego.serpiente : juego.serpiente.slice(0, -1);
    var choco = cuerpo.some(function (parte) { return parte.x === nueva.x && parte.y === nueva.y; });
    if (choco) { terminar(); return; }

    juego.serpiente.unshift(nueva);

    if (vaAComer) {
      juego.puntos += 10;
      if (juego.puntos % 50 === 0) {
        juego.nivel += 1;
        juego.velocidad = Math.max(70, juego.velocidad - 18);
      }
      if (juego.puntos > juego.record) {
        juego.record = juego.puntos;
        guardarRecord(juego.record);
      }
      actualizarMarcador();
      juego.comida = generarComida();
      if (!juego.comida) { terminar(); return; }
    } else {
      juego.serpiente.pop();
    }
  }

  function dibujar() {
    ctx.fillStyle = '#05040d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(154, 107, 255, .09)';
    ctx.lineWidth = 1;
    for (var i = 1; i < GRID; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * CELDA + .5, 0);
      ctx.lineTo(i * CELDA + .5, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELDA + .5);
      ctx.lineTo(canvas.width, i * CELDA + .5);
      ctx.stroke();
    }

    if (juego.comida) {
      var pulso = 1 + Math.sin(performance.now() / 220) * .12;
      var radio = (CELDA / 2 - 4) * pulso;
      var cx = juego.comida.x * CELDA + CELDA / 2;
      var cy = juego.comida.y * CELDA + CELDA / 2;
      ctx.save();
      ctx.shadowColor = '#ff4fa3';
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#ff4fa3';
      ctx.beginPath();
      ctx.arc(cx, cy, radio, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    juego.serpiente.forEach(function (parte, indice) {
      var x = parte.x * CELDA + 2;
      var y = parte.y * CELDA + 2;
      var tam = CELDA - 4;
      var esCabeza = indice === 0;

      ctx.save();
      ctx.shadowColor = esCabeza ? '#35f0c0' : '#9a6bff';
      ctx.shadowBlur = esCabeza ? 18 : 10;
      ctx.fillStyle = esCabeza
        ? '#35f0c0'
        : 'rgba(154, 107, 255, ' + Math.max(.3, .9 - indice * .035) + ')';

      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x, y, tam, tam, esCabeza ? 6 : 4);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, tam, tam);
      }
      ctx.restore();
    });
  }

  function bucle(tiempo) {
    if (juego.modo !== 'jugando') return;

    juego.acumulado += tiempo - juego.ultimo;
    juego.ultimo = tiempo;

    if (juego.acumulado >= juego.velocidad) {
      juego.acumulado = 0;
      paso();
    }

    dibujar();
    if (juego.modo === 'jugando') juego.animacion = requestAnimationFrame(bucle);
  }

  botonJugar.addEventListener('click', empezar);
  botonPausa.addEventListener('click', function () {
    if (juego.modo === 'jugando') pausar();
    else if (juego.modo === 'pausa') reanudar();
  });

  document.querySelectorAll('[data-direccion]').forEach(function (boton) {
    boton.addEventListener('click', function () {
      cambiarDireccion(boton.getAttribute('data-direccion'));
      boton.classList.add('activo');
      setTimeout(function () { boton.classList.remove('activo'); }, 120);
    });
  });

  var TECLAS = {
    ArrowUp: 'arriba', KeyW: 'arriba',
    ArrowDown: 'abajo', KeyS: 'abajo',
    ArrowLeft: 'izquierda', KeyA: 'izquierda',
    ArrowRight: 'derecha', KeyD: 'derecha'
  };

  document.addEventListener('keydown', function (evento) {
    var nombre = TECLAS[evento.code];
    if (!nombre) return;
    evento.preventDefault();
    cambiarDireccion(nombre);
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) pausar();
  });

  juego.record = leerRecord();
  actualizarMarcador();
  dibujar();
})();
