// 首先確保所有全局變量都正確初始化
let character1, character2;
let projectiles = [];
let hitEffects = [];
let gameOver = false;
let winner = '';

// 完整定義 sprites 物件
let sprites = {
  background: {
    img: null,
    width: 1800,
    height: 900
  },
  player1: {
    idle: {
      img: null,
      width: 64,
      height: 100,
      frames: 8
    },
    walk: {
      img: null,
      width: 86,
      height: 96,
      frames: 9
    },
    jump: {
      img: null,
      width: 94,
      height: 112,
      frames: 9
    },
    shoot: {
      img: null,
      width: 87,
      height: 95,
      frames: 6
    }
  },
  player2: {
    idle: {
      img: null,
      width: 58,
      height: 74,
      frames: 8
    },
    walk: {
      img: null,
      width: 66,
      height: 79,
      frames: 10
    },
    jump: {
      img: null,
      width: 65,
      height: 81,
      frames: 9
    },
    shoot: {
      img: null,
      width: 130,
      height: 98,
      frames: 6
    }
  },
  projectile: {
    img: null,
    width: 32,
    height: 32
  },
  hit: {
    img: null,
    width: 32,
    height: 32,
    frames: 4
  }
};

function preload() {
  try {
    // 載入背景
    sprites.background.img = loadImage('assets/background.png', 
      // 成功回調
      () => {
        console.log('背景圖片載入成功');
      },
      // 錯誤回調
      (err) => {
        console.error('背景圖片載入失敗:', err);
      }
    );

    // 載入角色1的圖片
    sprites.player1.idle.img = loadImage('assets/idle.png',
      () => console.log('Player1 idle loaded'),
      (err) => console.error('Error loading player1 idle:', err)
    );
    sprites.player1.walk.img = loadImage('assets/walk.png');
    sprites.player1.jump.img = loadImage('assets/jump.png');
    sprites.player1.shoot.img = loadImage('assets/shoot.png');

    // 載入角色2的圖片
    sprites.player2.idle.img = loadImage('assets/player2-idle.png');
    sprites.player2.walk.img = loadImage('assets/player2-walk.png');
    sprites.player2.jump.img = loadImage('assets/player2-jump.png');
    sprites.player2.shoot.img = loadImage('assets/player2-shoot.png');

    // 載入發射物和效果圖片
    sprites.projectile.img = loadImage('assets/projectile.png');
    sprites.hit.img = loadImage('assets/hit-effect.png');
  } catch (error) {
    console.error('Error in preload:', error);
  }
}

// 修改 Projectile 的 draw 方法，添加錯誤檢��
class Projectile {
  constructor(x, y, direction, owner) {
    this.x = x;
    this.y = y;
    this.speed = 20;
    this.direction = direction;
    this.owner = owner;
  }

  // 添加 update 方法
  update() {
    // 更新發射物的位置
    this.x += this.speed * this.direction;
  }
  //
  draw() {
    if (sprites && sprites.projectile && sprites.projectile.img) {
      push();
      translate(this.x, this.y);
      scale(this.direction, 1);
      image(sprites.projectile.img, 
        -sprites.projectile.width/2, 
        -sprites.projectile.height/2,
        sprites.projectile.width, 
        sprites.projectile.height
      );
      pop();
    } else {
      // 備用顯示
      push();
      fill(255, 0, 0);
      noStroke();
      ellipse(this.x, this.y, 20, 20);
      pop();
    }
  }

  hits(character) {
    // 檢查是否擊中角色
    let spriteData = sprites[character.player][character.currentAction];
    return (
      this.x > character.x && 
      this.x < character.x + spriteData.width &&
      this.y > character.y &&
      this.y < character.y + spriteData.height
    );
  }
}

// 第一個角色
character1 = {
  x: 300,
  y: 200,
  speedX: 15,
  speedY: 5,
  gravity: 0.8,
  jumpForce: -10,
  isJumping: false,
  groundY: 300,
  currentFrame: 0,
  currentAction: 'idle',
  direction: 1,
  player: 'player1',
  hp: 100,
  shootCooldown: 0
};

// 第二個角色
character2 = {
  x: 1100, // 設定在右邊
  y: 200,
  speedX: 15,
  speedY: 5,
  gravity: 0.8,
  jumpForce: -10,
  isJumping: false,
  groundY: 300,
  currentFrame: 0,
  currentAction: 'idle',
  direction: -1, // 面向邊
  player: 'player2',
  hp: 100,
  shootCooldown: 0
};

