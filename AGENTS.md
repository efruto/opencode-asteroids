# AGENTS.md

Juego completo en `index.html` + `game.js` (~420 líneas, todo el juego) + `favicon.svg`. Sin assets externos.

## Tooling

- **No hay** `package.json`, bundler, dependencias, tests, lint, formato ni CI. Nada que instalar ni compilar.
- Correr: abrir `index.html` en el navegador, o `npx serve .` → http://localhost:3000.
- Verificación = manual: recargar y mirar la consola. Un error de referencia o sintaxis truena al cargar, antes de que se vea nada en pantalla.
- `index.html:24` carga `game.js` como `<script>` **clásico**: no hay `import`/`export` y todo vive en el scope global. Si partís el código en varios archivos, cambiá el tag a `type="module"`.

## Arquitectura de `game.js`

- **Estado global mutable**, sin gestor: `ship`, `bullets`, `asteroids`, `particles`, `score`, `lives`, `level`, `state`, `deadTimer` (`game.js:239`). `initGame()` inicializa y `loop()` (rAF, `dt` en segundos, clamp a 0.05) hace `update(dt)` → `draw()`.
- **Máquina de estados**: `'playing' | 'dead' | 'gameover'`. En `gameover`, `Space` → `initGame()`. En `dead` corre `deadTimer = 2` y después `ship.reset()`. Los dos estados hacen `return` temprano en `update()`: si agregás lógica de juego, va después de esas salidas.
- **Convención de entidades** (obligatoria para cualquier entidad nueva): constructor con posición → `update(dt)` → `draw()` → flag `this.dead`. Nada se borra durante el update; cada frame hace `arr = arr.filter(e => !e.dead)` al final de la sección correspondiente.
- **Colisiones por distancia de centro**, sin hitbox: `dist(a, b) < radio`. Nave vs asteroide escala el radio del asteroide (`a.radius * 0.82`, `game.js:342`).
- **Espacio toroidal**: `wrap(v, max)` sobre x/y en Bullet, Asteroid y Ship. `Particle` **no** usa wrap, a propósito.
- Colisión bala/asteroide: seAccumulan los fragmentos en `newAsteroids` y se concatenan **después** del filtro, para no mutar el array mientras se itera (`game.js:324`). No iteres `asteroids` ni agregues entities durante un `for` sobre esos arrays.
- Orden de dibujo: partículas → asteroides → balas → nave → HUD → overlay. `Ship.draw()` hace early-return si está muerta o parpadea por invencibilidad.

## Trampas específicas

- **`pressed(code)` es consume-once** (`game.js:20`): lee `justPressed[code]` y lo pone en `false`. Llamalo **una sola vez por frame**. Si un early-return o un debug log lo leen dos veces, ese input se pierde para el resto del frame.
- **Tablas de tamaño indexadas**: `RADII`/`SPEEDS`/`POINTS` (`game.js:61`) empiezan con un `0` dummy; los tamaños reales son `1 | 2 | 3`. `POINTS = [0, 100, 50, 20]` → grande 20, mediano 50, pequeño 100.
- `nextLevel()` incrementa `level` **antes** de generar: `spawnAsteroids(3 + level)` deja 4 → 5 → 6…
- El polígono del asteroide usa `this.radius * rand(0.6, 1.0)`, o sea que los hijos ya salen más chicos por el tamaño, además de por `size - 1`.
- `W`/`H` están duplicados: constantes en `game.js:5` y atributos `width`/`height` del canvas (`index.html:23`). Cambiar el tamaño implica tocar ambos.
- La distancia segura de spawn (`130`) se mide contra el centro del canvas, que es donde reaparece la nave (`Ship.reset()`), así que no la muevas sin revisar ambas cosas.

## Input

- `keys` está indexado por **`e.code`**, no `e.key`: `'ArrowLeft'`, `'ArrowRight'`, `'ArrowUp'`, `'Space'`.
- `preventDefault` solo se aplica a Space y flechas; el resto de teclas pasa al navegador.

## README desactualizado

`README.md` promete **power-ups** y la **estrella fugaz**: no existen en `game.js` (único intento de implementarlos, desactualizado, es el propio README). No asumas que están ni los busques. El resto de README (controles, puntos, 3 vidas con invencibilidad) sí coincide con el código.

## Idioma

Identificadores y clases en inglés (`Bullet`, `Asteroid`, `Ship`, `Particle`, `update`, `draw`, `dead`, `wrap`/`dist`/`rand`/`randInt`), pero **comentarios, HUD y overlays en español** (`SCORE`, `NIVEL`, `GAME OVER`, `PUNTAJE`, y los banners de `── Section ──`). Mantené esa mezcla: código en inglés, todo texto visible al usuario en español.