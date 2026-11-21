# Clima MX

Aplicación que muestra el **clima real** de cinco ciudades mexicanas usando la
API pública de Open-Meteo. Sin clave de API ni librerías.

> Proyecto personal de José Eduardo Casarrubias Aleman.

## Qué demuestra

- Consumo de una API REST con `fetch`.
- Manejo de tres estados: cargando, datos obtenidos y error.
- Conversión de códigos de clima (WMO) a descripciones en español e iconos SVG.
- Diseño responsivo para celular y computadora.
- Regla estricta: si la API falla, se muestra el error. Nunca se inventan datos.

## Cómo se corre

```bash
cd proyectos/clima-mx
python -m http.server 8080
```

Abre <http://127.0.0.1:8080/>. Necesitas internet para consultar el clima.

También está publicado en
<https://laloaleman18.github.io/proyectos/clima-mx/>.

## Ciudades

- Cuernavaca, Mor. (18.92, -99.23)
- Ciudad de México (19.43, -99.13)
- Guadalajara, Jal. (20.67, -103.35)
- Monterrey, N.L. (25.67, -100.31)
- Puebla, Pue. (19.04, -98.21)

## Cómo probarla

1. Al abrir, debe aparecer “Cargando...” y después el clima de Cuernavaca.
2. Cambia de ciudad con los botones: cada consulta trae datos distintos.
3. Revisa temperatura, descripción, sensación térmica, humedad, viento y hora
   de actualización.
4. Desactiva tu internet y cambia de ciudad: debe aparecer el mensaje de error.
   No debe dibujar un clima falso.
5. Reactiva el internet y vuelve a intentar: los datos regresan.

## ¿Qué es una API REST y qué hace fetch?

Una API REST es un servidor que responde peticiones HTTP con datos, normalmente
en JSON. `fetch` es la función del navegador que hace esa petición:

```js
fetch(url).then(respuesta => respuesta.json()).then(datos => { /* usar datos */ })
```

Aquí la URL incluye latitud, longitud y los campos que queremos:

```
https://api.open-meteo.com/v1/forecast
  ?latitude=18.92
  &longitude=-99.23
  &current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m
  &timezone=auto
```

`timezone=auto` hace que la hora devuelta corresponda a la ciudad consultada.

## Archivos

```text
proyectos/clima-mx/
├── index.html    Interfaz, estilos e iconos SVG
├── app.js        Ciudades, fetch, estados y traducción de códigos
└── README.md
```

## Nota honesta

Open-Meteo es un servicio público de prueba con límites de uso. Si no hay red o
el servicio falla, la app lo dice en pantalla.
