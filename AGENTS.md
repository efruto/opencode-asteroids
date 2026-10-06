# AGENTS.md

Juego completo en `index.html` + `game.js` (~830 líneas, todo el juego) + `favicon.svg`. Sin assets externos.

## Tooling

- **No hay** `package.json`, bundler, dependencias, tests, lint, formato ni CI. Nada que instalar ni compilar.
- Correr: abrir `index.html` en el navegador, o `npx serve .` → http://localhost:3000.
- Verificación = manual: recargar y mirar la consola. Un error de referencia o sintaxis truena al cargar, antes de que se vea nada en pantalla.
- `index.html:24` carga `game.js` como `<script>` **clásico**: no hay `import`/`export` y todo vive en el scope global. Si partís el código en varios archivos, cambiá el tag a `type="module"`.

## Arquitectura de `game.js`

- **Estado global mutable**, sin gestor: `ship`, `bullets`, `asteroids`, `particles`, `score`, `lives`, `level`, `state`, `deadTimer`, `skinIndex` (`game.js:510`, `game.js:283`). `initGame()` inicializa y `loop()` (rAF, `dt` en segundos, clamp a 0.05) hace `update(dt)` → `draw()`.
- **Escudo**: no es entidad, es estado de la nave (`ship.shieldCooldown`, `0` = activa). `Ship.reset()` lo deja activo de nuevo, así que reaparecer con burbuja es intencional. Se dibuja con `drawAura()`, el mismo helper que las auras de los power-ups; solo cambian radio (26 vs 18) y color, y quedan concéntricos.
- **Power-ups con `kind`**: `rollPowerUp()` (`game.js:193`) tira un solo dado por asteroide destruido (12% velocidad, 12% triple, 76% nada). `PowerUp` guarda `kind` (`'speed' | 'triple'`) y `activate(ship)` despacha a `ship.activateSpeed()`/`activateTriple()`; ambos timers viven en la nave, pueden coexistir y `killShip()` los cancela. Sus contadores del HUD van apilados vía `drawMeter()` (`46 + i*24`), con el de `ESCUDO` en `46 + bonuses.length*24` para no solaparse.
- **Máquina de estados**: `'playing' | 'dead' | 'gameover' | 'skins'`. En `gameover`, `Space` → `initGame()` y `S` → menú de pieles. En `dead` corre `deadTimer = 2` y después `ship.reset()`. Los tres estados hacen `return` temprano en `update()`: si agregás lógica de juego, va después de esas salidas. **`'skins'` se chequea primero** (`game.js:569`) y pausa todo: el menú solo lee input y devuelve, así que el `dt` no se acumula y no hay salto al salir.
- **Pieles de nave**: tabla `SKINS` (`game.js:274`) de datos puros, `{ id, name, color, hull }`; `hull` son vértices en px con **+x mirando al morro**. El resto (`nose`, `tail`, `iconScale`) se deriva una sola vez en un `for` al cargar (`game.js:286`). `Ship.draw()`, `drawLifeIcon()` y el preview del menú dibujan todos vía `drawHull(skin, scale, color, width)` / `drawFlame(skin, scale, len)`, que hacen su propio `ctx.scale()` y compensan el `lineWidth` dividiéndolo por `scale` para que el borde no engorde. Para agregar una piel: **una línea en `SKINS`**, nada más.
- **Convención de entidades** (obligatoria para cualquier entidad nueva): constructor con posición → `update(dt)` → `draw()` → flag `this.dead`. Nada se borra durante el update; cada frame hace `arr = arr.filter(e => !e.dead)` al final de la sección correspondiente.
- **Variantes de entidad por subclass**: `PowerUp` y `ShootingStar` son clases propias; `ShootingStar extends Asteroid` (tamaño 1, `this.shooting = true`) y vive **dentro de `asteroids`**, así que las colisiones y el fin de nivel la tratan como un asteroide más. El polígono de `Asteroid` está en `drawBody(color)` para que las subclases reutilicen el path.
- **Puntos por entidad**: `Asteroid` guarda `this.points = POINTS[size]` y la colisión suma `a.points` (`game.js`), no `POINTS[a.size]` — así una subclase puede cambiar su valor (`ShootingStar` = 250).
- **Colisiones por distancia de centro**, sin hitbox: `dist(a, b) < radio`. Nave vs asteroide escala el radio del asteroide (`a.radius * 0.82`, `game.js:652`).
- **Espacio toroidal**: `wrap(v, max)` sobre x/y en Bullet, Asteroid y Ship. `Particle` **no** usa wrap, a propósito.
- Colisión bala/asteroide: se acumulan los fragmentos en `newAsteroids` y se concatenan **después** del filtro, para no mutar el array mientras se itera (`game.js:616`). No iteres `asteroids` ni agregues entities durante un `for` sobre esos arrays.
- Orden de dibujo: partículas → asteroides → balas → nave → HUD → overlay. `Ship.draw()` hace early-return si está muerta o parpadea por invencibilidad.