class HitEffect {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.frame = 0;
    this.lifetime = 12; // 效果持續時間（幀數）
  }

  update() {
    this.lifetime--;
    this.frame = Math.floor((12 - this.lifetime) / 3) % sprites.hit.frames;
  }

  draw() {
    let sx = this.frame * sprites.hit.width;
    image(sprites.hit.img,
      this.x - sprites.hit.width/2,
      this.y - sprites.hit.height/2,
      sprites.hit.width,
      sprites.hit.height,
      sx, 0,
      sprites.hit.width,
      sprites.hit.height
    );
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  frameRate(12);
}

function draw() {
  // 繪製背景
  if (sprites.background && sprites.background.img) {
    image(sprites.background.img, 0, 0, width, height);
  } else {
    background(220);
  }
  
  if (gameOver) {
    // 顯示遊戲結束畫面
    textSize(64);
    textAlign(CENTER, CENTER);
    fill(0);
    text('GAME OVER', width/2, height/2 - 40);
    text(winner + ' Wins!', width/2, height/2 + 40);
    noLoop(); // 停止遊戲循環
    return;
  }
  
  // 確保在每一幀都檢查按鍵輸入
  checkKeys();
  
  // 更新物理
  updatePhysics(character1);
  updatePhysics(character2);
  
  // 繪製角色
  drawCharacter(character1);
  drawCharacter(character2);
  
  // 更新和繪製發射物件
  for (let i = projectiles.length - 1; i >= 0; i--) {
    if (projectiles[i] && typeof projectiles[i].update === 'function') {
      projectiles[i].update();
      projectiles[i].draw();
      
      // 檢查碰撞
      if (projectiles[i].owner !== character1 && projectiles[i].hits(character1)) {
        character1.hp -= 10;
        // 添加擊中效果
        hitEffects.push(new HitEffect(character1.x + sprites[character1.player][character1.currentAction].width/2,
                                    character1.y + sprites[character1.player][character1.currentAction].height/2));
        projectiles.splice(i, 1);
        if (character1.hp <= 0) {
          gameOver = true;
          winner = 'Player 2';
        }
      } else if (projectiles[i].owner !== character2 && projectiles[i].hits(character2)) {
        character2.hp -= 10;
        // 添加擊中效果
        hitEffects.push(new HitEffect(character2.x + sprites[character2.player][character2.currentAction].width/2,
                                    character2.y + sprites[character2.player][character2.currentAction].height/2));
        projectiles.splice(i, 1);
        if (character2.hp <= 0) {
          gameOver = true;
          winner = 'Player 1';
        }
      } else if (projectiles[i].x < 0 || projectiles[i].x > width) {
        projectiles.splice(i, 1);
      }
    }
  }
  
  // 更新和繪製擊中效果
  for (let i = hitEffects.length - 1; i >= 0; i--) {
    hitEffects[i].update();
    hitEffects[i].draw();
    if (hitEffects[i].lifetime <= 0) {
      hitEffects.splice(i, 1);
    }
  }
  
  // 繪製血條和說明文字
  drawHP();
}

function drawCharacter(character) {
  let currentSprite = sprites[character.player][character.currentAction];
  
  character.currentFrame = (character.currentFrame + 1) % currentSprite.frames;
  
  let sx = character.currentFrame * currentSprite.width;
  
  push();
  translate(character.x + (character.direction === -1 ? currentSprite.width : 0), character.y);
  scale(character.direction, 1);
  image(currentSprite.img, 
    0, 0,
    currentSprite.width, currentSprite.height,
    sx, 0,
    currentSprite.width, currentSprite.height
  );
  pop();
}

function updatePhysics(character) {
  // 更新位置
  character.x += character.speedX;
  character.y += character.speedY;

  // 重力
  character.speedY += 1;

  // 地面碰撞檢測
  if (character.y >= character.groundY) {
    character.y = character.groundY;
    character.speedY = 0;
    character.isJumping = false;
    if (character.currentAction === 'jump') {
      character.currentAction = 'idle';
    }
  }

  // 邊界檢查
  if (character.x < 0) character.x = 0;
  if (character.x > width - sprites[character.player][character.currentAction].width) {
    character.x = width - sprites[character.player][character.currentAction].width;
  }
}

