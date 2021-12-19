const players = {};
const recHitboxes = {};
const speed = 100;
const jumpForce = 200;
const hitRecoil = 50;
var playersSize = 0;
var attacking;

class level_1 extends Phaser.Scene {
  levelToLoad
  constructor() {
    super('level_1')
  }

  preload() {
    this.load.image('star', 'assets/star_gold.png');
    this.load.image('hitbox', 'assets/hitbox.png');
  
    this.load.atlas('playerSprite', 'assets/characters/LightBandit.png', 
    'assets/characters/player_1_spr.json');
  
    this.load.image('tiles', 'assets/maps/tilesets/tileset.png');
    this.load.tilemapTiledJSON('tilemap', 'assets/maps/tilemaps/Level_1.json');
    this.load.image('bg','assets/maps/tilesets/Level_1-bg.png' );


  }
  
  create() {
    this.levelToLoad = 'Main_Menu';

    const self = this;
    this.players = this.physics.add.group();
    this.recHitboxes = this.physics.add.group();
  
    this.physics.world.setBounds(0, 0, config.width, config.height);

    this.add.image(0, 0, 'bg').setOrigin(0)
    
    /** Create map */
    const map = this.make.tilemap({ key: 'tilemap', tileWidth: 32, tileHeight: 32 });
    const tileset = map.addTilesetImage('fantasy_tiles_backless', 'tiles');
    
    const groundLayer = map.createDynamicLayer('Platform_Layer', tileset, 0, 0);
    const backLayer = map.createDynamicLayer('Background_Layer', tileset);
    
    groundLayer.setCollisionByProperty({ collides: true });
    backLayer.setCollisionByProperty({ collides: true });


  
    io.on('connection', function (socket) {
      playersSize += 1;
        if (playersSize % 2 == 0 && playersSize <= 8) {
        //playersSize -= 1
        console.log('Number of users connected: ' + playersSize);
        // create a new player and add it to our players array
        players[socket.id] = {
          rotation: 0,
          x: 300 + (playersSize * 40),
          y: 172,
          playerId: socket.id,
          playerNo: playersSize,
          health: 100,
          invincible: false,
          dead: false,
          attacking: false,
          activeHit: false,
          grounded: false,
          loopAnim: false,
          anim: 'idle_anim',
          curFrame: 0,
          input: {
            left: false,
            right: false,
            up: false,
            keyA: false,
            keyD: false
          }
        };
  
        recHitboxes[socket.id] = {
          playerId: socket.id,
          active: false
        };
        
        // add player & their hitbox to server
        addPlayer(self, players[socket.id]);
        // setup collision for players
        playerCollision(self, groundLayer, backLayer);
        // send the players object to the new player
        socket.emit('currentPlayers', players);
        // update all other players of the new player
        socket.broadcast.emit('newPlayer', players[socket.id]);
        
        socket.on('disconnect', function () {
          if (playersSize > 0) {
            playersSize -= 1;
          }
          console.log('user disconnected');
          // remove player from server
          removePlayer(self, socket.id);
          // remove this player from our players object
          delete players[socket.id];
          // emit a message to all players to remove this player
          io.emit('disconnect', socket.id);
        });
  
        // when a player moves, update the player data
        socket.on('playerInput', function (inputData) {
          handlePlayerInput(self, socket.id, inputData);
        });
  
        socket.on('currentFrame', function (index) {
          setFrame(self, socket.id, index);
        });
        
        // when an attack animation is finished, update data
        socket.on('setAttack', function (bool) {
          setAttacking(self, socket.id, bool);
        });

        socket.on('setActiveHit', function (bool) {
          setActiveHit(self, socket.id, bool);
        })

        // Set invincibility to false after animation is finished
        socket.on('setVincible', function () {
          setInvincibility(self, socket.id);
        });

        socket.on('deadPlayer', function (playerId) {
          countTheDead(self, playersSize, playerId);
        });

        socket.on('GameOver', function () {
          self.players.getChildren().forEach((player) => {
            removePlayer(self, player.playerId);
            // remove this player from our players object
            delete players[player.playerId];
            // emit a message to all players to remove this player
            io.emit('disconnect', player.playerId);
          });
          self.scene.start(self.levelToLoad);
        });
      }
    });

    this.physics.add.overlap(this.players, this.players, this.triggerHit, false, this)
  }

  triggerHit(player, target) {
    const self = this;
    if (!players[target.playerId].invincible && players[player.playerId].activeHit) {
      players[target.playerId].health -= 34/2;
      console.log(players[target.playerId].health);
      if (players[target.playerId].health <= 0) { 
        players[target.playerId].dead = true;
        countTheDead(self, playersSize, target.playerId);
      }
      players[target.playerId].anim = 'hit_anim';
      players[target.playerId].loopAnim = true;
      players[target.playerId].flipX = (players[player.playerId].flipX) ? false : true;
      players[target.playerId].invincible = true;
    }
  }
  
