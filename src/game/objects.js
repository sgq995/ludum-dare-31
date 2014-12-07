game.module(
    'game.objects'
)
.require(
	'engine.renderer',
	'engine.tween',
	'engine.pool',
	'plugins.p2'
)
.body(function() {

pool = new game.Pool();

PLAYER_VMAX		= 12;

SNOWBALL_MAX	= 25;
SNOWBALL_COUNT	= 0;
SNOWBALL_VEL	= 50;
pool.create('snowball');

ENEMY_MAX	= 15;
ENEMY_COUNT	= 0;
ENEMY_VMAX	= 8;
pool.create('enemy');

UPGRADE_MAX		= 5;
UPGRADE_COUNT	= 0;
pool.create('upgrade');

Math.TWO_PI		= 2 * Math.PI;
Math.HALF_PI	= Math.PI / 2;

function limit(max, n) {
	return Math.min(max, Math.max(-max, n));
}

function normalizeAngle(angle) {
	if (angle < 0) {
		do {
			angle += Math.TWO_PI;
		} while (angle < 0);
	}
	else if (angle > Math.TWO_PI) {
		do {
			angle -= Math.TWO_PI;
		} while (angle > Math.TWO_PI);
	}
	
	return angle;
}

game.createClass('Spawner', {
	createSnowball: function(x, y, angle) {
		var snowball = pool.get('snowball');
		angle = normalizeAngle(angle);
	
		if (!snowball) {
			if (SNOWBALL_COUNT <= SNOWBALL_MAX) {
				snowball = new game.Snowball(x, y);
			}
			else {
				return;
			}
		}
		
		snowball.rotate(angle);
		snowball.move(x, y);
		snowball.body.velocity[0] = SNOWBALL_VEL * Math.cos(angle);
		snowball.body.velocity[1] = SNOWBALL_VEL * Math.sin(angle);
		snowball.addToGameScene();
		SNOWBALL_COUNT += 1;
		
		return snowball;
	},
	
	createEnemy: function(x, y, target) {
		var enemy = pool.get('enemy');
		
		if (!enemy) {
			if (ENEMY_COUNT < ENEMY_MAX) {
				enemy = new game.Enemy(x, y, target);
			}
			else {
				return;
			}
		}
		
		enemy.move(x, y);
		enemy.addToGameScene();
		ENEMY_COUNT	+= 1;
		
		return enemy;
	},
	
	createUpgrade: function(x, y) {
		var upgrade = pool.get('upgrade');
		
		if (!upgrade) {
			if (UPGRADE_COUNT < UPGRADE_MAX) {
				upgrade = new game.Upgrade(x, y, game.Upgrade.random());
			}
			else {
				return;
			}
		} else {
			var type = game.Upgrade.random();
			upgrade.setTexture(game.Upgrade.getTexture(type));
			upgrade.type = type;
		}
		
		upgrade.move(x, y);
		upgrade.addToGameScene();
		UPGRADE_COUNT += 1;
		
		return upgrade;
	}
});

game.spawner = new game.Spawner();

game.createClass('Entity', 'Sprite', {
    init: function(texture, x, y, mass) {
		mass = typeof mass === 'number' ? mass : 1;
		
		this._super(texture, x, y);
		this.anchor.set(0.5, 0.5);
		
		var sprite = this;
		this.body = new game.Body({
			mass: mass,
			angle: sprite.rotation,
			position: [sprite.x / game.scene.world.ratio,
				sprite.y / game.scene.world.ratio]
		});
		this.body.addShape(new game.Circle(
			this.width / 2 / game.scene.world.ratio));
		this.body.entity = this;
    },
    
    update: function() {
		this.position.set(
			this.body.position[0] * game.scene.world.ratio,
			this.body.position[1] * game.scene.world.ratio);
	},
	
	rotate: function(gx, gy) {
		var angle;
		
		if (gx && gy) {
			var x = gx - this.position.x,
				y = gy - this.position.y;
			
			angle = Math.atan2(y, x);
			if (angle < 0) {
				angle += Math.TWO_PI;
			}
		} else {
			angle = gx;
		}
		
		this.rotation = this.body.angle = angle;
	},
	
	move: function(x, y) {
		this.position.set(x, y);
		
		/*this.body.position = [x / game.scene.world.ratio,
			y / game.scene.world.ratio];*/
		
		this.body.position[0] = x / game.scene.world.ratio;
		this.body.position[1] = y / game.scene.world.ratio;
	},
	
	addToGameScene: function() {
		game.scene.addObject(this);
		game.scene.stage.addChild(this);
		game.scene.world.addBody(this.body);
	},
	
	remove: function() {
		this.body.velocity[0] = this.body.velocity[1] = 0;
		
		game.scene.world.removeBody(this.body);
		game.scene.stage.removeChild(this);
		game.scene.removeObject(this);
	}
});

game.createClass('Snowball', 'Entity', {
	duration: 1,
	
	init: function(x, y) {
		this._super('snowball', x, y);
		
		this.body.gc = 'snowball';
		
		this.tween = new game.Tween(this);
		this.tween.onComplete(this.onComplete.bind(this));
		this.tween.to({
			alpha: 0.2
		}, 1000);
	},
	
	addToGameScene: function() {
		this.tween.start();
		this._super();
	},
	
	onComplete: function() {
		this.remove();
		this.alpha = 1;
		this.scale.set(1, 1);
		this.duration = 1;
		pool.put('snowball', this);
		SNOWBALL_COUNT -= 1;
	}
});

// Powerup
game.createClass('Upgrade', 'Entity', {
	init: function(x, y, type) {		
		var texture = game.Upgrade.getTexture(type);
		this._super(texture, x, y);
		
		this.body.gc = 'upgrade';
		
		this.type = type;
		this.tween = new game.Tween(this.scale);
		this.tween.to({
			x: 1.2,
			y: 1.2
		}, 500);
		this.tween.repeat();
		this.tween.yoyo();
	},
	
	addToGameScene: function() {
		this.tween.start();
		this._super();
	},
	
	active: function(player) {		
		switch(this.type) {
		case game.Upgrade.DOUBLE_SHOOT:
			return game.Upgrade._doubleShoot(player);
		case game.Upgrade.HYPER_SHOOT:
			return game.Upgrade._hyperShoot(player);
		case game.Upgrade.ALL_DIR_SHOOT:
			return game.Upgrade._allDirShoot(player);
		}
	},
	
	remove: function() {
		this._super();
		pool.put('upgrade', this);
		UPGRADE_COUNT -= 1;
	}
});
game.Upgrade.DOUBLE_SHOOT	= 0;
game.Upgrade.HYPER_SHOOT	= 1; // more duration
game.Upgrade.ALL_DIR_SHOOT	= 2;

game.Upgrade.random = function() {
	return Math.round(Math.random(0, 2));
};

game.Upgrade.getTexture = function(type) {
	switch(type) {
	case game.Upgrade.DOUBLE_SHOOT:
		return 'up_d_s';
	case game.Upgrade.HYPER_SHOOT:
		return 'up_h_s';
	case game.Upgrade.ALL_DIR_SHOOT:
		return 'up_ad_s';
	}
};

game.Upgrade._doubleShoot = function(player) {	
	var x = player.width * Math.cos(player.rotation - Math.HALF_PI / 6) + 
			player.position.x,
		y = player.height * Math.sin(player.rotation - Math.HALF_PI / 6) + 
			player.position.y;
	game.spawner.createSnowball(x, y, player.rotation);
	
		x = player.width * Math.cos(player.rotation + Math.HALF_PI / 6) + 
			player.position.x,
		y = player.height * Math.sin(player.rotation + Math.HALF_PI / 6) + 
			player.position.y;
	game.spawner.createSnowball(x, y, player.rotation);
};
	
game.Upgrade._hyperShoot = function(player) {
	var x = player.width * Math.cos(player.rotation) + player.position.x,
		y = player.height * Math.sin(player.rotation) + player.position.y;
		
	var snowball = game.spawner.createSnowball(x, y, player.rotation);
	snowball.scale.set(1.5);
	snowball.duration = 5;
};
	
game.Upgrade._allDirShoot = function(player) {
	var rotation = player.rotation,
		x, y;
		
	for (i = 0; i < 8; i++) {
		x = player.width * Math.cos(rotation) + player.position.x;
		y = player.height * Math.sin(rotation) + player.position.y;
		
		game.spawner.createSnowball(x, y, rotation);
		rotation = normalizeAngle(Math.HALF_PI / 2 + rotation);
	}
};
/*game.Upgrade.getDuration = function(type) {
	switch(type) {
	case game.Upgrade.DOUBLE_SHOOT:
		return 5;
	case game.Upgrade.HYPER_SHOOT:
		return 3;
	case game.Upgrade.ALL_DIR_SHOOT:
		return 1;
	}
};*/

game.createClass('Player', 'Entity', {
	upgrades: [], // queue
	
	init: function() {
		this._super('player', game.system.width / 2,
			game.system.height / 2);
		
		this.body.gc = 'player';
	},
	
	update: function() {
		var vx = 0,
			vy = 0;
			
		if (game.keyboard.down("A")) {
			vx = -0.1;
		}
		if (game.keyboard.down("W")) {
			vy = -0.1;
		}
		if (game.keyboard.down("D")) {
			vx = 0.1;
		}
		if (game.keyboard.down("S")) {
			vy = 0.1;
		}
		
		this.body.velocity[0] += limit(PLAYER_VMAX, vx * game.scene.world.ratio);
		this.body.velocity[1] += limit(PLAYER_VMAX, vy * game.scene.world.ratio);
		
		this._super();
	},
	
	snowball: function(e) {		
		if (this.upgrades.length > 0) {
			this.upgrades.shift().active(this);
		} else {
			var x = this.width * Math.cos(this.rotation) + this.position.x,
				y = this.height * Math.sin(this.rotation) + this.position.y;
			
			game.spawner.createSnowball(x, y, this.rotation);
		}
	}
});

game.createClass('Enemy', 'Entity', {
	target: null,
	
	init: function(x, y, target) {
		this._super('enemy', x, y);
		
		this.body.gc = 'enemy';
		
		this.target = target;
	},
	
	update: function() {
		this.rotate(this.target.position.x, this.target.position.y);
		
		this.body.velocity[0] = limit(ENEMY_VMAX, 
			this.target.position.x - this.position.x);
		this.body.velocity[1] = limit(ENEMY_VMAX,
			this.target.position.y - this.position.y);
		
		this._super();
	},
	
	remove: function() {
		this._super();
		pool.put('enemy', this);
		ENEMY_COUNT -= 1;
	}
});

});