function checkKeys() {
  console.log('Checking keys...'); // 用於調試

  // 角色1的控制
  if (keyIsDown(65)) { // A鍵
    console.log('A key pressed'); // 用於調試
    character1.speedX = -8;
    character1.direction = -1;
    character1.currentAction = 'walk';
  } else if (keyIsDown(68)) { // D鍵
    console.log('D key pressed'); // 用於調試
    character1.speedX = 8;
    character1.direction = 1;
    character1.currentAction = 'walk';
  } else {
    character1.speedX = 0;
    if (!character1.isJumping) {
      character1.currentAction = 'idle';
    }
  }

  // 角色1跳躍 (W鍵)
  if (keyIsDown(87) && !character1.isJumping) { // W鍵
    console.log('W key pressed'); // 用於調試
    character1.speedY = -20;
    character1.isJumping = true;
    character1.currentAction = 'jump';
  }

  // 角色2的控制
  if (keyIsDown(LEFT_ARROW)) {
    console.log('LEFT arrow pressed'); // 用於調試
    character2.speedX = -8;
    character2.direction = -1;
    character2.currentAction = 'walk';
  } else if (keyIsDown(RIGHT_ARROW)) {
    console.log('RIGHT arrow pressed'); // 用於調試
    character2.speedX = 8;
    character2.direction = 1;
    character2.currentAction = 'walk';
  } else {
    character2.speedX = 0;
    if (!character2.isJumping) {
      character2.currentAction = 'idle';
    }
  }

  // 角色2跳躍
  if (keyIsDown(UP_ARROW) && !character2.isJumping) {
    console.log('UP arrow pressed'); // 用於調試
    character2.speedY = -20;
    character2.isJumping = true;
    character2.currentAction = 'jump';
  }

  // 發射控制
  if (keyIsDown(32)) { // 空白鍵
    console.log('SPACE pressed'); // 用於調試
    projectiles.push(new Projectile(
      character1.x + (character1.direction === 1 ? sprites[character1.player][character1.currentAction].width : 0),
      character1.y + sprites[character1.player][character1.currentAction].height/2,
      character1.direction,
      character1
    ));
  }
  
  if (keyIsDown(16)) { // Shift鍵
    console.log('SHIFT pressed'); // 用於調試
    projectiles.push(new Projectile(
      character2.x + (character2.direction === 1 ? sprites[character2.player][character2.currentAction].width : 0),
      character2.y + sprites[character2.player][character2.currentAction].height/2,
      character2.direction,
      character2
    ));
  }
}

function drawHP() {
  // 繪製角色1的血條（在頭頂上）
  let char1SpriteHeight = sprites[character1.player][character1.currentAction].height;
  fill(255, 0, 0);
  rect(character1.x, character1.y - 20, character1.hp, 10);
  fill(0);
  textSize(12);
  text(`HP: ${character1.hp}`, character1.x, character1.y - 25);
  
  // 繪製角色2的血條（在頭頂上）
  let char2SpriteHeight = sprites[character2.player][character2.currentAction].height;
  fill(255, 0, 0);
  rect(character2.x, character2.y - 20, character2.hp, 10);
  fill(0);
  text(`HP: ${character2.hp}`, character2.x, character2.y - 25);
  
  // 繪製操控說明
  textSize(20);
  fill(255);
  
  // Player 1 控制說明（左上角）
  textAlign(LEFT);
  text('Player 1 控制：\n' +
       'A, D - 左右移動\n' +
       'W - 跳躍\n' +
       'SPACE - 發射', 
       20, 30);
  
  // Player 2 控制說明（右上角）
  textAlign(RIGHT);
  text('Player 2 控制：\n' +
       '← → - 左右移動\n' +
       '↑ - 跳躍\n' +
       'SHIFT - 發射', 
       width - 20, 30);
  
  // 淡江大學教育科技系（正中間）
  textAlign(CENTER);
  textSize(40);
  fill(255); // 半透明黑色
  text('淡江大學教育科技系', width/2, 50);
}

// 添加重新開始遊戲的功能
function keyPressed() {
  console.log('Key pressed:', keyCode); // 用於調試
  if (gameOver && key === 'r') {
    // 重置遊戲
    character1.hp = 100;
    character2.hp = 100;
    character1.x = 200;
    character2.x = 1500;
    character1.y = character1.groundY;
    character2.y = character2.groundY;
    projectiles = [];
    gameOver = false;
    winner = '';
    loop(); // 重新開始遊戲循環
  }
}