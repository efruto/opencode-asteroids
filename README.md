# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Incluye power-ups especiales y tipos de asteroides únicos como la estrella fugaz.

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

| Tecla     | Acción     |
| --------- | ---------- |
| `←` `→`   | Rotar nave |
| `↑`       | Propulsar  |
| `Espacio` | Disparar   |

## Puntuación

| Asteroide    | Puntos |
| ------------ | ------ |
| Grande       | 20     |
| Mediano      | 50     |
| Pequeño      | 100    |
| Estrella fugaz | 250  |

## Power-ups

Cada asteroide destruido tiene un 12% de probabilidad de soltar un ícono de velocidad. Al tocarlo, la nave se mueve el doble de rápido (empuje e inercia) durante 5 segundos; recoger otro renueva el contador. El ícono desaparece solo a los 15 segundos de aparecer.

## Estrella fugaz

Asteroide amarillo de tamaño pequeño que vuela a 240 px/s (los normales van entre 32 y 85 px/s). Cada asteroide destruido tiene un 7% de probabilidad de soltarla en el lugar del impacto, y nunca hay más de una en pantalla. Vale 250 puntos, no se parte al destruirla, choca con la nave como un asteroide normal y desaparece sola a los 10 segundos: parpadea en los últimos 3 y se desvanece al expirar.

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- Power-up de velocidad x2 con contador en el HUD
- Estrella fugaz: premio veloz y limitado en el tiempo
