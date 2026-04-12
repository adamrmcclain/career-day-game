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
  },

  keys: {},       // tracks which keys are currently held
};

// ---- Input ----
document.addEventListener('keydown', (e) => {
  state.keys[e.key] = true;
  // Prevent the page from scrolling with arrow keys
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    e.preventDefault();
  }
});

document.addEventListener('keyup', (e) => {
  state.keys[e.key] = false;
});

// ---- Update ----
function update() {
  const { player, keys } = state;

  if (keys['ArrowLeft'])  player.x -= player.speed;
  if (keys['ArrowRight']) player.x += player.speed;

  // Keep the player inside the canvas horizontally
  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

  // Lock player to the ground
  player.y = (GROUND_Y - player.height) + 50;
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

  // Player sprite — pixel-art crisp
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    assets.player,
    state.player.x, state.player.y,
    state.player.width, state.player.height
  );
}

// ---- Game Loop ----
function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);
}

// ---- Start ----
async function init() {
  await loadImage('player', 'assets/character.png');
  gameLoop();
}

init();
