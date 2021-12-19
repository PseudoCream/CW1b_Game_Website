var config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 1280,
  height: 704,
  scene: [Main_Menu, level_1]
};

var game = new Phaser.Game(config);
var attacking;