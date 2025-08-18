let canvas = document.getElementById("gameCanvas");
let ctx = canvas.getContext("2d");

// ================= GAME STATE =================
let gameRunning = false;
let gameOver = false;
let startScreen = true;

// ================= PLAYER =================
let player = {
  x: canvas.width/2 - 25,
  y: canvas.height - 60,
  width: 50,
  height: 50,
  speed: 5,
  lives: 3
};

let keys = {};
document.addEventListener("keydown", e => {
  keys[e.code] = true;
  if (e.code === "KeyQ") switchGun(-1);
  if (e.code === "KeyE") switchGun(1);
});
document.addEventListener("keyup", e => keys[e.code] = false);

// ================= BULLETS =================
let bullets = [];
let enemyBullets = [];

// ================= POWERUPS =================
let powerUps = [];
let shieldActive = false;
let rapidFireActive = false;
let rapidFireTimer = 0;

// ================= GUNS =================
let guns = [
  {name:"Laser Pistol", fireRate:1000, type:"bullet"},
  {name:"Laser Minigun", fireRate:200, type:"bullet"},
  {name:"Laser Rocket", fireRate:2000, type:"rocket"},
  {name:"Quad Rocket", fireRate:2000, type:"quadrocket"},
  {name:"Laser Missile", fireRate:2500, type:"missile"}
];
let currentGun = 0;
let unlockedGuns = 1;
let lastShot = 0;

// ================= ENEMIES =================
let enemies = [];
let enemySpawnTimer = 0;
let kills = 0;

// ================= BOSS =================
let boss = null;

// ================= SWITCH GUN =================
function switchGun(dir) {
  currentGun += dir;
  if (currentGun < 0) currentGun = unlockedGuns-1;
  if (currentGun >= unlockedGuns) currentGun = 0;
}

// ================= SHOOT =================
function shoot() {
  let now = Date.now();
  let rate = guns[currentGun].fireRate;
  if (rapidFireActive) rate /= 2;
  if (now - lastShot < rate) return;
  lastShot = now;

  let gun = guns[currentGun];
  if (gun.type === "bullet") {
    bullets.push({x:player.x+player.width/2-3,y:player.y,w:6,h:12,speed:8,type:"bullet"});
  }
  if (gun.type === "rocket") {
    bullets.push({x:player.x+player.width/2-6,y:player.y,w:12,h:20,speed:6,type:"rocket"});
  }
  if (gun.type === "quadrocket") {
    for (let dx=-30; dx<=30; dx+=20) {
      bullets.push({x:player.x+player.width/2-6+dx,y:player.y,w:12,h:20,speed:6,type:"rocket"});
    }
  }
  if (gun.type === "missile") {
    bullets.push({x:player.x+player.width/2-8,y:player.y,w:16,h:25,speed:5,type:"missile"});
  }
}

// ================= UPDATE PLAYER =================
function updatePlayer() {
  if (keys["ArrowLeft"] && player.x > 0) player.x -= player.speed;
  if (keys["ArrowRight"] && player.x+player.width < canvas.width) player.x += player.speed;
  if (keys["Space"]) shoot();
}

// ================= ENEMY SPAWN =================
function spawnEnemy() {
  let type = Math.floor(Math.random()*3); // 0=fast,1=zigzag,2=tank
  if (type===0) {
    enemies.push({x:Math.random()*(canvas.width-30),y:-30,w:30,h:30,speed:4,hp:1,type:"fast"});
  } else if (type===1) {
    enemies.push({x:Math.random()*(canvas.width-40),y:-40,w:40,h:40,speed:2,hp:2,type:"zigzag",dir:(Math.random()<0.5?-1:1)});
  } else {
    enemies.push({x:Math.random()*(canvas.width-60),y:-60,w:60,h:60,speed:1,hp:5,type:"tank"});
  }
}

