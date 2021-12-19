class Main_Menu extends Phaser.Scene {
    levelToLoad;
    constructor() {
        super('Main_Menu');
    }

    create() {
        this.levelToLoad = 'level_1';
        const self = this;

        io.on('connection', function (socket) {
            console.log("connected");

            socket.on('disconnect', function() {
                console.log("Dconnected");
                io.emit('disconnect', socket.id);
                self.scene.start(self.levelToLoad);
            });
        });
    }
}