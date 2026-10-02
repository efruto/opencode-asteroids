'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

class Asteroid {
  constructor(x, y, size = 3) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.points = POINTS[size];
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  drawBody(color) {
    ctx.strokeStyle = color;
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    this.drawBody('#fff');
    ctx.restore();
  }
}

// ── Estrella fugaz ─────────────────────────────────────────────────────────────
const SHOOTING_SPEED  = 240;      // px/s (el asteroide normal más rápido va a 85)
const SHOOTING_TTL    = 10;       // segundos en pantalla antes de desaparecer sola
const SHOOTING_POINTS = 250;
const SHOOTING_DROP   = 0.07;     // prob. de soltarla por asteroide destruido
const SHOOTING_COLOR  = '#ffd75c';

// Asteroide de tamaño 1 que vuela rápido y se desvanece solo. No se divide
// (size 1 → Asteroid.split() devuelve []) pero sí mata a la nave.
class ShootingStar extends Asteroid {
  constructor(x, y) {
    super(x, y, 1);
    this.shooting = true;
    this.points = SHOOTING_POINTS;
    this.ttl = SHOOTING_TTL;

    const angle = rand(0, Math.PI * 2);
    const speed = SHOOTING_SPEED + rand(-20, 20);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed *= 2.5;
  }

  update(dt) {
    super.update(dt);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    // Parpadeo antes de expirar
    if (this.ttl < 3 && Math.floor(this.ttl * 8) % 2 === 0) return;

    const angle = Math.atan2(this.vy, this.vx);
    const alpha = Math.min(1, this.ttl / 2);   // desvanecido al final

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.globalAlpha = alpha;

    // Estela en la dirección contraria al movimiento
    ctx.rotate(angle);
    const tail = 26 + Math.sin(this.ttl * 10) * 4;
    ctx.strokeStyle = SHOOTING_COLOR;
    ctx.lineWidth   = 2;
    ctx.lineCap     = 'round';
    ctx.beginPath();
    ctx.moveTo(-this.radius * 0.6, 0);
    ctx.lineTo(-tail, 0);
    ctx.stroke();

    ctx.rotate(this.rot - angle);
    this.drawBody(SHOOTING_COLOR);
    ctx.restore();
  }
}

// ── Power-up (velocidad x2) ───────────────────────────────────────────────────
const POWERUP_DROP   = 0.12;   // prob. de soltar uno por asteroide destruido
const POWERUP_TIME   = 5;      // segundos de efecto al recogerlo
const POWERUP_RADIUS = 10;
const POWERUP_TTL    = 15;     // segundos en pantalla antes de desaparecer solo
const BOOST_COLOR    = '#5cf';

class PowerUp {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.rot = rand(0, Math.PI * 2);
    this.rotSpeed = rand(-1.5, 1.5);
    this.radius = POWERUP_RADIUS;
    this.ttl  = POWERUP_TTL;
    this.dead = false;
  }

  update(dt) {
    this.rot += this.rotSpeed * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    // Parpadeo antes de expirar
    if (this.ttl < 3 && Math.floor(this.ttl * 8) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = BOOST_COLOR;
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    // Chevrons hacia adelante
    ctx.beginPath();
    ctx.moveTo(-4, -4);
    ctx.lineTo( 1,  0);
    ctx.lineTo(-4,  4);
    ctx.moveTo( 1, -4);
    ctx.lineTo( 6,  0);
    ctx.lineTo( 1,  4);
    ctx.stroke();
    ctx.restore();
  }
}

// ── Escudo ─────────────────────────────────────────────────────────────────────
// Burbuja de un solo golpe alrededor de la nave. Al recibir un impacto se rompe,
// el asteroide se hace añicos sin sumar puntos y la nave queda desprotegida
// hasta que el contador llega a 0.
const SHIELD_RADIUS   = 26;   // radio de la burbuja; el aura de velocidad usa 18
const SHIELD_RECHARGE = 8;    // segundos hasta levantarse de nuevo
const SHIELD_COLOR    = '#5ff';