// ================= UPDATE ENEMIES =================
function updateEnemies() {
  enemySpawnTimer++;
  if (enemySpawnTimer > 60 && !boss) { spawnEnemy(); enemySpawnTimer=0; }

  for (let i=enemies.length-1; i>=0; i--) {
    let e = enemies[i];
    if (e.type==="zigzag") {
      e.x += e.dir*2;
      if (e.x<0 || e.x+e.w>canvas.width) e.dir*=-1;
    }
    e.y += e.speed;
    if (e.y>canvas.height) enemies.splice(i,1);

    // shooting
    if (Math.random()<0.01) {
      enemyBullets.push({x:e.x+e.w/2-3,y:e.y+e.h,w:6,h:12,speed:4});
    }
  }
}

// ================= UPDATE BULLETS =================
function updateBullets() {
  for (let i=bullets.length-1; i>=0; i--) {
    let b = bullets[i];
    b.y -= b.speed;
    ctx.fillStyle = (b.type==="bullet")?"yellow":(b.type==="rocket")?"orange":"cyan";
    ctx.fillRect(b.x,b.y,b.w,b.h);
    if (b.y<-20) { bullets.splice(i,1); continue; }

    // hit enemies
    for (let j=enemies.length-1; j>=0; j--) {
      let e=enemies[j];
      if (b.x<e.x+e.w && b.x+b.w>e.x && b.y<e.y+e.h && b.y+b.h>e.y) {
        if (b.type==="bullet") e.hp-=1;
        if (b.type==="rocket") e.hp-=2;
        if (b.type==="missile") e.hp-=3;
        if (e.hp<=0) {
          enemies.splice(j,1);
          kills++;
          // powerup drop
          if (Math.random()<0.2) {
            let types=["health","rapid","shield"];
            let type=types[Math.floor(Math.random()*types.length)];
            powerUps.push({x:e.x+e.w/2-10,y:e.y,w:20,h:20,type:type});
          }
          if (kills%5===0 && unlockedGuns<guns.length) unlockedGuns++;
          if (kills>=25 && !boss) spawnBoss();
        }
        bullets.splice(i,1);
        break;
      }
    }
    // hit boss
    if (boss) {
      if (b.x<boss.x+boss.w && b.x+b.w>boss.x && b.y<boss.y+boss.h && b.y+b.h>boss.y) {
        if (b.type==="bullet") boss.hp-=1;
        if (b.type==="rocket") boss.hp-=3;
        if (b.type==="missile") boss.hp-=5;
        bullets.splice(i,1);
        if (boss.hp<=0) endGame(true);
      }
    }
  }
}

// ================= ENEMY BULLETS =================
function updateEnemyBullets() {
  for (let i=enemyBullets.length-1;i>=0;i--) {
    let b=enemyBullets[i];
    b.y+=b.speed;
    ctx.fillStyle="red"; ctx.fillRect(b.x,b.y,b.w,b.h);
    if (b.y>canvas.height) {enemyBullets.splice(i,1); continue;}

    if (b.x<player.x+player.width && b.x+b.w>player.x && b.y<player.y+player.height && b.y+b.h>player.y) {
      enemyBullets.splice(i,1);
      if (shieldActive) {
        shieldActive=false;
      } else {
        player.lives--;
        if (player.lives<=0) endGame(false);
      }
    }
  }
}

// ================= POWERUPS =================
function updatePowerUps() {
  for (let i=powerUps.length-1;i>=0;i--) {
    let p=powerUps[i];
    p.y+=2;
    ctx.fillStyle = (p.type==="health")?"lime":(p.type==="rapid")?"yellow":"cyan";
    ctx.fillRect(p.x,p.y,p.w,p.h);

    if (p.x<player.x+player.width && p.x+p.w>player.x && p.y<player.y+player.height && p.y+p.h>player.y) {
      if (p.type==="health" && player.lives<3) player.lives++;
      if (p.type==="shield") shieldActive=true;
      if (p.type==="rapid") { rapidFireActive=true; rapidFireTimer=Date.now(); }
      powerUps.splice(i,1);
    }
    if (p.y>canvas.height) powerUps.splice(i,1);
  }
  if (rapidFireActive && Date.now()-rapidFireTimer>5000) rapidFireActive=false;
}

