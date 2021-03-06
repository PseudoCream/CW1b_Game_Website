class level_1 extends Phaser.Scene {
  levelToLoad
  constructor() {
    super('level_1')
  }

  preload() {
    this.load.audio('attack', ["Assets/Sounds/Whoosh.wav"])
    this.load.audio('hit', ["Assets/Sounds/Stab.wav"])
    this.load.audio('death', ["Assets/Sounds/Death.wav"])

    this.load.image('star', 'assets/star_gold.png');
    this.load.image('hitbox', 'assets/hitbox.png');
      
    this.load.atlas('playerSprite', 'assets/characters/LightBandit.png', 
    'assets/characters/player_1_spr.json');
      
    this.load.image('tiles', 'assets/maps/tilesets/tileset.png');
    this.load.tilemapTiledJSON('tilemap', 'assets/maps/tilemaps/Level_1.json');
    this.load.image('bg','assets/maps/tilesets/Level_1-bg.png' );
  }
      
  /** functions for each individual player */
  create() {
    this.levelToLoad = 'Main_Menu';
    
    var self = this;
    this.socket = io();
    this.players = this.add.group();
    this.recHitboxes = this.add.group();
    attacking = false;

    // sounds
    this.hit_sound = this.sound.add('hit');
    this.attack_sound = this.sound.add('attack');
    this.death_sound = this.sound.add('death');

    this.add.image(0, 0, 'bg').setOrigin(0)
    /** Create map */
    const map = this.make.tilemap({ key: 'tilemap', tileWidth: 32, tileHeight: 32 })
    const tileset = map.addTilesetImage('tileset', 'tiles')
      
    const groundLayer = map.createDynamicLayer('Platform_Layer', tileset, 0, 0)
    const backLayer = map.createDynamicLayer('Background_Layer', tileset)
      
    setupAnims(self);
      
    /** Display all players */
    this.socket.on('currentPlayers', function (players) {
      Object.keys(players).forEach(function (id) {
        if (players[id].playerId === self.socket.id) {
          displayPlayers(self, players[id], 'playerSprite');
        } else {
          displayPlayers(self, players[id], 'playerSprite');
        }
      });
    });
      
    this.socket.on('newPlayer', function (playerInfo) {
      displayPlayers(self, playerInfo, 'playerSprite');
          
    });
      
    this.socket.on('disconnect', function (playerId) {
      self.players.getChildren().forEach(function (player) {
        if (playerId === player.playerId) {
          player.destroy();
        }
      });
    });
      
    this.socket.on('playerUpdates', function (players) {
      Object.keys(players).forEach(function (id) {
        self.players.getChildren().forEach(function (player) {
          if (players[id].playerId === player.playerId) {
            player.setRotation(players[id].rotation);
            player.setPosition(players[id].x, players[id].y);
            player.setFlipX(players[id].flipX);
      
            if (players[id].anim !== player.anim) {
              player.anims.play(players[id].anim, players[id].loopAnim);
            }

            if (players[id].dead) {
              self.death_sound.play();
              console.log(player.anims.currentFrame.index)
              if(player.anims.currentFrame.index > 9 && !player.invincible) {
                players[id].invincible = true;
                self.socket.emit('deadPlayer', id);
              }
            }
      
            if (players[id].invincible) {
              self.hit_sound.play();
              player.anims.play('hit_anim', true);
              if (player.anims.currentFrame.index === 1) {
                // set invincible to false
                self.socket.emit('setVincible');
              }
            }
      
            if (players[id].attacking) {
              self.attack_sound.play()
              player.anims.play('atk_anim', true);
              if(player.anims.currentFrame.index > 3 && player.anims.currentFrame.index < 7) {
                moveHitbox(self, players[id]);
              }
              if(player.anims.currentFrame.index > 3 && player.anims.currentFrame.index < 5) {
                self.socket.emit('setActiveHit', true);
              } else {
                self.socket.emit('setActiveHit', false);
              }
              if(player.anims.currentFrame.index > 7) {
                self.socket.emit('setAttack', false);
              }
            }
          }
        });
      });
    });

    this.socket.on('gameOverChange', function (lastPlayer) {
      self.blackScreen.setVisible(true);
      self.blackScreen.setActive(true);
      self.gameOverText.setVisible(true);
      self.gameOverText.setText(`Player ${lastPlayer} Wins\n Click anywhere to restart`);
    });
      
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyX = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.leftKeyPressed = false;
    this.rightKeyPressed = false;
    this.upKeyPressed = false;
    this.keyApressed = false;
    this.keyDpressed = false;

    this.blackScreen = this.add.rectangle(0, 0, config.width *2, config.height* 2, 0x000000, 1).setInteractive();
    this.blackScreen.setOrigin(0.5, 0.5);
    this.blackScreen.depth = 100;
    this.blackScreen.setVisible(false);
    self.blackScreen.setActive(false);
    this.gameOverText = this.add.text(config.width/2, config.height/2, ``, {fontFamily: "Inknut Antiqua"}, {fontSize: '58px', fill: '#fff'});
    this.gameOverText.setOrigin(0.5);
    this.gameOverText.depth = 120;
    this.gameOverText.setVisible(false);
    this.blackScreen.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, function () {
      self.socket.emit('GameOver');
      self.scene.start(self.levelToLoad);
    })
    }
      
    update() {
    //#region Controls
    const left = this.leftKeyPressed;
    const right = this.rightKeyPressed;
    const up = this.upKeyPressed;
    const keyA = this.keyApressed;
    const keyD = this.keyDpressed;

    if (this.cursors.left.isDown) {
      this.leftKeyPressed = true;
    } else if (this.cursors.right.isDown) {
      this.rightKeyPressed = true;
    } else {
      this.leftKeyPressed = false;
      this.rightKeyPressed = false;
    }
      
    if (this.cursors.up.isDown) {
      this.upKeyPressed = true;
    } else {
      this.upKeyPressed = false;
    }
      
    if (this.keyA.isDown) {
      this.keyApressed = true;
    } else {
      this.keyApressed = false;
    }
        
    if (this.keyD.isDown) {
      this.keyDpressed = true;
    } else {
      this.keyDpressed = false;
    }
        
    if (left !== this.leftKeyPressed || right !== this.rightKeyPressed || up !== this.upKeyPressed || keyA !== this.keyApressed || keyD !== this.keyDpressed) {
      this.socket.emit('playerInput', { left: this.leftKeyPressed , right: this.rightKeyPressed, up: this.upKeyPressed, keyA: this.keyApressed, keyD: this.keyDpressed });
    }
  }
  //#endregion
}