// ── Ship ──────────────────────────────────────────────────────────────────────
class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12;
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.speedTimer    = 0;
    this.shieldCooldown = 0;   // 0 = escudo activo
    this.dead          = false;
  }

  activateSpeed() {
    this.speedTimer = POWERUP_TIME;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.speedTimer    > 0) this.speedTimer    -= dt;
    if (this.shieldCooldown > 0) this.shieldCooldown -= dt;

    const ROT   = 3.5;   // rad/s
    const THRUST = 260;  // px/s²
    const DRAG   = 0.987;
    const MUL    = this.speedTimer > 0 ? 2 : 1;   // power-up de velocidad

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * MUL * dt;
      this.vy += Math.sin(this.angle) * THRUST * MUL * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * MUL * dt, W);
    this.y = wrap(this.y + this.vy * MUL * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = 21;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    return [new Bullet(ox, oy, this.angle)];
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    const boosted = this.speedTimer > 0;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Aura pulsante mientras dura el bonus
    if (boosted) drawAura(18, this.speedTimer * 12, BOOST_COLOR);

    // Aura pulsante del escudo, mismo estilo que la del bonus de velocidad
    if (this.shieldCooldown <= 0) drawAura(SHIELD_RADIUS, performance.now() / 180, SHIELD_COLOR);

    ctx.strokeStyle = boosted ? BOOST_COLOR : '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    // Silueta clásica: triángulo con muesca trasera
    ctx.beginPath();
    ctx.moveTo( 20,  0);   // nariz
    ctx.lineTo(-12, -9);   // ala izquierda
    ctx.lineTo( -7,  0);   // muesca trasera
    ctx.lineTo(-12,  9);   // ala derecha
    ctx.closePath();
    ctx.stroke();

    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      const len = rand(6, 14) * (boosted ? 2 : 1);
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-8 - len, 0);
      ctx.lineTo(-8,  4);
      ctx.strokeStyle = 'rgba(255, 130, 0, 0.85)';
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y) {
    this.x  = x;
    this.y  = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, powerups;
let score, lives, level;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer;

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }
}

function initGame() {
  ship          = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  powerups  = [];
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  powerups  = [];
  ship.reset();
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  ship.speedTimer = 0;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    powerups.forEach(p => p.update(dt));
    powerups = powerups.filter(p => !p.dead);
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  powerups.forEach(p => p.update(dt));
  particles.forEach(p => p.update(dt));

  bullets   = bullets.filter(b => !b.dead);
  powerups  = powerups.filter(p => !p.dead);
  particles = particles.filter(p => !p.dead);

  // Bala vs asteroide
  const newAsteroids = [];
  let spawnedStar = false;
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        score += a.points;
        explode(a.x, a.y, a.size * 5);
        if (Math.random() < POWERUP_DROP) powerups.push(new PowerUp(a.x, a.y));
        // El flag cubre también las estrellas ya encoladas en este frame
        if (!spawnedStar && !asteroids.some(s => s.shooting) && Math.random() < SHOOTING_DROP) {
          spawnedStar = true;
          newAsteroids.push(new ShootingStar(a.x, a.y));
        }
        newAsteroids.push(...a.split());
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Nave vs power-up
  for (const p of powerups) {
    if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
      p.dead = true;
      ship.activateSpeed();
      explode(p.x, p.y, 6);
    }
  }
  powerups = powerups.filter(p => !p.dead);

  // Nave vs asteroide
  if (ship.invincible <= 0) {
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.radius * 0.82) {
        if (ship.shieldCooldown <= 0) {
          // El escudo absorbe el impacto: el asteroide explota sin puntos
          // ni fragmentos, y la nave queda desprotegida mientras se recarga.
          a.dead = true;
          explode(a.x, a.y, a.size * 5);
          ship.shieldCooldown = SHIELD_RECHARGE;
        } else {
          killShip();
        }
        break;
      }
    }
    // Necesario porque el filtro de arriba corre antes de esta colisión: sin
    // esto el asteroide bloqueado vuelve a chocar el próximo frame, ya con el
    // escudo caído, y mata a la nave que acaba de salvar.
    asteroids = asteroids.filter(a => !a.dead);
  }

  // Nivel completado
  if (asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
// Aura circular translúcida que late alrededor del origen del transform actual.
// Compartida por el escudo y el power-up de velocidad para que se vean igual:
// el radio y el color los differentiate, el resto del dibujo es el mismo.
function drawAura(radius, phase, color) {
  ctx.globalAlpha = 0.45;
  ctx.strokeStyle = color;
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, radius + Math.sin(phase) * 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawLifeIcon(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth   = 1.2;
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  ctx.moveTo( 9,  0);
  ctx.lineTo(-6, -5);
  ctx.lineTo(-3,  0);
  ctx.lineTo(-6,  5);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

// Etiqueta con segundos restantes + barra de progreso, centrada arriba
function drawMeter(label, value, total, color, y) {
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.font      = 'bold 15px monospace';
  ctx.fillText(`${label}  ${value.toFixed(1)}s`, W / 2, y);

  const bw = 90, bh = 4, bx = W / 2 - bw / 2, by = y + 8;
  ctx.strokeStyle = color;
  ctx.lineWidth   = 1;
  ctx.strokeRect(bx, by, bw, bh);
  ctx.fillRect(bx + 1, by + 1, (bw - 2) * (value / total), bh - 2);
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

  // Contador del power-up de velocidad
  if (state === 'playing' && ship.speedTimer > 0)
    drawMeter('VELOCIDAD x2', ship.speedTimer, POWERUP_TIME, BOOST_COLOR, 46);

  // Recarga del escudo: solo se muestra cuando está caído
  if (state === 'playing' && ship.shieldCooldown > 0)
    drawMeter('ESCUDO', ship.shieldCooldown, SHIELD_RECHARGE, SHIELD_COLOR, 70);
}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  powerups.forEach(p => p.draw());
  bullets.forEach(b => b.draw());
  ship.draw();

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

initGame();
requestAnimationFrame(loop);
