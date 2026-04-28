// ============================================================
//  Career Day Game
//  Built live during the presentation — prompts from the kids!
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// Keep pixel art crisp when scaled
ctx.imageSmoothingEnabled = false;

// ---- Constants ----
const PLAYER_SPEED  = 5;   // pixels per frame
const PLAYER_SCALE  = 3;   // scale the 64x64 sprite up to 192px
const PLAYER_SIZE   = Math.round(64 * PLAYER_SCALE);

const GROUND_Y      = Math.round(canvas.height * 0.72); // where the grass starts
const GRAVITY       = 1.2;  // pixels per frame^2
const JUMP_VELOCITY = -22;  // negative = upward

// Monster speed per difficulty — medium matches the original game
const DIFFICULTY_SPEEDS = { easy: 2, medium: 3, hard: 5 };

// ---- Assets ----
const assets = {};

function loadImage(key, src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { assets[key] = img; resolve(); };
    img.src = src;
  });
}

// ---- Game State ----
// Everything that can change lives here.
// Adding a new feature? Add its state in this object.
const state = {
  player: {
    x: canvas.width  / 2 - PLAYER_SIZE / 2,
    y: GROUND_Y - PLAYER_SIZE + 10,
    width:  PLAYER_SIZE,
    height: PLAYER_SIZE,
    speed:  PLAYER_SPEED,
    vy:     0,
    onGround: true,
    jumpsLeft: 2,    // 2 = double jump
    angle:  0,       // rotation in radians (spins while in the air)
    danceTime: 0,    // counter for the dance wiggle
    health: 100,     // 0 = game over
    iframes: 0,      // invincibility frames after a hit (counts down)
    dead: false,     // true once health hits 0 — plays the death animation
    deathTime: 0,    // frames since death (drives the fall + fade)
  },

  monster: {
    x: 50,
    y: GROUND_Y - PLAYER_SIZE + 50,
    width:  PLAYER_SIZE,
    height: PLAYER_SIZE,
    speed:  3,        // slower than the player
    dir:    1,        // 1 = moving right, -1 = moving left
  },

  keys: {},       // tracks which keys are currently held

  // Score + leaderboard
  difficulty: 'medium',
  score: 0,
  scoreSubmitted: false,
  nameEntry: {
    active: false,
    letters: ['', '', ''],
    index: 0,
  },
  leaderboard: [],   // populated from sessionStorage in init()
};

// ---- Leaderboard (sessionStorage — clears when the tab closes) ----
const LEADERBOARD_KEY = 'careerDayLeaderboard';
const LEADERBOARD_MAX = 5;

function loadLeaderboard() {
  try {
    return JSON.parse(sessionStorage.getItem(LEADERBOARD_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveLeaderboard() {
  sessionStorage.setItem(LEADERBOARD_KEY, JSON.stringify(state.leaderboard));
}

function submitScore(name, score) {
  state.leaderboard.push({ name, score, difficulty: state.difficulty });
  state.leaderboard.sort((a, b) => b.score - a.score);
  state.leaderboard = state.leaderboard.slice(0, LEADERBOARD_MAX);
  saveLeaderboard();
}

// ---- Difficulty ----
function setDifficulty(d) {
  if (!(d in DIFFICULTY_SPEEDS)) return;
  state.difficulty = d;
  state.monster.speed = DIFFICULTY_SPEEDS[d];
  document.querySelectorAll('#difficulty button').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.difficulty === d);
    btn.blur();   // hand keyboard focus back to the game
  });
}

// ---- Restart (called on click after game over) ----
function restart() {
  Object.assign(state.player, {
    x: canvas.width / 2 - PLAYER_SIZE / 2,
    y: GROUND_Y - PLAYER_SIZE + 10,
    vy: 0,
    onGround: true,
    jumpsLeft: 2,
    angle: 0,
    danceTime: 0,
    health: 100,
    iframes: 0,
    dead: false,
    deathTime: 0,
  });
  Object.assign(state.monster, { x: 50, dir: 1 });
  state.score = 0;
  state.scoreSubmitted = false;
  state.nameEntry = { active: false, letters: ['', '', ''], index: 0 };
  state.keys = {};
  const ni = document.getElementById('nameInput');
  const gw = document.getElementById('gameWrap');
  if (ni) { ni.value = ''; ni.blur(); }
  if (gw) gw.classList.remove('entering-name');
}

// ---- Input ----
document.addEventListener('keydown', (e) => {
  // While name entry is active, the hidden <input> below handles all typing —
  // don't let the game eat keys (jump, etc.) during initials.
  if (state.nameEntry.active) return;

  // Jump on the initial press, not while the key is held — lets us double-jump
  if (!e.repeat && !state.player.dead && (e.key === 'w' || e.key === 'W') && state.player.jumpsLeft > 0) {
    state.player.vy = JUMP_VELOCITY;
    state.player.jumpsLeft -= 1;
    state.player.onGround = false;
  }

  state.keys[e.key] = true;
  // Prevent the page from scrolling with arrow keys
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    e.preventDefault();
  }
});

