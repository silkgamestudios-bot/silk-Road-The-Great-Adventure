# Silk Road · cierre y unificación

## Archivos
- **silk-road_FINAL.html** — juego completo para lanzar. `BETA=false` (sin regalos de prueba) y `TEST_CAP=0` (carga real: 20 al inicio, sube con mejoras).
- **silk-road_FINAL_BETA.html** — el mismo juego con `BETA=true` (+50M 🪙, nivel 20 y lazos de prueba) y carga fija en 1200, como lo venías probando.
- **silk-road-online.zip** — servidor (Render) + cliente (Netlify) ya unificado con el juego FINAL. Pasos en su README.

## Qué trae el juego
- **HUD limpio y sin tutoriales**: arriba a la izquierda solo nivel, barra de vida, y MP y energía únicamente cuando no están llenas, más oro y carga (sin números en las barras ni panel; el panel pasó de 275×110 a 112×42 px). XP como una línea fina arriba. Botones de arriba a la derecha más pequeños, reloj sin marco y minimapa más chico. Tutoriales eliminados (lista vacía, sin objetivos ni flechas guía). Los datos de XP por hora y fps solo se ven con `?debug` al final de la dirección.
- **Bestiario de cuevas**: hormigas, arañas y escarabajos negros/verdes/rojos (el color define vida y nivel), reinas guardianas y reparto por tramo de distancia. 17 mobs con sprites nuevos de DawnLike.
- **Jefes de área (8) y Bosses (6)**: sprites aprobados, tamaños, arenas con ambiente propio, barra de calor (defensa/agotamiento), sanadores y ejército que se llaman en silencio (se interrumpe con daño), personalidad e IA que aprende y se guarda, sin avisos ni telegrafías, recompensa reducida (XP 16% · oro 15%).
- **42 objetos firmados**: 3 por jefe con probabilidades (A común · B raro · C mítico) y atributos en % pequeños y farmeables. Tabla: `atributos-items-jefes.md`.
- **Party cooperativo**: pestaña 👥 Party, invitaciones, rechazo/bloqueo, expulsión, sinergias por clase (6/6 = Legión de la Seda), reparto de XP y oro sin crear oro. Funciona sobre la base de datos compartida (Claude) o sobre el servidor (Netlify/Render).
- **Intro de Halloween**: cementerio, mansión, luna, cuervos, mano saliendo de la tumba, título con goteo y cuenta regresiva. Sale del 10 oct al 2 nov (o con `?halloween`). El evento de juego (24 oct–2 nov: monedas, atuendos, murciélagos) ya existía.
- **Servidor**: mundo compartido con 23 mil enemigos controlados por el servidor, reglas de escritura, identidad por secreto, gemas verificadas con ledger.

## Interruptores (todos al inicio del código correspondiente)
| Qué | Dónde | Valor actual |
|---|---|---|
| Regalos de prueba | `const BETA` | FINAL false · BETA true |
| Carga fija de prueba | `TEST_CAP` | FINAL 0 · BETA 1200 |
| Balance de Bosses | `BTUNE` = {hp, dm 1.35, xp .16, gd .15, floor 1} | `floor:0` apaga el tope de daño por segundo |
| Fechas de la intro | bloque `INTRO DE HALLOWEEN` (final del HTML) | 10 oct – 2 nov |
| Servidor | `CFG` en `server/world.js`, `MASTER_UID` y `GEM_LEGACY` en Render | ver README |

## Qué se probó
- Navegador real (Chromium): intro en dos tamaños, partida nueva, jefe de área con despertar, guardias, calor, llamado de ayuda, 2 sanadores y soldados con personalidad, pestañas Jefes y Party, sin errores de página.
- Servidor: ver y pelear con otros jugadores, muerte de enemigo, reparto en party, rechazo de teletransporte, gemas (inflar y autoconcederse → rechazado).
- Cliente real contra el servidor: se une al mundo, congela la IA local, el servidor mata y reparte (XP 0→3 en la prueba).

## Pendiente real (nada oculto)
1. **Jefes y Bosses siguen siendo locales**: cada jugador pelea su propia copia; el cooperativo real contra el mismo Boss exige moverlos al servidor.
2. **Dificultad sin calibrar con datos reales**: usa el aviso de duración y daño medio al morir un jefe y ajusta `BTUNE`.
3. **Gastar recursos en las peleas** (desgaste extra, pociones) no está hecho.
4. **No se desplegó** en Render ni Netlify; la party entre dos jugadores reales no se probó fuera de las pruebas del servidor.
5. **La vida del jugador sigue en el cliente** (el servidor envía el daño, no lo valida); reglas `offers` y `loot` abiertas.
6. **DawnLike**: los créditos ya lo citan (CC-BY 4.0), pero su autor pide además esconder el sprite "Platino" en el juego.
7. El sprite del **Rey Liche** parece más un demonio oscuro que un liche.