function setupAnims(self) {
    self.anims.create({ 
      key: 'idle_anim', 
      frames: self.anims.generateFrameNames('playerSprite', 
      { 
          prefix: 'idle_sprite0', 
          end: 4, 
      }), 
      frameRate: 6,
      repeat: -1 
  });

  self.anims.create({
      key: 'hostile_anim',
      frames: self.anims.generateFrameNames('playerSprite',
      {
          prefix: 'hostile_sprite0',
          end: 4,
      }),
      frameRate: 6,
      repeat: -1
  });

  self.anims.create({ 
      key: 'run_anim', 
      frames: self.anims.generateFrameNames('playerSprite', 
      { 
          prefix: 'run_sprite0', 
          end: 8,
      }), 
      frameRate: 6,
      repeat: -1
  });

  self.anims.create({
      key: 'atk_anim',
      frames: self.anims.generateFrameNames('playerSprite',
      {
          prefix: 'attack_sprite0',
          end: 8,
      }),
      frameRate: 12,
      repeat: 0
  });

  self.anims.create({
      key: 'death_anim',
      frames: self.anims.generateFrameNames('playerSprite',
      {
          prefix: 'death_sprite0',
          end: 9,
      }),
      frameRate: 6,
      repeat: 0,
      hideOnComplete: true
  });

  self.anims.create({
      key: 'jump_anim',
      frames: self.anims.generateFrameNames('playerSprite',
      {
          prefix: 'jump_sprite0',
          end: 1,
      }),
      repeat: -1
  });

  self.anims.create({
      key: 'hit_anim',
      frames: self.anims.generateFrameNames('playerSprite',
      {
          prefix: 'hit_sprite0',
          end: 2,
      }),
      frameRate: 2,
      repeat: 0
  });
}

function displayPlayers(self, playerInfo, sprite) {
  const player = self.add.sprite(playerInfo.x, playerInfo.y, sprite).setOrigin(0.5, 0.5);
  player.setSize(playerInfo.width, 40, true);
  const recHitbox = self.add.rectangle(playerInfo.x, playerInfo.y, 28, 38, 0xffffff, 0)
  player.setTint(0xff0000);
  player.playerId = playerInfo.playerId;
  recHitbox.playerId = playerInfo.playerId;
  self.players.add(player);
  self.recHitboxes.add(recHitbox);
}

function moveHitbox(self, playerInfo) {
  self.recHitboxes.getChildren().forEach((recHitbox) => {
    if (recHitbox.playerId === playerInfo.playerId) {
      recHitbox.flipX = playerInfo.flipX;
      recHitbox.setPosition(playerInfo.x, playerInfo.y);
    }
  });
}