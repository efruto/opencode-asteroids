# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Incluye power-ups especiales (velocidad x2 y triple shot), escudo de un golpe, tipos de asteroides únicos como la estrella fugaz y 6 pieles seleccionables para la nave.

## Tecnologías

- **HTML5 Canvas** — renderizado 2D
- **JavaScript (ES6+)** — lógica del juego en un solo archivo `game.js`
- Sin frameworks, sin bundler, sin dependencias

## Cómo correr

Abre `index.html` directamente en el navegador (doble clic), o usa un servidor local:

```bash
npx serve .
```

Luego visita `http://localhost:3000`.

## Controles

| Tecla     | Acción       |
| --------- | ------------ |
| `←` `→`   | Rotar nave   |
| `↑`       | Propulsar    |
| `Espacio` | Disparar     |
| `S`       | Piel de nave |

## Puntuación

| Asteroide    | Puntos |
| ------------ | ------ |
| Grande       | 20     |
| Mediano      | 50     |
| Pequeño      | 100    |
| Estrella fugaz | 250  |

## Power-ups

Cada asteroide destruido tira un dado que puede soltar un ícono: 12% de velocidad, 12% de triple shot y 76% nada. Los ícones desaparecen solos a los 15 segundos de aparecer (parpadean en los últimos 3).

- **Velocidad x2** — ícono de chevrones azules. Al tocarlo la nave se mueve el doble de rápido (empuje e inercia) durante 5 segundos.
- **Triple shot** — ícono de tres barras magenta. Al tocarlo la nave dispara 3 balas en línea recta durante 5 segundos.

Recoger el mismo bonus renueva su contador, y los dos pueden estar activos al mismo tiempo (cada uno con su fila y su barra de progreso en el HUD). Si la nave se destruye, los dos se cancelan.

## Triple shot

Durante 5 segundos cada disparo lanza 3 balas con el mismo ángulo, separadas 6 px sobre la normal a la dirección de tiro (-6 px, 0, +6 px), así que viajan paralelas y cubren tres carriles a la vez. La cadencia no cambia: el bonus multiplica el daño por disparo, no la cantidad de disparos por segundo.

## Escudo

La nave arranca con una burbuja de escudo que absorbe **un** impacto, dibujada con el mismo aura circular translúcida y pulsante que el power-up de velocidad (concéntrica y por fuera de ella, radio 26 contra 18). Cuando un asteroide choca contra ella, el asteroide estalla pero sin sumar puntos ni partirse en fragmentos, y la burbuja se rompe: la nave queda desprotegida y vulnerable hasta que el escudo se levante solo a los 8 segundos (contador `ESCUDO` con barra de progreso en el HUD). Mientras está rota, cualquier otro impacto mata a la nave. Al reaparecer tras perder una vida, el escudo vuelve a estar activo.

## Pieles de nave

La tecla `S` abre un menú que pausa la partida y muestra la silueta elegida en grande. Se navega con `←` `→` (da vuelta en los extremos) y se sale con `Espacio`, `Enter` o `Esc`: la selección se aplica en el momento y se guarda en el navegador, así que sigue ahí al recargar la página. También se puede abrir desde el `GAME OVER`.

Hay 6 pieles, todas disponibles desde el inicio y sin cambiar nada del comportamiento de la nave (radio de colisión, velocidad, invulnerabilidad): solo cambian el dibujo.

| Piel         | Color     | Silueta                          |
| ------------ | --------- | -------------------------------- |
| Clásica      | Blanco    | Triángulo con muesca trasera (la original) |
| Delta        | Blanco    | Triángulo alargado y angosto     |
| Caza         | Blanco    | Alas en flecha hacia atrás        |
| Manta        | Violeta   | Rombo sin muesca                 |
| Interceptor  | Rojo      | Cuerpo corto en rombo            |
| Cápsula      | Blanco    | Polígono octogonal               |

La llama del propulsor, el punto del que salen las balas y los íconos de vida se ajustan solos a cada silueta. Durante los power-ups la nave se dibuja toda en el color del bonus (azul o magenta), así que el color propio de la piel no se ve.

## Estrella fugaz

Asteroide amarillo de tamaño pequeño que vuela a 240 px/s (los normales van entre 32 y 85 px/s). Cada asteroide destruido tiene un 7% de probabilidad de soltarla en el lugar del impacto, y nunca hay más de una en pantalla. Vale 250 puntos, no se parte al destruirla, choca con la nave como un asteroide normal y desaparece sola a los 10 segundos: parpadea en los últimos 3 y se desvanece al expirar.

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Escudo de un golpe que bloquea un impacto y se recarga solo a los 8 s
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- Power-up de velocidad x2 con contador en el HUD
- Power-up de triple shot: 3 balas paralelas por disparo
- Estrella fugaz: premio veloz y limitado en el tiempo
- 6 pieles de nave seleccionables y persistentes (tecla `S`)
