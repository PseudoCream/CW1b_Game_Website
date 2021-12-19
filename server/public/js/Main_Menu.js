class Main_Menu extends Phaser.Scene {
    levelToLoad;
    constructor() {
        super('Main_Menu');
    }

    preload() {
        this.load.audio("BGMusic", ["Assets/Sounds/BGMusic.ogg","Assets/Sounds/BGMusic.mp3"])
        this.load.audio("GameClick", ["Assets/Sounds/GameClick.ogg","Assets/Sounds/GameClick.mp3"])
        this.load.audio("ButtonClick", ["Assets/Sounds/ButtonClick.ogg","Assets/Sounds/ButtonClick.mp3"])

        this.load.spritesheet("buttons", "Assets/Buttons/image (10).png", {frameWidth: 200, frameHeight: 100}, 2);
        this.load.spritesheet("settings", "Assets/Buttons/image (2).png", {frameWidth: 80, frameHeight: 68}, 2);

        this.load.image('background', 'Assets/Background/background.png');
        this.load.image('mountains', 'Assets/Background/mountains.png');
        this.load.image('Keyboard', 'Assets/keyboard-layout.png');
    }

    create() {
        this.levelToLoad = 'level_1';
        this.socket = io();
        const self = this;

        this.BGMusic = this.sound.add('BGMusic');
        this.GameClick = this.sound.add('GameClick');
        this.ButtonClick = this.sound.add('ButtonClick');

        this.add.image(0,0,'background').setOrigin(0, 0);
        this.add.image(0,300,'mountains').setOrigin(0, 0);
        this.add.image(350,300,'mountains').setOrigin(0, 0);
        this.add.image(725,300,'mountains').setOrigin(0, 0);
        this.add.image(1025,300,'mountains').setOrigin(0, 0);
        this.add.image(0,400,'mountains').setOrigin(0, 0);
        this.add.image(350,400,'mountains').setOrigin(0, 0);
        this.add.image(725,400,'mountains').setOrigin(0, 0);
        this.add.image(1025,400,'mountains').setOrigin(0, 0);

        this.helpImg = this.add.image(config.width/2, config.height/2 - 30,'Keyboard');
        this.helpImg.setOrigin(0.5, 0.5);
        this.helpImg.setAlpha(0);

        this.helpText = this.add.text(config.width/2, 250, "Controls", {fontFamily: "Inknut Antiqua"}, {fontSize: '86px', fill: '#fff'});
        this.helpText.setOrigin(0.5);
        this.helpText.setAlpha(0);

        this.text1 = this.add.text(config.width/2, 100, "Champions of Iverdia", {fontFamily: "Inknut Antiqua"}, {fontSize: '128px', fill: '#fff'});
        this.text1.setOrigin(0.5);
        this.text1.depth = 100;
        

        // Start Game button
        this.button1 = this.add.image(config.width/2, config.height/2 - 30, 'buttons').setInteractive()
        this.button1Text = this.add.text(this.button1.x, this.button1.y, 'Start Game', {fontFamily: "Inknut Antiqua"}, {fontSize: '48px', fill: '#fff'});
        this.button1Text.setOrigin(0.5);
        this.button1.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => {
            console.log("hovering");
        });
        this.button1.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
            console.log("pressed");
            this.GameClick.play();
        });
        this.button1.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
            console.log("released");
            self.scene.start(self.levelToLoad);
        });

        // Help Button
        this.button2 = this.add.image(640, this.button1.y + this.button1.width * 0.5, 'buttons').setInteractive()
        this.button2Text = this.add.text(this.button2.x, this.button2.y, 'Controls', {fontFamily: "Inknut Antiqua"}, {fontSize: '48px', fill: '#fff'});
        this.button2Text.setOrigin(0.5);
        this.button2.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
            console.log("pressed");
            this.ButtonClick.play();
        });
        this.button2.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
            console.log("released");
            this.button1.setAlpha(0);
            this.button1Text.setAlpha(0);
            this.button2.setAlpha(0);
            this.button2Text.setAlpha(0);
            this.helpImg.setAlpha(1);
            this.helpText.setAlpha(1);
            this.button3.setActive(true);
            this.button3Text.setActive(true);
            this.button3.setAlpha(1);
            this.button3Text.setAlpha(1);
        });

        // Back Button
        this.button3 = this.add.image(120, config.height - this.button1.width - 10, 'buttons').setInteractive()
        this.button3Text = this.add.text(this.button3.x, this.button3.y, '<- Back', {fontFamily: "Inknut Antiqua"}, {fontSize: '48px', fill: '#fff'});
        this.button3Text.setOrigin(0.5);
        this.button3.setActive(false);
        this.button3Text.setActive(false);
        this.button3.setAlpha(0);
        this.button3Text.setAlpha(0);
        this.button3.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
            console.log("pressed");
            this.ButtonClick.play();
        });
        this.button3.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
            console.log("released");
            this.button1.setAlpha(1);
            this.button1Text.setAlpha(1);
            this.button2.setAlpha(1);
            this.button2Text.setAlpha(1);
            this.helpImg.setAlpha(0);
            this.button3.setActive(false);
            this.button3Text.setActive(false);
            this.button3.setAlpha(0);
            this.button3Text.setAlpha(0);
        });


        this.BGMusic.play();
    }

    update() {}
}