# Snake Neón

El clásico juego de la serpiente en **Canvas 2D**, con JavaScript vanilla y
cero librerías.

> Proyecto personal de José Eduardo Casarrubias Aleman.

## Qué demuestra

- Bucle de juego con `requestAnimationFrame` y velocidad que aumenta por nivel.
- Colisiones con paredes, con el propio cuerpo y con la comida.
- Control de dirección que prohíbe girar 180°.
- Controles de teclado (flechas o WASD) y botones táctiles en el celular.
- Puntos, nivel y récord guardado en `localStorage`.
- Dibujo en Canvas con cuadrícula, brillos neón y comida pulsante.

## Cómo se corre

```bash
cd proyectos/snake-neon
python -m http.server 8080
```

Abre <http://127.0.0.1:8080/>.

También está publicado en
<https://laloaleman18.github.io/proyectos/snake-neon/>.

## Cómo probarlo

1. Pulsa **Jugar**: la serpiente empieza a moverse sola hacia la derecha.
2. Usa las flechas, WASD o los botones ↑ ← ↓ → para dirigirla.
3. Come comida rosada: sumas 10 puntos y la serpiente crece.
4. Cada 50 puntos subes de nivel y el juego se acelera.
5. Pulsa **Pausa** para detenerlo y otra vez para continuar.
6. Choca con una pared o contigo mismo: aparece “Fin del juego” con tus
   puntos. Si superaste tu marca, celebra el nuevo récord.
7. Recarga la página: el récord sigue ahí porque está en `localStorage`.

## Conceptos en lenguaje sencillo

### Canvas

Es un lienzo donde dibujas con JavaScript. Aquí el canvas mide 480 × 480
píxeles y se divide en 20 × 20 celdas de 24 píxeles. La serpiente y la comida
siempre caen en una celda, como en un tablero.

### Bucle del juego

Es una función que se llama una y otra vez. Calcula cuánto tiempo pasó y, cada
ciertos milisegundos, mueve la serpiente una celda y vuelve a dibujar todo.
Al subir de nivel, ese intervalo es más corto, así que va más rápido.

### Colisiones

Antes de mover la cabeza se revisa tres cosas:

- ¿Salió del tablero? Entonces termina.
- ¿Chocó con su propio cuerpo? Entonces termina.
- ¿Llegó a la comida? Entonces suma puntos y crece (no se quita la cola).

### Récord

`localStorage` guarda el número con la clave `snake-neon-record`. Al terminar,
si tus puntos superan el guardado, se actualiza.

## Archivos

```text
proyectos/snake-neon/
├── index.html    Interfaz, marcador, overlay y estilos
├── game.js       Bucle, colisiones, dibujo y controles
└── README.md
```
