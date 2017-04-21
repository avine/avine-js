/* Avine. Copyright (c) 2013-2015 Stéphane Francel (http://avine.fr). Dual licensed under the MIT and GPL Version 2 licenses. */

(function ($) {

	var name = 'loading', // Plugin name

	settings = {
		className: "", // Class addon of the loading data <div>
		bgColor: "#fff", // Background color
		opacityDelay: 100, // Delay to animate background opacity
		opacity: .5, // Background opacity
		progressDelay: 1000, // Delay before showing the loader.gif
		progress: 'images/loader.gif',
		error: 'images/error.png',
		css: { // Default loading css
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
	},

	prototype = {
		wakeup: function () {
			if ("static" === this.$element.css("position")) this.$element.css("position", "relative");
			this.$loading = this.$element.children("." + name);
			var size = this.$loading.size();
			if (!size) this.$loading = $("<div>").addClass(name).css("display", "none").appendTo(this.$element);
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
		clearDelay: function () {
			var delay = this.$loading.data(name + '-delay');
			if (!delay) return;
			clearTimeout(delay);
			this.$loading.data(name + '-delay', null);
		}
	},

	methods = {
		progress: function () {
			var bg = this.$loading.css("background-image");
			if (!bg.match(this.options.progress) && !this.$loading.data(name + '-delay')) {
				if (!bg.match(this.options.error)) {
					var _this = this;
					this.$loading.data(name + '-delay', setTimeout(function () {
						_this.$loading.css("background-image", 'url(' + _this.options.progress + ')');
						_this.$loading.data(name + '-delay', null);
					}, this.options.progressDelay));
				} else {
					this.$loading.css("background-image", 'url(' + this.options.progress + ')');
				}
			}
		},
		success: function () {
			this.clearDelay();
			this.$loading.css("background-image", "none");
		},
		error: function () {
			this.clearDelay();
			this.$loading.css("background-image", 'url(' + this.options.error + ')');
		},
		complete: function () {
			this.clearDelay();
			this.$loading.css({ "background-image": "none", "display": "none" });
		},
		remove: function () {
			this.$loading.remove();
		}
	};

	// Generate the new jQuery method $.fn.loading
	$.createPlugin(name, settings, prototype, methods);

})(jQuery);