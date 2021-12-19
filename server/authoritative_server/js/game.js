const config = {
  type: Phaser.HEADLESS,
  parent: 'phaser-example',
  width: 1280,
  height: 720,
  scene: [level_1, Main_Menu],
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { y: 150 }
    }
  },
  autoFocus: false
};

const game = new Phaser.Game(config);
window.gameLoaded();

var winningPlayer;