game.module(
    'game.main'
)
.require(
	'engine.system',
	'engine.audio',
	'engine.renderer',
	'engine.storage',
    'game.assets',
    'game.objects'
)
.body(function() {

if (!Array.prototype.fill) {
	Array.prototype.fill = function(v) {
		for (var i = 0; i < this.length; i++) {
			this[i] = v;
		}
		
		return this;
	}
}

SPAWN_RADIUS_2	= 90000; // Only spawn out of radius, center is player
SPAWN_PER_UPDATE= 1;
SPAWN_TIME		= 1500;
SPAWN_TIME_2	= 3.5 * SPAWN_TIME;

BACKGROUND = null;

function textSort(a, b) {
	if (a instanceof game.BitmapText && 
		!(b instanceof game.BitmapText)) {
		return 1;
	}
	else if (b instanceof game.BitmapText &&
		!(a instanceof game.BitmapText)) {
		return -1;
	}
	
	return 0;
}

game.createScene('Main', {
	backgroundColor: 0xf1f1f1,
	
    init: function() {
		if (!game.storage.get('highscores')) {
			game.storage.set('highscores', new Array(5).fill(0));
		}
		
		BACKGROUND = new game.Sprite('background', 0, 0);
		
		this.showMenu();
    },
    
    showMenu: function() {
		this.stage.removeChildren();
		
		BACKGROUND.addTo(this.stage);
		//new game.Sprite('main_background').center().addTo(this.stage);
		var logo = new game.Sprite('logo');
		logo.anchor.set(0.5, 0.5);
		logo.position.set(game.system.width / 2,
			game.system.height / 2 - 150);
		logo.scale.set(1.1, 1.2);
		logo.addTo(this.stage);
		
		var text = new game.BitmapText('New game', { font: 'font' });
		text.position.set(game.system.width / 2 - text.width / 2, 
			game.system.height / 2 - 50);
		text.interactive = true;
		text.click = this._newGame;
		text.addTo(this.stage);
		
		text = new game.BitmapText('Highscores', { font: 'font' });
		text.position.set(game.system.width / 2 - text.width / 2, 
			game.system.height / 2 + 50);
		text.interactive = true;
		text.click = this._showHighscores.bind(this);
		text.addTo(this.stage);
		
		text = new game.BitmapText('A W D S to move', { font: 'font' });
		text.position.set(10, 10);
		text.scale.set(0.5, 0.5);
		text.interactive = true;
		text.click = this._showHighscores.bind(this);
		text.addTo(this.stage);
		
		text = new game.BitmapText('Click to throw snowball', { font: 'font' });
		text.position.set(10, 50);
		text.scale.set(0.5, 0.5);
		text.interactive = true;
		text.click = this._showHighscores.bind(this);
		text.addTo(this.stage);
	},
    
    _newGame: function() {
		game.system.setScene('Game');
	},
	
	_showHighscores: function() {
		this.stage.removeChildren();
		
		BACKGROUND.addTo(this.stage);
		var highscores = game.storage.get('highscores');
		var text;
		
		for (var i = 0; i < highscores.length; i++) {
			text = new game.BitmapText((i + 1) + '. ' + highscores[i], 
				{ font: 'font' });
			text.scale.set(0.8, 0.8);
			text.position.set(game.system.width / 2 - text.width / 2, 
				150 + 50 * i);
			text.addTo(this.stage);
			text.interactive = true;
			text.click = this.showMenu.bind(this);
		}
		
		text = new game.BitmapText('Back', { font: 'font' });
		text.scale.set(0.8, 0.8);
		text.position.set(game.system.width / 2 - text.width / 2, 
			450);
		text.addTo(this.stage);
		text.interactive = true;
		text.click = this.showMenu.bind(this);
	}
});

game.createScene('Game', {
	backgroundColor: 0xf1f1f1,
	score: 0,
	
    init: function() {
		BACKGROUND.addTo(this.stage);
		
		this.world = new game.World({
			gravity: [0, 0],
			emitImpactEvent: true
		});
		this.world.ratio = 10;
		
		var ent = new game.Entity('tree', 200, 400, 0).addTo(this.stage);
		ent.addToGameScene();
		ent = new game.Entity('tree', 500, 700, 0).addTo(this.stage);
		ent.addToGameScene();
		ent = new game.Entity('tree', 800, 100, 0).addTo(this.stage);
		ent.addToGameScene();
		ent = new game.Entity('tree', 350, 200, 0).addTo(this.stage);
		ent.addToGameScene();
		ent = new game.Entity('tree', 850, 450, 0).addTo(this.stage);
		ent.addToGameScene();
		
		var wallShape, wallBody;
		
		wallShape = new game.Rectangle(
			game.system.width * 2 / this.world.ratio, 3);
		wallBody = new game.Body({
			position: [0, 0]
		});
		wallBody.addShape(wallShape);
		this.world.addBody(wallBody);
		
		wallShape = new game.Rectangle(
			game.system.width * 2 / this.world.ratio, 3);
		wallBody = new game.Body({
			position: [0, game.system.height / this.world.ratio]
		});
		wallBody.addShape(wallShape);
		this.world.addBody(wallBody);
		
		wallShape = new game.Rectangle(
			3, game.system.height * 2 / this.world.ratio);
		wallBody = new game.Body({
			position: [0, 0]
		});
		wallBody.addShape(wallShape);
		this.world.addBody(wallBody);
		
		wallShape = new game.Rectangle(
			3, game.system.height * 2 / this.world.ratio);
		wallBody = new game.Body({
			position: [game.system.width / this.world.ratio, 0]
		});
		wallBody.addShape(wallShape);
		this.world.addBody(wallBody);
		
		this.player = new game.Player();
		this.player.addToGameScene();
		this.playerAlive = true;
		
		this.spawnPerUpdate = SPAWN_PER_UPDATE;
		this.addTimer(SPAWN_TIME, this.spawnEnemy.bind(this), true);
		this.addTimer(SPAWN_TIME_2, this.spawnUpgrade.bind(this), true);
		
		this.world.on('impact', this.impactObserver.bind(this));
		
		this.scoreText = new game.BitmapText('Socre: 0', { font: 'font' });
		this.scoreText.scale.set(0.8, 0.8);
		this.scoreText.position.set(10, 10);
		this.scoreText.addTo(this.stage);
		
		this.gameOverText = new game.BitmapText(
			'You\'re infected\n\r(Return to menu)', { font: 'font' });
		this.gameOverText.position.set(
			game.system.width / 2 - this.gameOverText.width / 2,
			game.system.height / 2 - this.gameOverText.height / 2);
		this.gameOverText.interactive = true;
		this.gameOverText.click = this._main;
    },
    
    impactObserver: function(e) {
		if (e.bodyA.gc === 'enemy' && e.bodyB.gc === 'snowball') {
			this._snowballEnemy(e.bodyB.entity, e.bodyA.entity);
		}
		else if (e.bodyA.gc === 'snowball' && e.bodyB.gc === 'enemy') {
			this._snowballEnemy(e.bodyA.entity, e.bodyB.entity);	
		}
		else if (e.bodyA.gc === 'enemy' && e.bodyB.gc === 'player' ||
			e.bodyA.gc === 'player' && e.bodyB.gc === 'enemy') {
			// game over
			this._playerEnemy();
		}
		else if (e.bodyA.gc === 'upgrade' && e.bodyB.gc === 'player') {
			// active upgrade
			this._upgradePlayer(e.bodyA.entity, e.bodyB.entity);
		}
		else if (e.bodyA.gc === 'player' && e.bodyB.gc === 'upgrade') {
			this._upgradePlayer(e.bodyB.entity, e.bodyA.entity);
		}
	},
	
	_snowballEnemy: function(snowball, enemy) {
		enemy.remove();
		
		if (snowball.duration === 1) {
			snowball.remove();
		} else {
			snowball.duration -= 1;
			snowball.scale.set(snowball.scale.x - 0.1,
				snowball.scale.y - 0.1);
		}
		
		this.score += 1;
		this.scoreText.setText('Score: ' + this.score);
	},
    
    _upgradePlayer: function(upgrade, player) {
		if (this.playerAlive) {
			upgrade.remove();
			player.upgrades.push(upgrade);
			
			game.audio.play('upgrade', false, 0.5);
		}
	},
	
	_playerEnemy: function() {
		this.playerAlive = false;
		this.player.remove();
		var highscores = game.storage.get('highscores');
		
		for (var i = 0; i < highscores.length; i++) {
			if (highscores[i] < this.score) {
				highscores.splice(i, 0, this.score);
				highscores.pop();
				break;
			}
		}
		
		game.storage.set('highscores', highscores);
		this.gameOverText.addTo(this.stage);
	},
    
    spawnValid: function(x, y) {
		var centeredX = x - this.player.x,
			centeredY = y - this.player.y;
		// x^2 + y^2 = r^2
		// (x - x0)^2 + (y - y0)^2 = r^2
		if ((centeredX * centeredX + centeredY * centeredY)
			<= SPAWN_RADIUS_2) {
			return false; // invalid, in radius
		}
		
		return true; // valid, out of radius
	},
    
    spawnEnemy: function() {		
		if (ENEMY_COUNT < ENEMY_MAX) {
			var border = 3 * this.world.ratio,
				x, y;
			for (var i = 0; i < this.spawnPerUpdate; i++) {
				do {
					x = Math.random(border,
						game.system.width - border);
					y = Math.random(border,
						game.system.height - border);
				} while (!this.spawnValid(x, y));
				
				game.spawner.createEnemy(x, y, this.player);
				
				this.stage.children.sort(textSort);
			}
		}
	},
	
	spawnUpgrade: function() {
		this.spawnPerUpdate += 1;
		
		if (UPGRADE_COUNT < UPGRADE_MAX) {
			var border = 3 * this.world.ratio,
				x = Math.random(border,
					game.system.width - border);
				y = Math.random(border,
					game.system.height - border);
					
			game.spawner.createUpgrade(x, y);
			
			this.stage.children.sort(textSort);
		}
	},
    
    _main: function() {
		ENEMY_COUNT = 0;
		UPGRADE_COUNT = 0;
		SNOWBALL_COUNT = 0;
		game.system.setScene('Main');
	},
    
    click: function(e) {
		if (this.playerAlive) {
			this.player.snowball(e);
			game.audio.play('throw', false, 0.4);
		}
	},
	
	mousemove: function(e) {
		if (this.playerAlive) {
			this.player.rotate(e.global.x, e.global.y);
		}
	}
});

});