document.addEventListener('keyup', (e) => {
  state.keys[e.key] = false;
});

// Click / tap anywhere on the canvas to restart once the score has been submitted.
canvas.addEventListener('click', () => {
  if (state.player.dead && state.scoreSubmitted) restart();
});

// ---- Name entry via overlay <input> ----
// During name entry the input fills the canvas and turns on pointer-events.
// A tap on the canvas is therefore a tap on the input itself — that real user
// gesture is what iOS Safari requires before it will summon the keyboard.
const nameInput = document.getElementById('nameInput');
const gameWrap  = document.getElementById('gameWrap');
const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

function activateNameEntry() {
  state.nameEntry.active = true;
  if (!nameInput) return;
  nameInput.value = '';
  gameWrap.classList.add('entering-name');
  // On desktop this brings up focus immediately; on iOS it's a no-op until
  // the user taps the (now overlay) input, which fires focus inside a gesture.
  nameInput.focus();
}

function finishNameEntry() {
  state.nameEntry.active = false;
  state.scoreSubmitted = true;
  if (!nameInput) return;
  gameWrap.classList.remove('entering-name');
  nameInput.blur();
}

if (nameInput) {
  nameInput.addEventListener('input', () => {
    if (!state.nameEntry.active) return;
    const ne = state.nameEntry;
    const chars = (nameInput.value || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
    ne.letters = ['', '', ''];
    for (let i = 0; i < chars.length; i++) ne.letters[i] = chars[i];
    ne.index = chars.length;
    if (ne.index >= 3) {
      submitScore(ne.letters.join(''), state.score);
      finishNameEntry();
    }
  });
}

// ---- Touch controls — virtual buttons synthesize keyboard events ----
function pressKey(key) {
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

function releaseKey(key) {
  document.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
}

document.querySelectorAll('.touch-btn').forEach((btn) => {
  const key = btn.dataset.key;
  const start = (e) => {
    e.preventDefault();
    btn.classList.add('pressed');
    pressKey(key);
  };
  const end = (e) => {
    e.preventDefault();
    btn.classList.remove('pressed');
    releaseKey(key);
  };
  btn.addEventListener('touchstart',  start, { passive: false });
  btn.addEventListener('touchend',    end,   { passive: false });
  btn.addEventListener('touchcancel', end,   { passive: false });
  // Mouse fallback so the buttons also work for desktop testing
  btn.addEventListener('mousedown',  start);
  btn.addEventListener('mouseup',    end);
  btn.addEventListener('mouseleave', end);
});

// ---- Update ----
function update() {
  const { player, keys } = state;

  // Death animation: tip over to ~90°, then hold while it fades. Skip the rest.
  if (player.dead) {
    player.deathTime += 1;
    const targetAngle = Math.PI / 2;
    if (player.angle < targetAngle) {
      player.angle = Math.min(targetAngle, player.angle + 0.08);
    }
    // Once the fall has finished, prompt for initials (only on first death)
    if (player.deathTime > 90 && !state.scoreSubmitted && !state.nameEntry.active) {
      activateNameEntry();
    }
    // Monster keeps walking even after death
    const m = state.monster;
    m.x += m.speed * m.dir;
    if (m.x <= 0)                      { m.x = 0;                      m.dir =  1; }
    if (m.x + m.width >= canvas.width) { m.x = canvas.width - m.width; m.dir = -1; }
    return;
  }

  if (keys['ArrowLeft'])  player.x -= player.speed;
  if (keys['ArrowRight']) player.x += player.speed;

  // Keep the player inside the canvas horizontally
  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

  // Apply gravity + vertical motion (jump itself is triggered in keydown)
  player.vy += GRAVITY;
  player.y  += player.vy;

  // Spin while in the air, snap upright when landed
  if (!player.onGround) {
    player.angle += 0.25;   // radians per frame — bigger = faster spin
  }

  // Land on the ground — refill jumps, stop spinning
  const groundY = (GROUND_Y - player.height) + 50;
  if (player.y >= groundY) {
    player.y = groundY;
    player.vy = 0;
    player.onGround = true;
    player.jumpsLeft = 2;
    player.angle = 0;
  }

  // Dance — hold D while on the ground to wiggle side to side
  const dancing = player.onGround && (keys['d'] || keys['D']);
  if (dancing) {
    player.danceTime += 1;
    player.angle = Math.sin(player.danceTime * 0.35) * 0.5; // ~±28°
    state.score += 5;   // points pile up while you dance
  } else if (player.onGround) {
    player.danceTime = 0;
  }

  // Monster — walks back and forth, bouncing off the edges of the screen
  const m = state.monster;
  m.x += m.speed * m.dir;
  if (m.x <= 0)                      { m.x = 0;                      m.dir =  1; }
  if (m.x + m.width >= canvas.width) { m.x = canvas.width - m.width; m.dir = -1; }

  // Damage — if the monster touches the player and we're not in i-frames, lose health.
  // Hitboxes are shrunk a bit because the Kenney sprites have transparent padding.
  if (player.iframes > 0) player.iframes -= 1;

  const pad = 30;
  const hit =
    player.x + pad           < m.x + m.width  - pad &&
    player.x + player.width  - pad > m.x + pad &&
    player.y + pad           < m.y + m.height - pad &&
    player.y + player.height - pad > m.y + pad;

  if (hit && player.iframes === 0 && player.health > 0) {
    player.health   = Math.max(0, player.health - 10);
    player.iframes  = 60;   // ~1 second of invincibility at 60fps
    if (player.health === 0) {
      player.dead = true;
      player.deathTime = 0;
    }
  }
}

// ---- Render Helpers ----
function drawBackground() {
  // Sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  sky.addColorStop(0, '#5bb8f5');
  sky.addColorStop(1, '#c8eaff');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, GROUND_Y);

  // Sun
  ctx.fillStyle = '#FFE066';
  ctx.beginPath();
  ctx.arc(canvas.width - 140, 80, 56, 0, Math.PI * 2);
  ctx.fill();

  // Simple clouds — spread across the wider sky
  drawCloud(canvas.width * 0.10, 90,  80);
  drawCloud(canvas.width * 0.35, 60,  65);
  drawCloud(canvas.width * 0.60, 105, 75);
  drawCloud(canvas.width * 0.82, 70,  60);

  // Ground — dark green strip first, then lighter fill
  ctx.fillStyle = '#2e7d32';
  ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);

  ctx.fillStyle = '#43a047';
  ctx.fillRect(0, GROUND_Y, canvas.width, 18);
}