## Trampas específicas

- **`pressed(code)` es consume-once** (`game.js:20`): lee `justPressed[code]` y lo pone en `false`. Llamalo **una sola vez por frame**. Si un early-return o un debug log lo leen dos veces, ese input se pierde para el resto del frame.
- **Nunca leas dos teclas con `||` en un `if`** (`pressed('Space') || pressed('Escape')`): con cortocircuito la segunda no se consume cuando la primera da true, y el `true` pendiente queda como un input fantasma. Guardá los dos en variables primero.
- **Una tecla nunca leída queda trabada en `true`**: `justPressed` solo se limpia cuando alguien la lee. Si el menú lee `Escape` y el juego no, un `Esc` apretado jugando cierra el menú en el frame en que se abre. `openSkinMenu()` (`game.js:343`) limpia a mano las teclas del menú por eso.
- **`Ship.reset()` no toca la skin**: se llama al reaparecer, en `nextLevel()` y en cada `initGame()`. `skinIndex` es un global aparte que tiene que sobrevivir las tres.
- **Tablas de tamaño indexadas**: `RADII`/`SPEEDS`/`POINTS` (`game.js:61`) empiezan con un `0` dummy; los tamaños reales son `1 | 2 | 3`. `POINTS = [0, 100, 50, 20]` → grande 20, mediano 50, pequeño 100.
- `nextLevel()` incrementa `level` **antes** de generar: `spawnAsteroids(3 + level)` deja 4 → 5 → 6…
- El polígono del asteroide usa `this.radius * rand(0.6, 1.0)`, o sea que los hijos ya salen más chicos por el tamaño, además de por `size - 1`.
- `W`/`H` están duplicados: constantes en `game.js:5` y atributos `width`/`height` del canvas (`index.html:23`). Cambiar el tamaño implica tocar ambos.
- La distancia segura de spawn (`130`) se mide contra el centro del canvas, que es donde reaparece la nave (`Ship.reset()`), así que no la muevas sin revisar ambas cosas.
- **El filtro de `asteroids` va antes de la colisión nave/asteroide**: el de la sección "Bala vs asteroide" ya corrió para cuando llegás a la colisión con la nave. Si ahí marcás un asteroide como `dead` (lo hace el escudo al bloquear un impacto) hay que volver a filtrar, o el frame que viene colisiona otra vez con el escudo ya caído y te mata.

## Input

- `keys` está indexado por **`e.code`**, no `e.key`: `'ArrowLeft'`, `'ArrowRight'`, `'ArrowUp'`, `'Space'`, `'KeyS'`.
- `preventDefault` solo se aplica a Space y flechas; el resto de teclas pasa al navegador.

## README al día

`README.md` coincide con el código: power-up de velocidad y de triple shot (un dado por asteroide destruido: 12% cada uno), escudo de un golpe con recarga a los 8 s, estrella fugaz (`ShootingStar`, 7% por asteroide destruido) y 6 pieles de nave seleccionables con `S`. Ojo: la estrella cuenta como asteroide para el fin de nivel (`asteroids.length === 0`), así que si queda viva el nivel no avanza hasta que expire su TTL.

## Verificación sin navegador

Como no hay tooling, los cambios de lógica se pueden probar con `node` sin agregar nada al repo: correr `game.js` dentro de `vm.runInContext` con un `ctx` stub (un `Proxy` que devuelve no-ops y registra cada llamada), un `window` con `addEventListener` capturado para simular teclado, y un `localStorage` falso. Los `let`/`const` del scope global no quedan en `globalThis`, así que hay que pegarle un epílogo al source que exponga getters (`get state() { return state }`) para poder inspeccionarlos y disparar teclas. Sirvió para verificar el menú de pieles entero: wrap de la lista, pausa, ida y vuelta desde `gameover`, y que la skin sobreviva a `initGame()`/`nextLevel()`/`killShip()`.

## Idioma

Identificadores y clases en inglés (`Bullet`, `Asteroid`, `Ship`, `Particle`, `update`, `draw`, `dead`, `wrap`/`dist`/`rand`/`randInt`), pero **comentarios, HUD y overlays en español** (`SCORE`, `NIVEL`, `GAME OVER`, `PUNTAJE`, y los banners de `── Section ──`). Mantené esa mezcla: código en inglés, todo texto visible al usuario en español.