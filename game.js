// Grab canvas
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ===== Player =====
let player = {
  x: canvas.width / 2 - 20,
  y: canvas.height - 60,
  w: 40,
  h: 40,
  speed: 5,
  hp: 3
};

// ===== Bullets & Enemies =====
let bullets = [];
let enemies = [];
let enemySpawnTimer = 0;

// ===== Input =====
let keys = {};
document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup", e => keys[e.code] = false);

// ===== Draw Player =====
function drawPlayer() {
  ctx.fillStyle = "#0ff";
  ctx.fillRect(player.x, player.y, player.w, player.h);
}

// ===== Draw Bullets =====
function drawBullets() {
  ctx.fillStyle = "yellow";
  bullets.forEach(b => {
    ctx.fillRect(b.x, b.y, b.w, b.h);
  });
}

// ===== Draw Enemies =====
function drawEnemies() {
  ctx.fillStyle = "red";
  enemies.forEach(e => {
    ctx.fillRect(e.x, e.y, e.w, e.h);
  });
}

// ===== Update Bullets =====
function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].y -= 7;
    if (bullets[i].y < 0) bullets.splice(i, 1);
  }
}

// ===== Spawn Enemies =====
function spawnEnemy() {
  enemies.push({
    x: Math.random() * (canvas.width - 30),
    y: -30,
    w: 30,
    h: 30,
    speed: 2
  });
}

// ===== Update Enemies =====
function updateEnemies() {
  enemySpawnTimer++;
  if (enemySpawnTimer > 60) { // every 60 frames (~1 sec)
    spawnEnemy();
    enemySpawnTimer = 0;
  }
  for (let i = enemies.length - 1; i >= 0; i--) {
    enemies[i].y += enemies[i].speed;
    if (enemies[i].y > canvas.height) enemies.splice(i, 1);
  }
}

// ===== Player Movement =====
function movePlayer() {
  if (keys["ArrowLeft"] && player.x > 0) player.x -= player.speed;
  if (keys["ArrowRight"] && player.x + player.w < canvas.width) player.x += player.speed;
  if (keys["Space"]) {
    if (bullets.length === 0 || bullets[bullets.length-1].y < player.y - 20) {
      bullets.push({ x: player.x + player.w/2 - 2, y: player.y, w: 4, h: 10 });
    }
  }
}

// ===== Game Loop =====
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  movePlayer();
  updateBullets();
  updateEnemies();

  drawPlayer();
  drawBullets();
  drawEnemies();

  requestAnimationFrame(gameLoop);
}

// ===== Start Game =====
gameLoop();

