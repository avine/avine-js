/* Avine. Copyright (c) 2013-2015 Stéphane Francel (http://avine.fr). Dual licensed under the MIT and GPL Version 2 licenses. */

(function ($) {

	var propList = function (object) {
		var list = [];
		for (var prop in object) list.push(prop);
		return list;
	},

	hasChanged = function (source, target) {
		for (var prop in source) if (target[prop] != source[prop]) return true;
		return false;
	},

	isEmpty = function (array) {
		for (var i = 0; i < array.length; i++) if (undefined !== array[i]) return false;
		return true;
	},

	plugin = function (name, settings, prototype, methods) {

		settings = settings || {};

		var Plugin = function (element) {
			this.$element = $(element);
			this.pluginName = name; // helper for debugging
			this.pluginMethods = propList(methods); // helper for debugging
		};

		$.extend(Plugin.prototype = {
			_wakeup: function (options) {
				this.optionsHasChanged = !!(options && this.options && hasChanged(options, this.options));
				if (!this.options || options) this.options = $.extend({}, settings, options || {});
				if (this.isInit && 'init' in this) this.init.apply(this, arguments);
				if ('wakeup' in this) this.wakeup.apply(this, arguments);
			},
			callMethod: function (action) {
				if (action in methods) return methods[action].apply(this, Array.prototype.slice.call(arguments, 1));
			}
		}, prototype || {});

		methods = methods || {};
		if (!methods.getPluginInstance) methods.getPluginInstance = function () { return this; }; // helper for debugging

		var dataName = 'jquery-create-plugin-instance-' + name,
		fn = function (action) {
			var result = [], args = arguments;
			$.each(this, function () {
				var $this = $(this), p = $this.data(dataName), isInit = (undefined === p), r; // p=plugin, r=result
				if (isInit) $this.data(dataName, p = new Plugin(this)); // Store the new instance
				p.isInit = isInit;
				if (!(action in methods)) {
					p._wakeup.apply(p, args || []);
					if (p.options.defaultMethod && !p.optionsHasChanged) r = methods[p.options.defaultMethod].apply(p);
				} else {
					p._wakeup();
					r = methods[action].apply(p, Array.prototype.slice.call(args, 1));
				}
				result.push(r);
			});
			if (isEmpty(result)) return this;
			return (1 == result.length) ? result[0] : result;
		};

		// Expose configuration
		fn.settings = settings;
		fn.methods = methods;

		// Extend jQuery
		$.fn[name] = fn;
	};

	$.createPlugin = plugin;

})(jQuery);