function drawCloud(x, y, size) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.beginPath();
  ctx.arc(x,              y,          size * 0.5,  0, Math.PI * 2);
  ctx.arc(x + size * 0.4, y - size * 0.15, size * 0.38, 0, Math.PI * 2);
  ctx.arc(x + size * 0.7, y,          size * 0.4,  0, Math.PI * 2);
  ctx.fill();
}

// ---- Main Render ----
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBackground();

  // Monster — flip horizontally so it faces the direction it's walking
  ctx.imageSmoothingEnabled = false;
  const m = state.monster;
  ctx.save();
  ctx.translate(m.x + m.width / 2, m.y + m.height / 2);
  ctx.scale(m.dir, 1);   // -1 mirrors the sprite when walking left
  ctx.drawImage(assets.monster, -m.width / 2, -m.height / 2, m.width, m.height);
  ctx.restore();

  // Player sprite — pixel-art crisp, rotate around the character's center
  const p  = state.player;
  const cx = p.x + p.width  / 2;
  const cy = p.y + p.height / 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(p.angle);
  // Fade out after death (over ~1.5s); flash while invincible otherwise
  if (p.dead) {
    ctx.globalAlpha = Math.max(0, 1 - p.deathTime / 90);
    ctx.drawImage(assets.player, -p.width / 2, -p.height / 2, p.width, p.height);
  } else if (p.iframes === 0 || Math.floor(p.iframes / 6) % 2 === 0) {
    ctx.drawImage(assets.player, -p.width / 2, -p.height / 2, p.width, p.height);
  }
  ctx.restore();

  drawHealthBar();
  drawScore();

  if (p.dead) drawGameOver();
}

