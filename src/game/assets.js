game.module(
    'game.assets'
)
.require(
	'engine.renderer'
)
.body(function() {
    
// game.addAsset('sprite.png');
// game.addAudio('audio/music.m4a', 'music');

/*var graphics = new game.Graphics();
graphics.beginFill(0x00cc00);
graphics.drawCircle(25, 25, 25);
graphics.endFill();
graphics.beginFill(0x000000);
graphics.drawRect(25, 25, 25, 2);
graphics.endFill();
game.TextureCache['circle'] = graphics.generateTexture();*/

/*var graphics = new game.Graphics();
graphics.beginFill(0xff0000);
graphics.drawCircle(25, 25, 25);
graphics.endFill();
graphics.beginFill(0x000000);
graphics.drawRect(25, 25, 25, 2);
graphics.endFill();
game.TextureCache['enemy'] = graphics.generateTexture();*/

/*graphics.clear();
graphics.beginFill(0xffffff);
graphics.drawCircle(5, 5, 5);
graphics.endFill();
game.TextureCache['snowball'] = graphics.generateTexture();*/
game.addAsset('logo.png', 'logo')
game.addAsset('background.png', 'background')
game.addAsset('player.png', 'player');
game.addAsset('enemy.png', 'enemy');
game.addAsset('snowball.png', 'snowball');
game.addAsset('up_d_s.png', 'up_d_s');
game.addAsset('up_ad_s.png', 'up_ad_s');
game.addAsset('up_h_s.png', 'up_h_s');
game.addAsset('tree2.png', 'tree');
//game.addAsset('main_background.png', 'main_background');

game.addAsset('font.fnt');

game.addAudio('audio/upgrade.wav', 'upgrade');
game.addAudio('audio/throw.wav', 'throw');

});
