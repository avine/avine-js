/* Avine. Copyright (c) 2013-2015 Stéphane Francel (http://avine.fr). Dual licensed under the MIT and GPL Version 2 licenses. */

(function ($) {

	var plugin = $.fn.plugin('loading', {

		className: "",				// Addon class of the loading <div>
		bgColor: "white",			// Background color
		opacityDelay: 100,			// Duration of the background opacity animation
		opacity: .5,				// Background opacity
		progressDelay: 1000,		// Delay before showing the loader.gif
		progress: 'images/loader.gif',
		error: 'images/error.png',
		css: {						// Default loading css
			"position": "absolute",
			"z-index": "9999",
			"top": "0",
			"left": "0",
			"width": "100%",
			"height": "100%",
			"background-repeat": "no-repeat",
			"background-position": "center center"
		},
		defaultMethod: 'progress'

	}, {

		progress: function () {
			var bg = this.$loading.css("background-image");
			if (!bg.match(this.options.progress) && !this.$loading.data('loading-delay')) {
				if (!bg.match(this.options.error)) {
					var _this = this;
					this.$loading.data('loading-delay', setTimeout(function () {
						_this.$loading.css("background-image", 'url(' + _this.options.progress + ')');
						_this.$loading.data('loading-delay', null);
					}, this.options.progressDelay));
				} else {
					this.$loading.css("background-image", 'url(' + this.options.progress + ')');
				}
			}
		},
		success: function () {
			this._clearDelay();
			this.$loading.css("background-image", "none");
		},
		error: function () {
			this._clearDelay();
			this.$loading.css("background-image", 'url(' + this.options.error + ')');
		},
		complete: function () {
			this._clearDelay();
			this.$loading.css({ "background-image": "none", "display": "none" });
		},
		remove: function () {
			this.$loading.remove();
		}

	});

	plugin.extendProto($.fn.plugin.helper);

	plugin.extendProto({

		init: function () {
			this.bag('screen');
		},
		wakeup: function () {
			if ("static" === this.css("position")) this.css("position", "relative");
			this.$loading = this.find("." + this.bag.screen);
			var size = this.$loading.size();
			if (!size) this.$loading = $(this.tag("div", this.bag.screen)).css("display", "none").appendTo(this);
			if (!size || this.optionsHasChanged) {
				for (var rule in this.options.css) this.$loading.css(rule, this.options.css[rule]);
				if (this.options.className) this.$loading.addClass(this.options.className);
				if (this.options.bgColor) this.$loading.css("background-color", this.options.bgColor);
			}
			if ("none" === this.$loading.css("display")) {
				this.$loading.css({ "display": "block", "opacity": 0 }).animate({ "opacity": this.options.opacity }, this.options.opacityDelay);
			} else if (this.optionsHasChanged) {
				this.$loading.css("opacity", this.options.opacity);
			}
		},
		_clearDelay: function () {
			var delay = this.$loading.data('loading-delay');
			if (!delay) return;
			clearTimeout(delay);
			this.$loading.data('loading-delay', null);
		}

	});

})(avine.$);