// ================= BOSS =================
function spawnBoss() {
  boss={x:canvas.width/2-100,y:50,w:200,h:100,hp:50};
}
function drawBoss() {
  ctx.fillStyle="purple"; ctx.fillRect(boss.x,boss.y,boss.w,boss.h);
  ctx.fillStyle="red"; ctx.fillRect(boss.x,boss.y-20,boss.w,10);
  ctx.fillStyle="lime"; ctx.fillRect(boss.x,boss.y-20,boss.w*(boss.hp/50),10);
  if (Math.random()<0.05) {
    enemyBullets.push({x:boss.x+boss.w/2-5,y:boss.y+boss.h,w:10,h:15,speed:6});
    enemyBullets.push({x:boss.x+20,y:boss.y+boss.h,w:10,h:15,speed:6});
    enemyBullets.push({x:boss.x+boss.w-30,y:boss.y+boss.h,w:10,h:15,speed:6});
  }
}

// ================= UI =================
function drawUI() {
  ctx.fillStyle="white"; ctx.fillText("Kills: "+kills,10,20);
  ctx.fillText("Gun: "+guns[currentGun].name,10,40);
  // health bar
  ctx.fillStyle="red"; ctx.fillRect(canvas.width-120,10,100,20);
  ctx.fillStyle="lime"; ctx.fillRect(canvas.width-120,10,player.lives*33,20);
  ctx.strokeStyle="white"; ctx.strokeRect(canvas.width-120,10,100,20);
  ctx.fillText("HP",canvas.width-150,25);
  if (shieldActive) { ctx.fillStyle="cyan"; ctx.fillText("Shield ON",canvas.width-120,50); }
  if (rapidFireActive) { ctx.fillStyle="yellow"; ctx.fillText("Rapid Fire!",canvas.width-120,70); }
}

// ================= GAME LOOP =================
function gameLoop() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if (startScreen) {
    ctx.fillStyle="white";
    ctx.font="30px Arial";
    ctx.fillText("SPACE SHOOTER",canvas.width/2-100,canvas.height/2-60);
    ctx.font="20px Arial";
    ctx.fillText("Press ENTER to Start",canvas.width/2-90,canvas.height/2);
    return;
  }
  if (gameOver) {
    ctx.fillStyle="white"; ctx.font="30px Arial";
    ctx.fillText("GAME OVER",canvas.width/2-80,canvas.height/2-60);
    ctx.font="20px Arial";
    ctx.fillText("Press ENTER to Restart",canvas.width/2-100,canvas.height/2);
    return;
  }

  // draw player
  ctx.fillStyle="lime"; ctx.fillRect(player.x,player.y,player.width,player.height);

  updatePlayer();
  updateEnemies();
  updateBullets();
  updateEnemyBullets();
  updatePowerUps();
  if (boss) drawBoss();
  drawUI();

  requestAnimationFrame(gameLoop);
}

// ================= START & RESTART =================
document.addEventListener("keydown", e=>{
  if (e.code==="Enter") {
    if (startScreen || gameOver) {
      resetGame();
      startScreen=false; gameOver=false; gameRunning=true;
      requestAnimationFrame(gameLoop);
    }
  }
});
function resetGame() {
  player.x=canvas.width/2-25; player.lives=3;
  enemies=[]; bullets=[]; enemyBullets=[]; powerUps=[];
  kills=0; unlockedGuns=1; currentGun=0; boss=null;
  shieldActive=false; rapidFireActive=false;
}
function endGame(win) {
  gameOver=true;
  gameRunning=false;
}
requestAnimationFrame(gameLoop);
stAnimationFrame(gameLoop);
}
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

