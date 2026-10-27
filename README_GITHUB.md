# Sprite Road v3.35 — Spider Material Economy

Proyecto optimizado para subir a GitHub y desplegar en Render.

## Qué se limpió
- Se excluyó `v332_audit/`, una copia histórica de archivos del proyecto que duplicaba gran parte de la versión principal.
- Se conservaron los archivos de la raíz, incluidos `play.html`, `index.html`, `server.js`, `package.json`, recursos gráficos, audio y datos del mundo.
- No se combinaron ni reescribieron los scripts del juego.

## Despliegue en Render
- Tipo: Web Service
- Build command: `npm install`
- Start command: `npm start`
- Requiere Node.js 18 o superior.

## Importante
El juego usa un servidor Node.js (`server.js` y la dependencia `ws`), por lo que GitHub almacena el código, pero GitHub Pages por sí solo no ejecuta ese servidor. Para la versión completa con servidor, usa Render u otro hosting Node.js.
