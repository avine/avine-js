/* Avine. Copyright (c) 2013-2015 Stéphane Francel (http://avine.fr). Dual licensed under the MIT and GPL Version 2 licenses. */

(function ($) {

	var plugin = $.fn.plugin('dashboard', {

		tick: 100 // ms

	}, {

		start: function (fn) {
			this.reset();
			fn.call(this);
			this.update();
			this.delay(this.options.tick).then(function () {
				this.callMethod('start', fn);
				this.done();
			});
		},
		stop: function () {
			this.stop();
		},
		restart: function () {
			this.restart();
		},

		reset: function () {
			this.reset();
		},
		add: function (content, title, position) {
			this.add(content, title, position);
		},
		update: function () {
			this.update();
		}

	});

	plugin.extendProto($.fn.plugin.helper);

	plugin.extendProto({

		init: function () {
			this.bag('main', 'panel', 'title', 'content');
			this.addClass(this.bag.main);
			this.reset();
		},
		reset: function () {
			this.panel = [];
		},
		add: function (content, title, position) {
			if (undefined === position) position = this.panel.length;
			this.panel[position] = { title: title, content: content };
		},
		update: function () {
			this.html('');
			for (var i = 0; i < this.panel.length; i++) {
				if (!this.panel[i]) continue;
				var title = this.panel[i].title,
					content = this.panel[i].content,
					$panel = $(this.tag('div', this.bag.panel));
				if (title) $panel.append(this.tag('div', this.bag.title, title));
				$panel.append(this.tag('div', this.bag.content, this._content2Html(content)));
				this.append($panel.get(0));
			}
		},
		_content2Html: function (content) {
			if (!$.tool.isObject(content)) return content;
			var html = '';
			for (var prop in content) html += '<em>' + prop + ':</em> ' + content[prop] + '<br />';
			return html;
		}

	});

})(avine.$);
