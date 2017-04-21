/* Avine. Copyright (c) 2013-2015 Stéphane Francel (http://avine.fr). Dual licensed under the MIT and GPL Version 2 licenses. */

(function($){

	var text = {
		intro: "<strong>Welcome to Avine Quest !</strong><br /><br /> Drag the pin to push the car.<br /> " +
			"Don't crash into the barriers.<br /> Pick the gifts !<br />",
		win: '<strong class="quest-win">You win !</strong>',
		lose: '<strong class="quest-lose">You lose !</strong>',
		next: "<br /><em>&lt; Click to continue &gt;</em>",
		level: "Level",
		last: "Last chance !",
		over: "Game over !",
		hits: "Gifts",
		timer: "Timer",
		speed: "Speed",
		totalSuccess: "Reached level",
		totalFailure: "Lost games",
		totalTimer: "Total timer",
		totalHits: "Total gifts"
	};

	var plugin = $.fn.plugin('quest', {

		area: { minSize: 300, alternate: 'alternate' },
		message: { animation: 700 },
		player: { border: 25, maxLost: 3 },
		ball: { spanFactor: 4, timeFactor: 15000 },
		goal: { total: 3 },
		danger: { percent: 7 },
		global: { filling: 350, refresh: $.dom.duration.MIN },
		text: text

	}, {

		getStatus: function () {
			var status = {}, infos = ['hits', 'timer', 'speed'];
			for (var i = 0; i < infos.length; i++)
			status[this.options.text[infos[i]]] = this.getInfos(infos[i]);
			return status;
		}

	});

	plugin.extendProto($.fn.plugin.helper);

	plugin.extendProto({

		init: function () {
			this.bag('wrapper', 'layer', 'area', 'preload', 'message', 'intro', 'level', 'player', 'ball', 'goal', 'danger');
			this.size = {};
			this.initWrapper();
			this.initArea();
			this.original = { goalTotal: this.options.goal.total, dangerPercent: this.options.danger.percent };
			this.newGame();
		},
		newGame: function() {
			this.options.goal.total = this.original.goalTotal;
			this.options.danger.percent = this.original.dangerPercent;
			this.current = {};
			this.result = { success: 0, failure: 0, hits: 0, timer: 0 };
			this.removeClass(this.options.area.alternate);
			this.start();
		},
		initWrapper: function () {
			this.addClass(this.bag.wrapper);
			var min = this.options.area.minSize,
				max = $.dom.coords(window),
				c = this.coords(),
				w = Math.min(c.width, max.width),
				h = Math.min(c.height > 99 ? c.height : w, max.height);
			if (w < min) w = min;
			if (h < min) h = min;
			this.css({ width: w + 'px', height: h + 'px' }); // Prevent resize
			this.size.wrapper = { width: w, height: h };
		},
		addLayer: function (classAddon) {
			var w = this.size.wrapper,
				$div = $('<div>').addClass(this.bag.layer).zIndex().appendTo(this);
			if (classAddon) $div.addClass(classAddon);
			return $div;
		},
		initArea: function () {
			this.$area = this.addLayer(this.bag.area);
		}

	});

	plugin.extendAsync({

		start: function () {
			this.$area.html('');
			var lost = 0, maxLost = this.options.player.maxLost;
			if (0 === this.result.success + this.result.failure) {
				this.preload();
				this.message(this.options.text.intro, this.bag.intro);
			} else if (this.current.success) {
				var alt = this.options.area.alternate;
				this.then(function() {
					var game = this;
					if (alt) this.$area.hide(250);
					this.$area.then(function() {
						game.options.goal.total++;
						game.options.danger.percent++;
						if (alt) game.toggleClass(alt);
						this.done();
					}).thenDone(this);
				}).preload().then(function() {
					if (alt) this.$area.show(250).thenDone(this);
				});
			} else {
				lost = ++this.current.lost;
				if (maxLost === lost) {
					this.message('<strong>' + this.options.text.over + '</strong>', this.bag.level, false);
					this.delay(3000).then(function () {
						this.$msg.trigger('avn-quest-close-message');
						this.delay(this.options.message.animation);
						this.done();
					}).then(function() {
						this.newGame();
						this.done();
					});
					return this.done();
				}
			}
			this.current = {
				over: false,
				timer: { begin: 0, end: 0 },
				goalsHits: [],
				coords: {},
				lost: lost
			};
			var msg = '<strong>' + this.options.text.level + ' ' + (this.result.success + 1) + '</strong>';
			if (maxLost - 1 === lost) msg += '<br /><em>' + this.options.text.last + '</em>';
			this.message(msg, this.bag.level, false);
			this.then(function (action) {
				this[action]();
				this.done();
			}, ['addPlayer', 'addBall', 'addGoals', 'addDangers']);
			this.then(function() {
				this.$msg.trigger('avn-quest-close-message');
				this.delay(this.options.message.animation);
				this.done();
			}).then(function() {
				this.$player.drag({ follow: true });
				this.update(true);
				this.done();
			});
			this.done();
		},
		preload: function () {
			var images = {}, count = 0, ready = 0,
				$preload = $('<div>').addClass(this.bag.preload).appendTo(this.$area);
			var game = this, onload = function () {
				if (++ready < count) return;
				$preload.remove();
				game.done();
			};
			for (var bag in this.bag) {
				var $img = $('<img>').addClass(this.bag[bag]).appendTo($preload),
					src = $img.css('background-image').replace(/^url\(("|')?|("|')?\)$/g, '');
				if ("none" == src || src in images) continue;
				++count;
				images[src] = $img;
			}
			for (var src in images) images[src].on('load', onload).attr('src', src);
			if (!count) onload();
		},
		message: function (html, classAddon, click2Close, from) {
			click2Close = !!(undefined === click2Close || click2Close);
			var start = ['top', 'right', 'bottom', 'left'];
			if (!$.tool.inArray(from, start)) from = start[parseInt(Math.random() * start.length, 10)];
			var pos = 'left', size = this.size.wrapper.width;
			if ($.tool.inArray(from, ['top', 'bottom'])) {
				pos = 'top'; size = this.size.wrapper.height;
			}
			var state = [-size, 0, size];
			if ($.tool.inArray(from, ['right', 'bottom'])) state.reverse();
			for (var i = 0; i < state.length; i++) {
				var o = {};
				o[pos] = state[i] + 'px';
				state[i] = o;
			}
			if (click2Close) html += this.options.text.next;
			var msgClass = [this.bag.message];
			if (classAddon) msgClass.push(classAddon);
			var game = this,
				anim = this.options.message.animation;
			this.$msg = $('<div>').html(html).addClass(msgClass).css(state[0]).animate(state[1], anim, 'easeInOutBack');
			var $layer = this.addLayer().css({ opacity: '0', overflow: 'hidden' }).append(this.$msg).show(anim, .9, 'easeOutQuad');
			this.$msg.on('avn-quest-close-message', function () {
				game.$msg.animate(state[2], anim, 'easeInOutBack');
				$layer.hide(anim, 0, 'easeInQuad').then(function () {
					this.remove();
					this.done();
				});
				if (click2Close) $layer.thenDone(game);
			});
			if (click2Close) return this.$msg.css('cursor', 'pointer').click(function() {
				game.$msg.trigger('avn-quest-close-message');
			}, true);
			this.done();
		}

	});

	plugin.extendProto({

		add2Area: function (bag, idSuffix) {
			var $bag = this['$' + bag] = $(this.tag('div', this.bag[bag], '', idSuffix));
			$bag.css({ visibility: 'hidden' }).appendTo(this.$area);
			var c = $bag.coords();
			this.size[bag] = { width: c.width, height: c.height };
		},
		addRandItem: function (bag, idSuffix, test) {
			this.add2Area(bag, idSuffix);
			var w = this.size.wrapper, b = this.size[bag];
			var $bag = this['$' + bag], noOverlap = true, game = this;
			$bag.css({
				left: parseInt(Math.random() * (w.width - b.width), 10) + 'px',
				top: parseInt(Math.random() * (w.height - b.height), 10) + 'px'
			});
			this.$area.children().each(function() {
				var bag = $bag.get(0);
				if (this === bag) return;
				var delta = (this === game.$player.get(0)) ? -game.options.player.border : 0;
				if ($.dom.isInElement(this, bag, false, delta)) noOverlap = false;
			});
			if (noOverlap || (test > 20)) {
				$bag.css({ visibility: 'visible' });
			} else {
				$bag.remove();
				test = test || 0;
				this.addRandItem(bag, idSuffix, test++);
			}
			delete this['$' + bag]; // Useless property...
		}

	});

	plugin.extendAsync({

		addRandItems: function (bag, count) {
			var base = this.options.global.filling, game = this;
			for (var i = 0; i < count; i++) (function (i) {
				game.delay(base - base * i / count).then(function () {
					game.addRandItem(bag, i + 1);
					this.done();
				});
			})(i);
			this.delay(base);
			this.done();
		}

	});

	plugin.extendProto({

		addPlayer: function () {
			var b = this.options.player.border;
			this.add2Area('player');
			this.$player.css({
				top: 5 - b + 'px',
				left: 5 - b + 'px',
				opacity: 0,
				visibility: 'visible'
			}).show(this.options.global.filling);
		},
		addBall: function () {
			this.add2Area('ball');
			var w = this.size.wrapper,
				b = this.size.ball;
			this.$ball.css({
				left: parseInt((w.width - b.width) / 2, 10) + 'px',
				top: parseInt((w.height - b.height) / 2, 10) + 'px',
				opacity: 0,
				visibility: 'visible'
			}).show(this.options.global.filling);
		},
		addGoals: function () {
			this.addRandItems('goal', this.options.goal.total);
		},
		addDangers: function () {
			this.addRandItem('danger', '0');
			var w = this.size.wrapper,
				d = this.size.danger,
				count = parseInt((w.width * w.height) / (d.width * d.height) * this.options.danger.percent / 100, 10);
			this.addRandItems('danger', count - 1);
		},
		update: function (beginNow) {
			if (this.current.over) return;
			var now = new Date().getTime();
			if (beginNow) {
				this.current.timer.begin = now;
				this.$dangers = this.$area.find('.' + this.bag.danger);
				this.$goals = this.$area.find('.' + this.bag.goal);
			}
			this.current.timer.end = now;
			var game = this;
			this.delay(this.options.global.refresh).then(function () {
				var ball = this.$ball.get(0), average = (this.size.ball.width + this.size.ball.height) / 2;
				if (!$.dom.isInElement(ball, this.$area.get(0), true, -average/2)) this.finish(false);
				this.$dangers.each(function(){
					if ($.dom.isInElement(ball, this, false, -average/4)) game.finish(false);
				});
				this.$goals.each(function () {
					if ($.dom.isInElement(ball, this, false, -average/6)) game.updateGoals(this);
				});
				this.updateCoords();
				this.kickBall();
				this.update();
				this.done();
			});
		},
		updateGoals: function (goal) {
			if ($.tool.inArray(goal.id, this.current.goalsHits)) return;
			this.current.goalsHits.push(goal.id);
			var $goal = $(goal).hide(200);
			if (this.current.goalsHits.length == this.options.goal.total) this.finish(true);
		},
		updateCoords: function () {
			var now = {
				player: this.$player.coords(),
				ball: this.$ball.coords()
			},
			prev = this.current.coords.prev || { player: now.player, ball: now.ball },
			speed = {
				player: {
					left: (now.player.left - prev.player.left),
					top: (now.player.top - prev.player.top)
				}, ball: {
					left: (now.ball.left - prev.ball.left),
					top: (now.ball.top - prev.ball.top)
				}
			},
			coords = {
				player: now.player.relative,
				ball: now.ball.relative,
				speed: {
					left: speed.player.left + speed.ball.left,
					top: speed.player.top + speed.ball.top
				}
			};
			coords.player.speedAbs = hypotenuse(speed.player.left, speed.player.top);
			coords.ball.speedAbs = hypotenuse(speed.ball.left, speed.ball.top);
			coords.speed.abs = hypotenuse(coords.speed.left, coords.speed.top);
			function hypotenuse(x, y) {
				return Math.sqrt(Math.pow(Math.abs(x), 2) + Math.pow(Math.abs(y), 2));
			}
			this.current.coords = coords;
			this.current.coords.prev = now;
		},
		kickBall: function () {
			var inTouch = $.dom.isInElement(
				this.$player.get(0), this.$ball.get(0), false, -this.options.player.border
			);
			if (!inTouch) this.disableKick = false;
			if (!inTouch || this.disableKick) return;
			this.disableKick = true;
			var c = this.current.coords, b = this.options.ball;
			this.$ball.fail();
			this.$ball.animate({
				left: parseInt(c.ball.left + c.speed.left * b.spanFactor, 10) + 'px',
				top: parseInt(c.ball.top + c.speed.top * b.spanFactor, 10) + 'px'
			}, b.timeFactor / c.speed.abs, 'easeOutQuad', undefined, true);
		},
		finish: function (success) {
			if (this.current.over) return;
			this.current.over = true;
			this.current.success = success;
			this.result[success ? 'success' : 'failure']++;
			this.result.hits += this.current.goalsHits.length;
			this.result.timer += this.current.timer.end - this.current.timer.begin;
			this.$ball.fail();
			var game = this;
			this.delay(500).then(function () {
				this.doneWhen(this.$ball.hide(100), this.$player.hide(100));
			}).delay(500).then(function () {
				this.doneWhen(this.$area.find('.' + this.bag.danger).hide(500));
			}).then(function(){
				this.doneWhen(this.$area.find('.' + this.bag.goal).hide(500));
			}).then(function() {
				this.showResult(success);
				this.done();
			});
		},
		showResult: function (success) {
			var t = this.options.text;
				html = (success ? t.win : t.lose) + ' <br /><br /> ' + this.getGlobalInfos() + '<br />';
			this.message(html, this.bag.intro);
			this.start();
		},
		getInfos: function (info) {
			switch (info) {
				case 'hits':
					if (undefined === this.current.goalsHits) return '0/0';
					return this.current.goalsHits.length + '/' + this.options.goal.total;
				case 'timer':
					var delay = this.current.timer ? (this.current.timer.end - this.current.timer.begin) : 0;
					return plugin.delayFormat(delay, true);
				case 'speed':
					var speed = 0, c = this.current.coords;
					if (!this.current.over && c && c.ball) {
						speed = parseInt(c.ball.speedAbs * 100 / this.options.global.refresh, 10);
					}
					return plugin.delayLength(speed, 3); // (px/10)/sec
			}
		},
		getGlobalInfos: function () {
			var html = [], infos = {
				totalSuccess: this.result.success,
				totalFailure: this.result.failure,
				totalHits: this.result.hits,
				totalTimer: plugin.delayFormat(this.result.timer)
			};
			for (var p in infos) html.push(
				'<span class="' + this.getClass('label') + '">' + this.options.text[p] + '</span>' +
				'<span class="' + this.getClass('info') + '">' + infos[p] + '</span>'
			);
			return html.join('');
		}

	});

	plugin.extendStatic({

		delayFormat: function (delay, precise) {
			var date = new Date(delay),
				h = plugin.delayLength(date.getUTCHours(), 2),
				m = plugin.delayLength(date.getUTCMinutes(), 2),
				s = date.getUTCSeconds(),
				p = date.getUTCMilliseconds();
			p = precise ? plugin.delayLength((s + p / 1000).toFixed(1), 4) : plugin.delayLength(s, 2);
			return ('00' == h ? '' : h + ':') + m + ':' + p;
		},
		delayLength: function (delay, size) {
			delay = delay + '';
			for (var i = delay.length; i < size; i++) delay = '0' + delay;
			return delay;
		}

	});

})(avine.$);