  update() {
    const self = this;
    var end = false;

    this.players.getChildren().forEach((player) => {
      const input = players[player.playerId].input;
      attacking = players[player.playerId].attacking;
  
      if (players[player.playerId].invincible) {
        var velocity = (players[player.playerId].flipX) ? hitRecoil * -1 : hitRecoil;
        player.body.setVelocityX(velocity);
      }
      
      if (players[player.playerId].dead) {
        player.body.setVelocityX(0);
        player.body.setVelocityY(0);
        player.anim = 'death_anim';
      }

      if (!attacking && !players[player.playerId].dead && !players[player.playerId].invincible) {
        if (input.left) {
          player.body.setVelocityX(-speed);
          player.flipX = false;
          if (!player.body.onFloor()) {
            player.anim = 'jump_anim';
          } else {
            player.anim = 'run_anim';
          }
          player.loopAnim = true;
        } else if (input.right) {
          player.body.setVelocityX(speed);
          player.flipX = true;
          if (!player.body.onFloor()) {
            player.anim = 'jump_anim';
          } else {
            player.anim = 'run_anim';
          }
          player.loopAnim = true;
        } else if (player.body.onFloor()) {
          player.body.setVelocityX(0);
          player.anim = 'idle_anim';
          player.loopAnim = true;
        }
  
        if (player.body.onFloor() && input.up) {
          player.body.setVelocityY(-jumpForce);
          player.anim = 'jump_anim';
        }
    
        if (input.keyA) {
          //console.log(`Player ${playersSize} attacked`);
          player.body.setVelocityX(0);
          player.body.setVelocityY(0);
          player.anim = 'atk_anim';
          attacking = true;
          player.loopAnim = true; 
          recHitboxes[player.playerId].x = players[player.playerId].x;
          recHitboxes[player.playerId].y = players[player.playerId].y; 
          console.log(players[player.playerId].health);   
        }
      }
  
      players[player.playerId].x = player.x;
      players[player.playerId].y = player.y;
      players[player.playerId].rotation = player.rotation;
      players[player.playerId].flipX = player.flipX;
      players[player.playerId].anim = player.anim;
      players[player.playerId].loopAnim = player.loopAnim;
      players[player.playerId].curFrame = player.curFrame;
      players[player.playerId].attacking = attacking;
    });
  
    
    io.emit('playerUpdates', players);
  }
}
  
function handlePlayerInput(self, playerId, input) {
  self.players.getChildren().forEach((player) => {
    if (playerId === player.playerId) {
      players[player.playerId].input = input;
    }
  });
}
  
function setAttacking(self, playerId, bool) {
  self.players.getChildren().forEach((player) => {
    if (playerId === player.playerId) {
      players[player.playerId].attacking = bool;
    }
  });
}

function setActiveHit(self, playerId, bool) {
  if (!bool) {
    self.players.getChildren().forEach((player) => {
      if (playerId === player.playerId) {
        players[player.playerId].activeHit = bool;
      }
    });
  } else {
    self.players.getChildren().forEach((player) => {
      if (playerId === player.playerId) {
        players[player.playerId].activeHit = bool;
      }
    })
  }
}

function setInvincibility(self, playerId) {
  self.players.getChildren().forEach((player) => {
    if (playerId === player.playerId) {
      players[player.playerId].invincible = false;
    }
  });
}
  
function addPlayer(self, playerInfo) {
  const player = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'playerSprite').setOrigin(0.5, 0.5);
  player.setSize(playerInfo.width, 40, true);
  player.body.collideWorldBounds = false;
  player.body.onWorldBounds = true;
  player.playerId = playerInfo.playerId;
  self.players.add(player);

  const hit  = self.add.rectangle(0, 0, 13, 37, 0xffffff, 0);
  self.physics.add.existing(hit);
  self.physics.world.enable(hit);
  hit.playerId = playerInfo.playerId;
  self.recHitboxes.add(hit);
}

function hitboxCollision(players, recHitboxes) {
  if (recHitboxes[player.playerId].playerId !== players[player.playerId].playerId) {
    console.log("hit");
    if (!players[player.playerId].invincible) {
      console.log("check invinc");
      players[player.playerId].health -= 50;
      players[player.playerId].anim = 'hit_anim';
      players[player.playerId].invincible = true;
      console.log(players[player.playerId].health);
      if (players[player.playerId].health <= 0) {
        console.log("dying");
        // Death logic 
      }
    }
  }
}
  
function playerCollision(self, groundLayer, backLayer) {
  self.physics.add.collider(self.players, groundLayer);// Add collision with ground
  self.physics.add.collider(self.players, backLayer);



}

function countTheDead(self, playersSize, playerId) {
    var dead = 0;
    var lastPlayer = 0;
    self.players.getChildren().forEach((player) => {
      if (players[player.playerId].dead) {
        dead += 1;
        console.log(`Dead: ${dead}`);
      }
    });
  
    if (dead >= (playersSize/2 -1)) {
      console.log("Change Scene")
      self.players.getChildren().forEach((player) => {
        if (!players[player.playerId].dead) {
          lastPlayer = players[player.playerId].playerNo;
          console.log(`Last Player: ${lastPlayer}`);
        }
      });
      io.emit('gameOverChange', lastPlayer);
    }
}
  
function removePlayer(self, playerId) {
    self.players.getChildren().forEach((player) => {
      if (playerId === player.playerId) {
        player.destroy();
      }
    });
  
    self.recHitboxes.getChildren().forEach((recHitbox) => {
      if (playerId === recHitbox.playerId) {
        recHitbox.destroy();
      }
    });
}