function drawScore() {
  const x = canvas.width - 220, y = 20, w = 200, h = 24;

  ctx.fillStyle = '#000';
  ctx.globalAlpha = 0.4;
  ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(x, y, w, h);

  ctx.fillStyle = '#ffe066';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(`SCORE  ${state.score}`, x + w - 10, y + h / 2 + 1);
  ctx.textAlign = 'start';
}

function drawGameOver() {
  // Banner appears about half a second after death so it lands with the fall
  if (state.player.deathTime < 30) return;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#ff5252';
  ctx.font = 'bold 80px sans-serif';
  ctx.fillText('GAME OVER', canvas.width / 2, 130);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText(`Score: ${state.score}`, canvas.width / 2, 195);

  if (state.nameEntry.active) {
    drawNameEntry();
  } else if (state.scoreSubmitted) {
    drawLeaderboard();
    ctx.fillStyle = '#4ecca3';
    ctx.font = '22px sans-serif';
    ctx.fillText('Click anywhere to play again', canvas.width / 2, canvas.height - 50);
  }

  ctx.textAlign = 'start';
}

function drawNameEntry() {
  const ne = state.nameEntry;

  ctx.fillStyle = '#fff';
  ctx.font = '22px sans-serif';
  ctx.fillText('ENTER YOUR INITIALS', canvas.width / 2, 270);

  const slot = 80, gap = 24;
  const totalW = slot * 3 + gap * 2;
  const startX = canvas.width / 2 - totalW / 2;
  const y = 310;

  for (let i = 0; i < 3; i++) {
    const x = startX + i * (slot + gap);
    const isCurrent = i === ne.index;

    ctx.strokeStyle = isCurrent ? '#4ecca3' : '#666';
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, slot, slot);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 56px monospace';
    const blink = Math.floor(state.player.deathTime / 20) % 2 === 0;
    const letter = ne.letters[i] || (isCurrent && blink ? '_' : '');
    ctx.fillText(letter, x + slot / 2, y + slot / 2 + 4);
  }

  ctx.fillStyle = '#aaa';
  ctx.font = '18px sans-serif';
  const hint = isTouchDevice
    ? 'tap screen, then type 3 letters'
    : 'type 3 letters · Backspace to fix';
  ctx.fillText(hint, canvas.width / 2, y + slot + 38);
}

function drawLeaderboard() {
  const lb = state.leaderboard;

  ctx.fillStyle = '#ffe066';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('LEADERBOARD', canvas.width / 2, 270);

  if (lb.length === 0) {
    ctx.fillStyle = '#aaa';
    ctx.font = '20px sans-serif';
    ctx.fillText('(no scores yet)', canvas.width / 2, 320);
    return;
  }

  ctx.font = 'bold 26px monospace';
  for (let i = 0; i < lb.length; i++) {
    const e = lb[i];
    const rowY = 320 + i * 38;
    // Highlight the entry the player just set (top score with same name+score)
    const justSet = e.name === state.nameEntry.letters.join('') && e.score === state.score;
    ctx.fillStyle = justSet ? '#4ecca3' : '#fff';
    const tag = (e.difficulty || 'medium')[0].toUpperCase();   // E / M / H
    const line = `${i + 1}.  ${e.name}  [${tag}]  ${String(e.score).padStart(6, ' ')}`;
    ctx.fillText(line, canvas.width / 2, rowY);
  }
}

function drawHealthBar() {
  const x = 20, y = 20, w = 240, h = 24;
  const pct = state.player.health / 100;

  // Background
  ctx.fillStyle = '#000';
  ctx.globalAlpha = 0.4;
  ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
  ctx.globalAlpha = 1;

  // Empty bar
  ctx.fillStyle = '#5a1a1a';
  ctx.fillRect(x, y, w, h);

  // Filled portion — green → yellow → red as it drops
  ctx.fillStyle = pct > 0.6 ? '#43a047' : pct > 0.3 ? '#fbc02d' : '#e53935';
  ctx.fillRect(x, y, w * pct, h);

  // Label
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(`HP ${state.player.health}`, x + 8, y + h / 2 + 1);
}

// ---- Game Loop ----
function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);
}

// ---- Start ----
async function init() {
  state.leaderboard = loadLeaderboard();
  document.querySelectorAll('#difficulty button').forEach((btn) => {
    btn.addEventListener('click', () => setDifficulty(btn.dataset.difficulty));
  });
  setDifficulty('medium');
  await Promise.all([
    loadImage('player',  'assets/character.png'),
    loadImage('monster', 'assets/monster.png'),
  ]);
  gameLoop();
}

init();
