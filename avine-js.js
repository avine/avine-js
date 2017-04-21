/* Avine. Copyright (c) 2013-2015 S. Francel (http://avine.fr). Dual licensed under the MIT and GPL Version 2 licenses. */

// avine-tool.js
(function (window) {
	"use strict";

	// Polyfill
	if (!Function.prototype.bind) Function.prototype.bind = function (oThis) {
		if (typeof this !== "function") throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
		var aArgs = Array.prototype.slice.call(arguments, 1), fToBind = this, fNOP = function () {}, fBound = function () {
			return fToBind.apply(this instanceof fNOP && oThis ? this : oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
		};
		fNOP.prototype = this.prototype;
		fBound.prototype = new fNOP();
		fBound.toString = function () { return "function () { [native code] }"; };
		return fBound;
	};

	var tool = {

		console: (function () {
			return window.console ? window.console : {
				log: function () { c("log", arguments); },
				error: function () { c("error", arguments); }
			};
			function c(t, m) { // c=console ; t=type ; m=messages
				if (window.console) switch (m.length) {
					case 0: break;
					case 1: window.console[t](m[0]); break;
					case 2: window.console[t](m[0], m[1]); break;
					case 3: window.console[t](m[0], m[1], m[2]); break;
					default: window.console.error("tool.console: Unable to display messages in console.\nThe function doesn't handle more than 3 arguments."); break;
				}
			}
		})(),

		asset: function (key, val) {
			if (undefined !== val) return tool.asset[key] = val;
			if (key in tool.asset) return tool.asset[key];
		},

		context: (function () {
			var context = {
				"CustomEvent": true,
				"JSON": false,
				"querySelectorAll": false,
				"ontouchstart": true, // Check Touch screen
				"requestAnimationFrame,cancelAnimationFrame": true
			};
			context.has = function (feature, _context) {
				var c = {}, p, f, i;
				for (p in context) if ('has' != p) for (f = p.split(','), i = 0; i < f.length; i++) c[f[i]] = context[p];
				for (f = feature.split(','), i = 0; i < f.length; i++) if (!(f[i] in (_context || window)) || false === c[f[i]]) return false;
				return true;
			};
			// Try the Custom event constructor (for ie9)
			if (context.has("CustomEvent")) try { new CustomEvent('_'); } catch (e) { context["CustomEvent"] = false; }
			return context;
		})(),

		isBoolean: function (data) {
			return false === data || !!data && Boolean === data.constructor;
		},

		isNumber: function (data) {
			return 0 === data || !!data && Number === data.constructor;
		},

		isString: function (data) {
			return '' === data || !!data && String === data.constructor;
		},

		isArray: function (data) {
			return !!data && Array === data.constructor;
		},

		isObject: function (data) {
			return !!data && Object === data.constructor;
		},

		isFunction: function (data) {
			return !!data && Function === data.constructor;
		},

		cleanString: function (str) {
			return (str || '').replace(/\s+/g, ' ').replace(/^\s|\s$/g, '');
		},

		// Split string by separator and remove multi-spaces from its parts
		splitString: function (str, sep, skipEmpty) {
			if (undefined === skipEmpty) skipEmpty = true;
			str = (str || '').split(sep);
			for (var split = [], n = str.length, i = 0; i < n; i++) {
				str[i] = tool.cleanString(str[i]);
				if (str[i] || !skipEmpty) split.push(str[i]);
			}
			return split;
		},

		merge2Array: function (array/*, arr1, arr2, ... */) {
			for (var n = arguments.length, i = 1; i < n; i++)
				for (var m = arguments[i].length, j = 0; j < m; j++)
					array.push(arguments[i][j]); // The original array is affected
			return array;
		},

		arrayLength: function (array, excludeList, stopAtFirst) {
			if (!excludeList) return array.length;
			for (var length = 0, n = array.length, i = 0; i < n; i++) {
				if (!tool.inArray(array[i], excludeList)) length++;
				else if (stopAtFirst) return length;
			}
			return length;
		},

		// Usefull to count the first defined arguments given to a function
		argsLength: function (args) {
			return tool.arrayLength(args, [undefined], true);
		},

		toArray: function (data) {
			if (tool.isArray(data)) return data;
			return [data];
		},

		inArray: function (value, array, strict) {
			if (undefined === strict) strict = true;
			if (strict && Array.indexOf) return !!~array.indexOf(value);
			var i, n = array.length, isEqual = strict ? function(a,b){return a===b;} : function(a,b){return a==b;};
			for (i = 0; i < n; i++) if (isEqual(value, array[i])) return true;
			return false;
		},

		arrayRemove: function (array, index, affect) {
			if (index < 0) index = array.length + index;
			for (var newArray = [], n = array.length, i = 0; i < n; i++) if (index != i) newArray.push(array[i]);
			if (affect && index >= 0 && index < array.length) {
				for (var i = index; i < array.length - 1; i++) array[i] = array[i + 1]; // The original array is affected
				array.pop();
			}
			return newArray;
		},

		arrayUnique: function (array, strict, affect) {
			for (var newArray = [], i = 0; i < array.length; i++) {
				if (!tool.inArray(array[i], newArray, strict)) {
					newArray.push(array[i]);
				} else if (affect) {
					tool.arrayRemove(array, i, true); // The original array is affected
					i--;
				}
			}
			return newArray;
		},

		arrayEach: function (array, callback, scope) {
			for (var i = 0; i < array.length; i++) if (i in array) callback.call(scope, array[i], i, array);
		},

		merge2Object: function (object/*, obj1, obj2, ... */) {
			for (var n = arguments.length, i = 1; i < n; i++)
				for (var j in arguments[i])
					object[j] = arguments[i][j]; // The original object is affected
			return object;
		},

		objectLength: function (object, excludeList, stopAtFirst) {
			var length = 0, prop;
			for (prop in object) {
				if (!excludeList || !tool.inArray(object[prop], excludeList)) length++;
				else if (stopAtFirst) return length;
			}
			return length;
		},

		objectEach: function (object, callback, scope) {
			for (var p in object) callback.call(scope, object[p], p, object);
		},

		each: function (data, callback, scope) {
			var fn = tool.isArray(data) ? "arrayEach" : tool.isObject(data) ? "objectEach" : undefined;
			if (fn) tool[fn](data, callback, scope);
			else tool.console.error("tool.each: Invalid parameter data (Array or Object expected).\n", data);
		},

		// Duplicate and merge a collection of variables into a data
		extend: function (data/*, addon1, addon2, ...*/) {
			for (var n = arguments.length, i = 1; i < n; i++) {
				if (tool.isObject(arguments[i])) {
					data = data || {};
					for (var j in arguments[i]) data[j] = tool.extend(null, arguments[i][j]);
				} else if (tool.isArray(arguments[i])) {
					data = data || [];
					for (var e, m = arguments[i].length, j = 0; j < m; j++) {
						e = tool.extend(null, arguments[i][j]);
						tool.isArray(data) ? data.push(e) : data[j] = e;
					}
				} else {
					data = arguments[i];
				}
			}
			return data;
		},

		stringify: function (data) {
			if (tool.context.has("JSON")) return JSON.stringify(data);
			var str = [];
			if (tool.isObject(data)) {
				for (var p in data) str.push( '"' + p + '":' + tool.stringify(data[p]));
				return '{' + str.join(',') + '}';
			}
			if (tool.isArray(data)) {
				for (var n = data.length, i = 0; i < n; i++) str.push(tool.stringify(data[i]));
				return '[' + str.join(',') + ']';
			}
			if (tool.isString(data)) return '"' + data.replace(/"/g, '\\"') + '"';
			return '' + data;
		},

		parse: function (data) {
			if (undefined === data) return undefined;
			try {
				if (tool.context.has("JSON")) return JSON.parse(data);
				var parse;
				eval('parse=' + data + ';');
				return parse;
			} catch (e) {
				tool.console.error(e.name + ': ' + e.message);
			}
		},

		// Return expected signature of arguments
		// Examples :
		// Bi.tool.signature([1], [Bi.tool.isNumber, Bi.tool.isBoolean])			=>  [1, undefined]
		// Bi.tool.signature([1, true], [Bi.tool.isNumber, Bi.tool.isBoolean])	=>  [1, true]
		// Bi.tool.signature([true], [Bi.tool.isNumber, Bi.tool.isBoolean])		=>  [undefined, true]
		signature: function (args, types) {
			for (var s = [], j = 0, i = 0; i < types.length; i++) s[i] = types[i](args[j]) ? args[j++] : undefined;
			return s;
		},

		matchAll: function (pattern, string, unique) {
			var matches = [], result;
			pattern = new RegExp(pattern);
			if (true === pattern.global) {
				while ((result = pattern.exec(string)) !== null) {
					if (!unique || !tool.inArray(result[0], matches)) matches.push(result[0]);
				}
			} else {
				tool.console.error('tool.matchAll: required "g" flag is missing in pattern= ' + pattern);
			}
			return matches;
		},

		uniqueId: (function () {
			var id = {};
			return function (key, initVal) {
				if (!(key in id)) id[key] = tool.isNumber(initVal) ? initVal : 1;
				return id[key]++;
			};
		})(),

		cssVendors: function (name, onlyPrefixed) {
			for (var vendors = ['-webkit-', '-moz-', '-ms-', '-o-'], i = 0; i < vendors.length; i++) vendors[i] += name;
			if (!onlyPrefixed) vendors.push(name);
			return vendors;
		},

		css2List: function (/*css1, css2, ...*/) {
			var list = [], a = arguments;
			for (var i = 0; i < a.length; i++) list.push(tool.isArray(a[i]) ? a[i].join(' ') : a[i]);
			return tool.arrayUnique(tool.splitString(list.join(' '), ' '));
		},

		css2JsProperty: function (name) {
			name = name.replace(/^\-/, '').split('-');
			for (var n = name.length, i = 1; i < n; i++) name[i] = name[i].charAt(0).toUpperCase() + name[i].substr(1);
			return name.join('');
		},

		jsProperty2Css: function (name) {
			var css = '', start = 0, upper = /[A-Z]/g, pos;
			while (true === upper.test(name)) {
				pos = upper.lastIndex - 1;
				css += name.substr(start, pos - start);
				if (0 != pos) css += '-';
				css += name.charAt(pos).toLowerCase();
				start = upper.lastIndex;
			}
			css += name.substr(start);
			return css;
		},

		css2JsStyle: function (/*rule1, rule2, ...*/) {
			var style = {}, rule;
			if (1 == tool.argsLength(arguments) && tool.isObject(arguments[0])) {
				rule = arguments[0];
			} else {
				rule = tool.css2Style.apply(this, arguments);
			}
			for (var p in rule) style[tool.css2JsProperty(p)] = rule[p];
			return style;
		},

		css2Style: function (/*rule1, rule2, ...*/) {
			var style = {}, rule = [], i, n;
			for (n = arguments.length, i = 0; i < n; i++) {
				rule = rule.concat(tool.isString(arguments[i]) ? tool.splitString(arguments[i], ';') : arguments[i]);
			}
			for (n = rule.length, i = 0; i < n; i++) {
				rule[i] = tool.splitString(rule[i], ':');
				style[rule[i][0]] = rule[i][1];
			}
			return style;
		},

		sheet2Object: function (css/*, rules*/) {
			var argsL = tool.argsLength(arguments), selector, rules;
			if (0 == argsL) return {};
			if (2 == argsL) {
				selector = arguments[0];
				rules = arguments[1];
				css = {};
				css[selector] = rules;
			}
			if (tool.isObject(css)) {
				for (selector in css) {
					if (tool.isObject(css[selector])) {
						rules = [];
						for (var property in css[selector]) rules.push(property + ': ' + css[selector][property] + ';');
						css[selector] = rules.join(' ');
					}
				}
			} else { // string
				var sheet = tool.splitString(css, '}');
				css = {};
				for (var n = sheet.length, i = 0; i < n; i++) {
					var args = tool.splitString(sheet[i], '{');
					selector = args[0];
					rules = args[1];
					css[selector] = rules;
				}
			}
			return css;
		},

		rgb2Hexa: function (rgb, getNumber) {
			var hexa = '', m = (rgb + '').replace(/\s/g, '').match(/rgb\(([0-9]{1,3}),([0-9]{1,3}),([0-9]{1,3})\)/i),
				unit = "0123456789ABCDEF";
			if (!m) return rgb;
			for (var i = 1; i <= 3; i++) hexa += unit.charAt((m[i] - m[i] % 16) / 16) + unit.charAt(m[i] % 16);
			if (getNumber) return hexa;
			return '#' + hexa;
		},

		hexa2Rgb: function (hexa, getArray) {
			var rgb = [], m = (hexa + '').match(/[0-9a-f]/gi) || [], s, h, i;
			switch (m.length) {
				case 3: s = 0; break; // "s" represents a shift
				case 6: s = 1; break;
				default: return hexa;
			}
			for (i = 0; i < 3; i++) {
				h = m[(s + 1)*i] + m[(s + 1) * i + s]; // "h" represents an hexa part
				rgb.push(parseInt(h || 0, 16));
			}
			if (getArray) return rgb;
			return 'rgb(' + rgb.join(', ') + ')';
		},

		hexaRanges: (function () {
			var hexaRange = function (from, to, steps) {
				from = tool.hexa2Rgb(from, true);
				to = tool.hexa2Rgb(to, true);
				for (var range = [], i = 0; i < steps; i++) range.push([]);
				for (var j = 0; j < 3; j++) for (var rgb, i = 0; i < steps; i++) {
					rgb = i < steps - 1 ? from[j] + (to[j] - from[j]) / steps * i : to[j];
					range[i].push(parseInt(rgb, 10));
				}
				for (var i = 0; i < range.length; i++) range[i] = tool.rgb2Hexa('rgb(' + range[i].join(',') + ')');
				return range;
			};
			return function (colors, steps) {
				while (colors.length > steps && colors.length > 2) {
					if (colors.length % 2) {
						colors[colors.length - 2] = colors[colors.length - 1];
						colors.pop();
					} else {
						colors[1] = colors[0];
						colors.shift();
					}
				}
				var l = colors.length,
					s = parseInt((steps + l - 2) / (l - 1), 10), // Sub-steps
					m = (steps + l - 2) % (l - 1); // Steps modulo
				for (var range = [], i = 1; i < l; i++) {
					if (1 < i) range.pop(); // Prevent overlap
					range = range.concat(hexaRange(colors[i - 1], colors[i], s + (l - 1 == i ? m : 0)));
				}
				return range;
			};
		})(),

		parseUrl: function (url) {
			var o = {}, p = ['pathname', 'origin', 'protocol', 'hostname', 'port', 'host', 'search', 'hash'],
				a = document.createElement('a'), i, s, e;
			a.href = url;
			for (i = 0; i < p.length; i++) o[p[i]] = a[p[i]];
			o.queries = {};
			s = a.search.replace(/^\?/, '');
			if (s.length) {
				s = s.split('&');
				for (i = 0; i < s.length; i++) {
					e = s[i].split('=');
					o.queries[e[0]] = decodeURIComponent(e[1]);
				}
			}
			return o;
		},

		buildSearch: function (queries) {
			if (tool.isString(queries)) {
				queries = queries.replace(/^[^\?=]*\?/, '').replace(/\?/g, '%3F');
				return tool.parseUrl('?' + queries).search;
			}
			var search = [], q, v;
			for (q in queries) {
				v = encodeURIComponent(decodeURIComponent(queries[q] || ''));
				search.push(q + (v ? '=' + v : ''));
			}
			return (search.length ? '?' : '') + search.join('&');
		}

	};

	// Expose avine
	window.avine = window.avine || {};
	window.avine.tool = tool;

})(this);

// avine-dom.js
(function (window) {
	//"use strict";

	var avine = window.avine;
	if (!avine || !avine.tool) return;
	var tool = avine.tool;

	var document = window.document;

	var dom = {

		duration: (function() {
			var duration = function (t) {
				if (0 === t) return 0;
				if ('slow' == t) return 1000;
				if (undefined === t) return 500;
				if ('fast' == t) return 200;
				if (t < duration.MIN) return duration.MIN;
				return t;
			};
			duration.MIN = 17; // ms (~ 60 FPS)
			if (tool.context.has("requestAnimationFrame,cancelAnimationFrame")) {
				duration.request = function (callback) { return requestAnimationFrame(callback); };
				duration.cancel = function (requestID) { cancelAnimationFrame(requestID); };
			} else {
				duration.request = function (callback) { return setTimeout(function () { callback(); }, duration.MIN); };
				duration.cancel = function (requestID) { clearTimeout(requestID); };
			}
			return duration;
		})(),

		listeners: [
			{ target: window, events: {}, _fakeEvents: {} },
			{ target: document, events: {}, _fakeEvents: {} }
		],

		getDoc: function (property) {
			var html = document.documentElement, body = document.body;
			if (undefined === property) return html || body || undefined;
			return ((html || body)[property] || undefined);
		},

		documentHeight: function () {
			return dom.getDoc('scrollHeight');
		},

		pageOffset: function () {
			return {
				X: (undefined !== window.pageXOffset) ? window.pageXOffset : dom.getDoc('scrollLeft') || 0,
				Y: (undefined !== window.pageYOffset) ? window.pageYOffset : dom.getDoc('scrollTop') || 0
			};
		},

		viewport: function () {
			return {
				width: (undefined !== window.innerWidth) ? window.innerWidth : dom.getDoc('clientWidth'),
				height: (undefined !== window.innerHeight) ? window.innerHeight : dom.getDoc('clientHeight')
			};
		},

		isTouch: function () {
			return tool.context.has("ontouchstart");
		},

		coords: function (element) {
			if (window === element) {
				var page = dom.pageOffset(), view = dom.viewport();
				return { top: page.Y, left: page.X, right: page.X + view.width, bottom: page.Y + view.height, width: view.width, height: view.height };
			}
			var coords = { top: 0, left: 0, right: 0, bottom: 0, width: element.offsetWidth, height: element.offsetHeight }, isStatic = true;
			do {
				coords.top += element.offsetTop;
				coords.left += element.offsetLeft;
				element = element.offsetParent;
				if (isStatic) {
					coords.relative = { top: coords.top, left: coords.left }; // The coordonates are relatives to the first (non static) positionned element
					if (element && 'static' != dom.computedStyle(element, 'position')) isStatic = false;
				}
			} while (element);
			tool.extend(coords, { right: coords.left + coords.width, bottom: coords.top + coords.height });
			tool.extend(coords.relative, { right: coords.relative.left + coords.width, bottom: coords.relative.top + coords.height, width: coords.width, height: coords.height });
			return coords;
		},

		isInElement: function (source, target, inside, delta) {
			var s = dom.coords(source), t = dom.coords(target), d = delta || 0;
			if (!inside) return (s.bottom > t.top - d && s.top < t.bottom + d && s.right > t.left - d && s.left < t.right + d);
			else return (s.top > t.top + d && s.bottom < t.bottom - d && s.left > t.left + d && s.right < t.right - d);
		},

		isInViewport: function (element, inside, delta) {
			return dom.isInElement(element, window, inside, delta);
		},

		isDocumentScrolled: function (delta) {
			delta = delta || 0;
			var w = dom.coords(window);
			return (w.top && w.bottom >= dom.documentHeight() - delta);
		},

		isDocumentAtTop: function (delta) {
			delta = delta || 0;
			var w = dom.coords(window);
			return (w.top <= delta && w.bottom < dom.documentHeight());
		},

		isElement: (function() {
			var isElement = function (element, allowText, includeNode) {
				try {
					if (!(element instanceof window.Node)) return false;
				} catch (e) {
					if (!(element && 'object' === typeof element && 'nodeType' in element)) return false;
				}
				if (1 == element.nodeType) {
					var nodeName = element.nodeName.toLowerCase(), inc = includeNode;
					if (inc && tool.inArray(nodeName, tool.isArray(inc) ? inc : [inc])) return true;
					if (!tool.inArray(nodeName, isElement.excludeNode)) return true;
				}
				if (3 == element.nodeType && !!allowText) return true;
				return false;
			};
			isElement.excludeNode = ['script', 'style', 'link', 'meta'];
			return isElement;
		})(),

		isVisible: function (element) {
			var cStyle = dom.computedStyle(element);
			return !('none' == cStyle.display || 'hidden' == cStyle.visibility || '0' == cStyle.opacity);
		},

		text: function (element, text) {
			if (undefined === text) return element.textContent || element.innerText || '';
			'textContent' in element ? element.textContent = text : 'innerText' in element ? element.innerText = text : '';
		},

		css: function (element/*, style, value*/) {
			var style, cStyle = dom.computedStyle(element), argsL = tool.argsLength(arguments);
			switch (argsL) {
				case 1: return cStyle;
				case 2: if (tool.isObject(arguments[1])) style = arguments[1]; break;
				case 3:
					var prop = arguments[1], value = arguments[2];
					if (tool.isString(prop) && !/:/.test(prop) && (tool.isString(value) && !/:/.test(value) || tool.isNumber(value) || null === value)) {
						style = {};
						style[prop] = value;
					}
					break;
			}
			if (!style) style = tool.css2Style.apply(this, Array.prototype.slice.call(arguments, 1, argsL));
			// Setter
			for (var p in style) {
				if (undefined === style[p]) continue;
				var prop = tool.css2JsProperty(p);
				if (cStyle[prop] != style[p]) dom.data(element, 'avn-style-previous-' + prop, cStyle[prop]);
				element.style[prop] = style[p];
			}
			if ('opacity' in style) dom.opacityFilter(element, style.opacity);
			// Getter
			cStyle = dom.computedStyle(element);
			for (var p in style) style[p] = cStyle[tool.css2JsProperty(p)];
			style = dom.adaptStyle(style);
			if (1 == tool.objectLength(style)) for (p in style) return style[p];
			return style;
		},

		adaptStyle: function (style/*, value*/) {
			if (2 == tool.argsLength(arguments)) {
				var prop = arguments[0], value = arguments[1];
				style = {};
				style[prop] = value;
			}
			for (var p in style) switch (tool.css2JsProperty(p)) {
				case 'color': case 'backgroundColor': style[p] = tool.rgb2Hexa(style[p]); break;
			}
			return style;
		},

		// Get the previous value of style property modified by the css() method
		previousStyle: function (element, property) {
			var previous = dom.data(element, 'avn-style-previous-' + tool.css2JsProperty(property));
			if (previous) return dom.adaptStyle(property, previous)[property];
		},

		computedStyle: function (element, property) {
			var cStyle;
			if (window.getComputedStyle) {
				cStyle = window.getComputedStyle(element, null);
			} else {
				cStyle = element.currentStyle;
			}
			if (property) return cStyle[tool.css2JsProperty(property)];
			return cStyle;
		},

		opacityFilter: function (element, opacity) { // Opacity fix for ie
			if (!element.currentStyle) return;
			if (undefined !== opacity && 1 != parseInt(opacity, 10)) {
				element.style.filter = 'alpha(opacity=' + (opacity * 100) + ')';
				if (!element.currentStyle.hasLayout) {
					dom.data(element, 'avn-style-previous-zoom', dom.computedStyle(element, 'zoom'));
					element.style.zoom = '1';
				}
			} else {
				element.style.filter = '';
				element.style.zoom = dom.data(element, 'avn-style-previous-zoom', null) || element.style.zoom;
			}
		},

		zIndex: (function () {
			var zIndex = 9999;
			return function (element) {
				element.style.zIndex = zIndex++;
			};
		})(),

		data: function (element, name, value) {
			var data = {}, d, n, dataAttr = [];
			// Get existing dataset map
			if (d = element.dataset) {
				for (n in d) {
					data[n] = d[n];
					dataAttr.push(n);
				}
			} else {
				d = element.attributes;
				for (var i = 0; i < d.length; i++) {
					n = d[i].nodeName.replace(/^data\-/, '');
					if (n.length < d[i].nodeName.length) {
						n = tool.css2JsProperty(n);
						data[n] = d[i].nodeValue;
						dataAttr.push(n);
					}
				}
			}
			// Overwrite with _avnData map
			d = element._avnData = element._avnData || {};
			for (n in d) data[n] = d[n];
			if (undefined === name) return data; // Get map
			var prop = tool.css2JsProperty(name), current = data[prop];
			if (undefined === value) return current; // Get value
			if (null === value) {
				element.dataset ? delete element.dataset[prop] : element.removeAttribute('data-' + name);
				delete element._avnData[prop];
				return current; // Return the deleted value
			}
			// Update existing dataset map (in this case we assume the value can be converted into string)
			if (tool.inArray(prop, dataAttr)) {
				element.dataset ? element.dataset[prop] = value : element.setAttribute('data-' + name, value);
			}
			return element._avnData[prop] = value; // Return the setted value
		},

		prop: function (element, prop, value) {
			var previous = element[prop];
			if (undefined !== value) element[prop] = value;
			return previous;
		},

		className: function (element, value) {
			return tool.cleanString(dom.prop(element, 'className', value) || '');
		},

		hasClass: function (element, css) {
			var c = dom.className(element);
			c = c ? c.split(' ') : [];
			css = tool.css2List(css);
			for (var n = css.length, i = 0; i < n; i++) {
				if (!tool.inArray(css[i], c)) return false;
			}
			return true;
		},

		addClass: function (element, css) {
			var c = dom.className(element);
			c = c ? c.split(' ') : [];
			css = tool.css2List(css);
			for (var r = true, n = css.length, i = 0; i < n; i++) {
				!tool.inArray(css[i], c) ? c.push(css[i]) : r = false;
			}
			element.className = c.join(' ');
			return r;
		},

		removeClass: function (element, css) {
			var c = dom.className(element);
			c = c ? c.split(' ') : [];
			css = tool.css2List(css);
			for (var newClass = [], n = c.length, i = 0; i < n; i++) {
				if (!tool.inArray(c[i], css)) newClass.push(c[i]);
			}
			element.className = newClass.join(' ');
			return (n - newClass.length === css.length);
		},

		toggleClass: function (element, css) {
			css = tool.css2List(css);
			for (var count = 0, n = css.length, i = 0; i < n; i++) {
				var hasClass = dom.hasClass(element, css[i]);
				dom[hasClass ? 'removeClass' : 'addClass'](element, css[i]);
				if (!hasClass) count++;
			}
			return count;
		},

		animate: (function () {

			var Animate = function (element, properties, duration, easing, callback) {
				this.element = element;
				this.duration = dom.duration(duration);
				this.loops = Math.ceil(this.duration / dom.duration.MIN) || 1;
				this.easing = easing;
				this.callback = callback;
				this.initProp(properties);
				this.pointer = 0;
			};

			Animate.masks = {
				rgb: { input: /rgb\([0-9]+,\s?[0-9]+,\s?[0-9]+\)/gi, output: 'rgb(@,@,@)', precision: 0 },
				pixel: { input: /\-?([0-9]+(\.[0-9]+)?|\.[0-9]+)px/gi, output: '@px', precision: 2 },
				percent: { input: /\-?([0-9]+(\.[0-9]+)?|\.[0-9]+)%/gi, output: '@%', precision: 2 },
				number: { input: /\-?([0-9]+(\.[0-9]+)?|\.[0-9]+)/gi, output: '@', precision: 3 }
			};

			Animate.cache = { hits: 0 };

			Animate.prototype = {
				initProp: function (properties) {
					this.properties = {};
					var empty = true,
						cStyle = dom.computedStyle(this.element);
					for (var p in properties) {
						var list = this.listJsProp(p), to = this.maskValue(properties[p]), from;
						if (!to) continue;
						for (var i = 0; i < list.length; i++) {
							var property = list[i];
							if (property in cStyle) {
								from = this.maskValue(cStyle[property]/*, true*/);
							} else if ('opacity' == property && this.element.currentStyle) { // ie fix
								from = this.maskValue(parseFloat((cStyle.filter || 'alpha(opacity=100)').match(/[0-9]+/)[0] / 100)/*, true*/);
							}
							if (!from) continue; // Property not supported in the browser
							var fill = this.fillPropSteps(from, to);
							if (fill) {
								this.properties[property] = fill;
								empty = false;
							}
						}
					}
					if (empty) this.loops = 1;
				},
				listJsProp: function (prop) {
					var list = [], prefix, suffix;
					switch (prop = tool.css2JsProperty(prop)) {
						case 'margin': case 'padding': case 'border':
							list = ['Top', 'Right', 'Bottom', 'Left'];
							prefix = prop;
							if ('border' === prop) suffix = 'Width';
							break;
						case 'borderRadius':
							list = ['TopLeft', 'TopRight', 'BottomLeft', 'BottomRight'];
							prefix = 'border';
							suffix = 'Radius';
							break;
						default:
							list.push(prop);
							break;
					}
					if (prefix) for (var i = 0; i < list.length; i++) list[i] = prefix + list[i];
					if (suffix) for (var i = 0; i < list.length; i++) list[i] += suffix;
					return list;
				},
				maskValue: function (value, skipCheck) {
					value = '' + value;
					var mask = {}, success = false, original = value, match = value.match(/#[0-9a-f]+/gi); // Convert hexa to rgb
					if (match) for (var i = 0; i < match.length; i++) value = value.replace(match[i], tool.hexa2Rgb(match[i]));
					for (var type in Animate.masks) {
						match = value.match(Animate.masks[type].input);
						if (!match) continue;
						success = true;
						for (var i = 0; i < match.length; i++) value = value.replace(match[i], '');
						mask[type] = [];
						switch (type) {
							case 'rgb':
								for (var i = 0; i < match.length; i++) mask[type].push(match[i].match(/[0-9]+/g));
								break;
							case 'pixel': case 'percent': case 'number':
								for (var i = 0; i < match.length; i++) mask[type].push([parseFloat(match[i])]);
								break;
						}
					}
					if (!skipCheck) {
						value = value.replace(/\s+/, '');
						if (value) tool.console.error('$.dom.animate.maskValue("' + original + '")\nUnable to mask the value part: "' + tool.splitString(value, ' ').join(' ') + '"');
					}
					return success ? mask : undefined;
				},
				fillPropSteps: function (from, to) {
					var fill = [], loop, item, part, diff = false;
					for (loop = 0; loop < this.loops; loop++) fill.push([]);
					for (var type in from) {
						var numItems = from[type].length;
						if (type in to) for (item = to[type].length; item < numItems; item++) to[type][item] = from[type][item];
						else to[type] = from[type];
						for (item = 0; item < numItems; item++) {
							var at = [], f = from[type][item], t = to[type][item], numParts = f.length;
							for (part = 0; part < numParts; part++) {
								if (f[part] != t[part]) diff = true;
								at.push(this.getSteps(f[part], t[part], Animate.masks[type].precision));
							}
							for (loop = 0; loop < this.loops; loop++) {
								var output = Animate.masks[type].output;
								for (part = 0; part < numParts; part++) output = output.replace('@', at[part][loop]);
								fill[loop].push(output);
							}
						}
					}
					for (loop = 0; loop < this.loops; loop++) fill[loop] = fill[loop].join(' ');
					if (diff) return fill;
				},
				getSteps: function (from, to, precision) {
					var key = [this.duration, this.easing || 'linear', from, to, precision].join(', ');
					if (Animate.cache[key]) {
						Animate.cache.hits++;
						return Animate.cache[key];
					}
					from = parseFloat(from);
					to = parseFloat(to);
					var steps = [],
						delta = to - from,
						step = delta / this.loops,
						format = function (value) { return parseFloat(value.toFixed(precision)); },
						easing = (tool.asset('easing') || {})[this.easing];
					if (!easing) for (var i = 1; i < this.loops; i++) {
						steps.push(format(from + step * i));
					} else for (var i = 1; i < this.loops; i++) {
						steps.push(format(easing(i / this.loops, i * dom.duration.MIN, from, delta, this.duration)));
					}
					steps.push(format(to));
					for (var i = 0; i < this.loops; i++) steps[i] = parseFloat(steps[i].toFixed(precision));
					return Animate.cache[key] = steps;
				},
				step: function () {
					for (var property in this.properties) {
						var value = this.properties[property][this.pointer];
						this.element.style[property] = value;
						if ('opacity' == property) dom.opacityFilter(this.element, value); // for ie
					}
					var remain = this.loops - ++this.pointer;
					if (!remain) {
						if (this.callback) this.callback();
						this.pointer = 0;
					}
					return remain;
				},
				start: function (/*inProgress*/) {
					if (!arguments[0] && this.pointer && !this.stopped) return this;
					delete this.stopped;
					var remain = this.step();
					if (remain) this.timeout = dom.duration.request(function () { this.start(true); }.bind(this));
					return this;
				},
				stop: function () {
					this.stopped = true;
					dom.duration.cancel(this.timeout);
					return this;
				}
			};

			var animate = function (element, properties, duration, easing, callback) {
				return new Animate(element, properties, duration, easing, callback);
			};
			animate.cache = Animate.cache;
			return animate;

		})(),

		parents: function (element) {
			var parents = [];
			while ((element = element.parentNode) && dom.isElement(element)) parents.push(element);
			return parents;
		},

		children: function (element, pos, includeNode) {
			var children = [], c = element.childNodes, n = c.length, i;
			for (i = 0; i < n; i++) if (dom.isElement(c[i], false, includeNode)) children.push(c[i]);
			pos = parseInt(('first' === pos) ? 0 : ('last' === pos) ? children.length - 1 : pos, 10);
			if (!isNaN(pos) && children[pos]) return [children[pos]];
			return children;
		},

		prev: function (element, includeNode) {
			var p = element;
			do { p = p.previousSibling; } while (p && !dom.isElement(p, false, includeNode));
			return p;
		},

		next: function (element, includeNode) {
			var n = element;
			do { n = n.nextSibling; } while (n && !dom.isElement(n, false, includeNode));
			return n;
		},

		prevAll: function (element, includeNode) {
			var all = [];
			while (element = dom.prev(element, includeNode)) all.push(element);
			return all;
		},

		nextAll: function (element, includeNode) {
			var all = [];
			while (element = dom.next(element, includeNode)) all.push(element);
			return all;
		},

		remove: function (element) {
			return element.parentNode.removeChild(element);
		},

		replace: function (newElement, element) {
			return element.parentNode.replaceChild(newElement, element);
		},

		create: function (attr, allowText) {
			allowText = (undefined === allowText || !!allowText); // FIXME est-ce que c'est pas mieux que par défaut ça soit false ?
			var newElem;
			if (tool.isString(attr)) {
				if (!allowText && !attr.match(/<.+>/)) return;
				newElem = document.createElement('div');
				newElem.innerHTML = tool.cleanString(attr);
				newElem = newElem.firstChild; // NodeElement or TextNode
			} else if (tool.isObject(attr)) {
				if ('tag' in attr) {
					newElem = document.createElement(attr.tag); // NodeElement
					if ('content' in attr) newElem.innerHTML = attr.content;
					if ('style' in attr) dom.css(newElem, attr.style);
				} else {
					newElem = document.createTextNode(attr.content || ''); // TextNode
				}
				for (var p in attr) if (!tool.inArray(p, ['tag', 'content', 'style'])) newElem[p] = attr[p];
			}
			if (dom.isElement(newElem, allowText)) return newElem;
		},

		insertSheet: function (css/*, rules*/) {
			var sheet = document.createElement('style');
			sheet.setAttribute("type", "text/css");
			if (sheet.styleSheet) sheet.styleSheet.cssText = ''; // ie
			else sheet.appendChild(document.createTextNode(''));
			document.getElementsByTagName('head')[0].appendChild(sheet);
			dom.addSheetRules(sheet, css, arguments[1]);
			return sheet;
		},

		addSheetRules: function (sheet, css/*, rules*/) {
			css = tool.sheet2Object(css, arguments[2]);
			for (var selector in css) dom.addSheetRule(sheet, selector, css[selector]);
		},

		addSheetRule: function (sheet, selector, rule, index) {
			sheet = sheet.styleSheet || sheet.sheet; // ie or standard
			if ('addRule' in sheet) sheet.addRule(selector, rule, index);
			else if ('insertRule' in sheet) sheet.insertRule(selector + '{' + rule + '}', index);
		},

		insertDefaultSheet: function () {
			if (document.getElementById('avn-core-default')) return;
			var sheet = dom.insertSheet({
				'.avn-core-highlight': 'border: 1px dotted red !important;',
				'.avn-core-drag': [
					'user-select: none; -moz-user-select: none; -webkit-user-select: none; -ms-user-select: none;',
					'user-drag: none; -moz-user-drag: none; -webkit-user-drag: none; -ms-user-drag: none;'
				]
			});
			sheet.id = 'avn-core-default';
			return sheet;
		},

		require: (function() {
			var _loaded = { scripts: [], styles: [], images: [] },
			_load = function (type, url, onLoad, onError, index) {
				var node, attr, parent = document.head || document.getElementsByTagName('head')[0];
				switch (type) {
					case 'scripts':
						node = document.createElement('script');
						node.type = 'text/javascript';
						attr = 'src';
						break;
					case 'styles':
						node = document.createElement('link');
						node.type = 'text/css';
						node.rel = 'stylesheet';
						attr = 'href';
						break;
					case 'images':
						node = new Image();
						attr = 'src';
						parent = null;
						break;
				}
				if (undefined !== index) node._index = index;
				node.onload = node.onreadystatechange = function (e) {
					if (this.readyState && 'complete' != this.readyState && 'loaded' != this.readyState) return;
					node.onload = node.onreadystatechange = null;
					_loaded[type].push(url);
					if (onLoad) onLoad.call(this, e || window.event);
				};
				node.onerror = function (e) {
					if (onError) onError.call(this, e || window.event);
				};
				node[attr] = url;
				if (parent) parent.appendChild(node);
			},
			_loads = function (type, urls, onLoad, onError, again) {
				urls = [].concat(urls); // Preserve parameter and allow string or array
				var total = urls.length, toDo = [], skipped;
				while (urls.length) {
					var url = urls.shift();
					if (url && (again || !tool.inArray(url, _loaded[type]))) toDo.push(url);
				}
				if (!toDo.length) {
					skipped = total;
					if (onLoad) onLoad.call([], skipped);
					return;
				}
				var remain = toDo.length, error = 0, nodes = [], progress = function (e) {
					if ('error' === e.type) error++;
					nodes[this._index] = ('error' === e.type ? undefined : this);
					delete this._index;
					if (--remain) return;
					if (1 === nodes.length) nodes = nodes[0];
					skipped = total - toDo.length;
					if (!error && onLoad) onLoad.call(nodes, skipped);
					else if (error && onError) onError.call(nodes, skipped, error);
				};
				for (var i = 0; i < toDo.length; i++) _load(type, toDo[i], progress, progress, i);
			},
			scripts = function(urls, onLoad, onError, again) { _loads('scripts', urls, onLoad, onError, again); },
			styles = function(urls, onLoad, onError, again) { _loads('styles', urls, onLoad, onError, again); },
			images = function (urls, onLoad, onError) { _loads('images', urls, onLoad, onError, true); }; // always again
			scripts.loaded = function () { return [].concat(_loaded.scripts); };
			styles.loaded = function () { return [].concat(_loaded.styles); };
			images.loaded = function () { return [].concat(_loaded.images); };
			return { scripts: scripts, styles: styles, images: images };
		})(),

		on: function (element, events, fn, once) {
			var callback = function (event) {
				return function (e) {
					dom.consolidateEvent.call(element, e);
					fn.call(element, e, e.detail);
					if (once) dom.off(element, event, fn);
				};
			},
			listener = dom.getListeners(element, true);
			events = dom.getEvents(events);
			for (var i = 0; i < events.length; i++) {
				var l = listener[events[i]] = (listener[events[i]] || []),
					c = callback(events[i]);
				l.push({ "fn": fn, "callback": c, "once": !!once });
				if (element.addEventListener) { // Also supported in ie >= 9
					element.addEventListener(events[i], c, false);
				} else if (element.attachEvent) {
					element.attachEvent('on' + events[i], c);
					dom._addFakeEvent(element, events[i], c); // Works only in ie < 9
				}
			}
		},

		off: function (element, events, fn) {
			var listener = dom.getListeners(element);
			events = dom.getEvents(events);
			for (var i = 0; i < events.length; i++) {
				if (!(events[i] in listener)) continue;
				var l = listener[events[i]];
				for (var j = 0; j < l.length; j++) {
					if (fn !== l[j]["fn"]) continue;
					var c = l[j]["callback"];
					if (element.removeEventListener) {
						element.removeEventListener(events[i], c, false);
					} else if (element.detachEvent) {
						element.detachEvent('on' + events[i], c);
						dom._removeFakeEvent(element, events[i], c);
					}
					tool.arrayRemove(l, j, true);
					j--;
				}
				l.length || delete listener[events[i]];
			}
		},

		trigger: function (element, event, detail, canBubble) {
			if ('click' == event) return dom.triggerClick(element);
			event = dom.getEvents(event)[0];
			canBubble = (undefined === canBubble) ? true : !!canBubble;
			var isCancelable = false;
			if (tool.context.has("CustomEvent")) {
				var e = new CustomEvent(event, { bubbles: canBubble, cancelable: isCancelable, detail: detail });
				return element.dispatchEvent(e);
			} else if (document.createEvent) {
				var e = document.createEvent('CustomEvent');
				e.initCustomEvent(event, canBubble, isCancelable, detail);
				return element.dispatchEvent(e);
			} else if (element.attachEvent) {
				return dom._triggerFakeEvent(element, event, detail, canBubble); // Not cancelable
			}
		},

		getListeners: function (element, init, _fakeEvents) {
			var lid = (window === element) ? 0 : (document === element) ? 1 : undefined;
			(undefined !== lid) || (lid = dom.data(element, 'avn-listener-id')) || !init || (function () {
				dom.data(element, 'avn-listener-id', lid = dom.listeners.length);
				dom.listeners.push({ target: element, events: {}, _fakeEvents: {} });
			})();
			return undefined !== lid ? dom.listeners[lid][_fakeEvents ? '_fakeEvents' : 'events'] : {};
		},

		getEvents: function (events) {
			events = tool.isString(events) ? tool.splitString(events, ',') : [].concat(events);
			if (dom.isTouch()) dom.addTouchEvents(events);
			return events;
		},

		addTouchEvents: function (events) {
			var add = { 'mousedown': 'touchstart', 'mouseup': 'touchend', 'mousemove': 'touchmove', 'mouseleave': 'touchleave' };
			for (var i = 0; i < events.length; i++) {
				if (events[i] in add && !tool.inArray(add[events[i]], events)) events.push(add[events[i]]);
			}
			return events;
		},

		consolidateEvent: function (e) {
			e = e || window.event;
			e.target = e.target || e.srcElement;
			if (e.target && 3 == e.target.nodeType) e.target = e.target.parentNode; // Safari fix

			e.preventDefault = e.preventDefault || function () { e.returnValue = false; };
			e.stopPropagation = e.stopPropagation || function () { e.cancelBubble = true; };
			if (!('pageX' in e && 'pageY' in e)) {
				var page = dom.pageOffset();
				e.pageX = e.clientX + page.X;
				e.pageY = e.clientY + page.Y;
			}

			if ('mouseover' == e.type) e.relatedTarget = e.relatedTarget || e.fromElement;
			else if ('mouseout' == e.type) e.relatedTarget = e.relatedTarget || e.toElement;

			// Fix the events inheritance problem ('this' represents the element that triggered the event)
			if (this && e.relatedTarget) {
				var rt = e.relatedTarget;
				while (rt.nodeName.toLowerCase() !== 'html' && rt !== this) rt = rt.parentNode;
				e.mouseEventJustHappened = (rt !== this) ? true : false;
			}
		},

		getEventPageXY: function (e) {
			var _e = { pageX: e.pageX, pageY: e.pageY };
			// This is a single touch event like: /^touch/.test(e.type)
			if (dom.isTouch() && e.targetTouches && 1 == e.targetTouches.length) {
				_e.pageX = e.targetTouches[0].pageX;
				_e.pageY = e.targetTouches[0].pageY;
			}
			return _e;
		},

		// Fake event designed for ie < 9 (and allows custom event)
		_addFakeEvent: function (element, event, fn) {
			var fakeEvent = '_' + event, c = function (e) {
				if (e.propertyName != fakeEvent) return;
				e.detail = element[fakeEvent + '_detail'];
				element[fakeEvent + '_detail'] = undefined; // Clean
				fn.call(element, e);
			};
			if (!(fakeEvent in element)) element[fakeEvent] = 0;
			var listener = dom.getListeners(element, true, true),
				l = listener[event] = (listener[event] || []);
			l.push({ "fn": fn, "callback": c });
			element.attachEvent('onpropertychange', c); // Works only in ie < 9
		},
		_removeFakeEvent: function (element, event, fn) {
			var listener = dom.getListeners(element, false, true);
			if (!(event in listener)) return;
			var l = listener[event];
			for (var j = 0; j < l.length; j++) {
				if (fn !== l[j]["fn"]) continue;
				var c = l[j]["callback"];
				element.detachEvent('onpropertychange', c);
				tool.arrayRemove(l, j, true);
				j--;
			}
			l.length || delete listener[event];
		},
		_triggerFakeEvent: function (element, event, detail, canBubble) {
			canBubble = (undefined === canBubble) ? true : !!canBubble;
			var fakeEvent = '_' + event;
			do {
				if (fakeEvent in element) {
					element[fakeEvent + '_detail'] = detail;
					element[fakeEvent]++;
				}
			} while ((1 != element.nodeType || canBubble) && (element = element.parentNode));
			return true;
		},

		// Trigger a click event and fire the default action (cross-browser)
		// Using addEventListener method will fire the default action in Chrome, Safari, ie>=9, but not in Firefox
		triggerClick: function (element) {
			if (document.createEvent) {
				var e = document.createEvent('MouseEvents');
				e.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
				return element.dispatchEvent(e);
			} else {
				element.click();
				return true;
			}
		},

		cloneNode: function (element, childs, events) {
			var clone = element.cloneNode(undefined === childs || !!childs);
			dom.data(clone, 'avn-listener-id', null);
			if (clone.id) clone.id = ""; // prevent duplicate id
			if (undefined === events || !!events) {
				var listener = dom.getListeners(element);
				for (var event in listener) for (var i = 0; i < listener[event].length; i++)
					dom.on(clone, event, listener[event][i].fn, listener[event][i].once);
			}
			return clone;
		},

		ready: function (fn, all) {
			if (('complete' == document.readyState) || (!all && 'interactive' == document.readyState)) {
				return fn(); // DOM ready event was already fired
			}
			var callback = function (e) {
				e = e || window.event;
				if ('readystatechange' == e.type && 'complete' != document.readyState) return;
				fn(e);
			};
			if (!all) {
				// Notice: ie>9 supports addEventListener and DOMContentLoaded
				var event = document.addEventListener ? 'DOMContentLoaded' : 'readystatechange';
				dom.on(document, event, callback); // Use earlier DOM ready detection
			} else {
				dom.on(window, 'load', callback); // Wait for the window onload event
			}
		},

		drag: function (element, settings, callback) {
			var o = tool.extend({ // o = options
				position: 'absolute', cursor: 'move', trigger: element,
				direction: false, zIndexOnTop: true, follow: false,
				start: false, progress: false
			}, settings || {});
			if (o.position) dom.css(element, 'position', o.position);
			if (o.cursor) dom.css(o.trigger, 'cursor', o.cursor);
			dom.insertDefaultSheet();
			dom.addClass(o.trigger, 'avn-core-drag');
			var bypass = false, prevDef = function (e) { e.preventDefault(); };
			dom.on(o.trigger, 'mousedown', function (e) {
				if (bypass) return;
				if (e.targetTouches && e.targetTouches.length > 1) return;
				dom.on(document, 'dragstart, selectstart', prevDef);
				var _e = dom.getEventPageXY(e),
				coords = dom.coords(element),
				offset = {
					left: _e.pageX - coords.relative.left,
					top: _e.pageY - coords.relative.top
				},
				drag = function (e) {
					var pos = {}, _e = dom.getEventPageXY(e);
					if (!o.direction || 'horizontal' == o.direction) pos.left = _e.pageX - offset.left;
					if (!o.direction || 'vertical' == o.direction) pos.top = _e.pageY - offset.top;
					if (!o.direction) e.preventDefault();
					if (o.zIndexOnTop) dom.zIndex(element);
					if (o.progress) {
						var p = dom.coords(element),
						d = {
							left: pos.left - p.relative.left,
							top: pos.top - p.relative.top
						},
						n = tool.extend({}, p, {
							left: p.left + d.left, right: p.right + d.left,
							top: p.top + d.top, bottom: p.bottom + d.top,
							relative: {
								left: p.relative.left + d.left, right: p.relative.right + d.left,
								top: p.relative.top + d.top, bottom: p.relative.bottom + d.top
							}
						});
						o.progress.call(element, { settings: o, from: coords, prev: p, next: n, delta: d }, pos);
						if (!tool.objectLength(pos)) return; // Note: progress function should have update or delete pos.left or pos.top properties
					}
					for (var p in pos) pos[p] += 'px';
					dom.css(element, pos);
					dom.trigger(element, 'avnDrag.progress', { settings: o, from: coords, prev: p, next: n, delta: d });
				},
				drop = function (end) {
					dom.off(document, 'mousemove', drag);
					if (!end) return;
					dom.off(document, 'dragstart, selectstart', prevDef);
					if (callback) callback.call(element, { settings: o, from: coords, to: dom.coords(element) });
					dom.trigger(element, 'avnDrag.end', { settings: o, from: coords, to: dom.coords(element) });
				};
				if (o.start) o.start.call(element, { settings: o, from: coords });
				dom.trigger(element, 'avnDrag.start', { settings: o, from: coords });
				drop(); // Important
				dom.on(document, 'mousemove', drag);
				dom.on(o.trigger, 'mouseup', function () {
					if (o.follow && !dom.isTouch()) {
						bypass = true;
						dom.on(o.trigger, 'mousedown', function () {
							drop(true);
							setTimeout(function () { bypass = false; }, 0);
						}, true);
					} else {
						drop(true);
					}
				}, true);
			});
		},

		ajax: (function () {

			var Ajax = function (url, param) {
				this.param = {
					url: url || '',
					data: {},
					type: 'GET',
					async: true,
					cache: false
				};
				for (var p in param) if (p in this.param) this.param[p] = param[p];
				this.callback = {
					progress: function () { },
					done: function () { },
					fail: function () { },
					always: function () { }
				};
				this.init();
				return this;
			};

			Ajax.prototype = {
				init: function () {
					var url = tool.parseUrl(this.param.url);
					this.param.url = url.origin + url.pathname;

					this.param.data = tool.extend({}, url.queries, tool.parseUrl(tool.buildSearch(this.param.data)).queries);
					if (!this.param.cache) this.param.data['_'] = new Date().getTime();

					var data = this.param.data = tool.buildSearch(this.param.data),
						type = this.param.type = this.param.type.toUpperCase();

					this.xhr = new XMLHttpRequest();
					if ('POST' == type) {
						this.xhr.open(type, this.param.url, this.param.async);
						this.xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
					} else { // 'GET' or 'HEAD'
						this.xhr.open(type, this.param.url + data, this.param.async);
					}
					this.xhr.onreadystatechange = function () {
						this.callback.progress(this.xhr);
						if (4 == this.xhr.readyState) {
							if (200 == this.xhr.status) this.callback.done(this.xhr);
							else this.callback.fail(this.xhr);
							this.callback.always(this.xhr);
						}
					}.bind(this);
				},
				progress:	function (fn) { this.callback.progress = fn; return this; },
				done:		function (fn) { this.callback.done = fn; return this; },
				fail:		function (fn) { this.callback.fail = fn; return this; },
				always:		function (fn) { this.callback.always = fn; return this; },
				send:		function () {
					this.xhr.send('POST' == this.param.type ? this.param.data.replace(/^\?/, '') : null);
				}
			};

			return function (url, param) {
				var args = tool.signature(arguments, [tool.isString, tool.isObject]);
				url = args[0]; param = args[1];
				return new Ajax(url, param);
			};

		})(),

		cookie: (function () {
			var Cookie = function () { };

			Cookie.prototype = {
				set: function (key, value, expires, path, domain, secure) {
					var cookie = [], add = function (k, v) { cookie.push(k + '=' + v); };
					add(key, encodeURIComponent(value || ''));
					if (expires) {
						var d = new Date();
						d.setTime(d.getTime() + 1000 * 60 * 60 * 24 * expires); // days
						add('expires', d.toUTCString());
					}
					add('path', path || '/');
					if (domain) add('domain', domain);
					document.cookie = cookie.join('; ') + (secure ? '; secure' : '');
					return this.get(key);
				},
				get: function (key) {
					var map = {}, cookie = tool.splitString(document.cookie, ';');
					for (var i = 0; i < cookie.length; i++) {
						var data = tool.splitString(cookie[i], '=');
						map[data[0]] = decodeURIComponent(data[1] || '');
					}
					return key ? map[key] : map;
				},
				have: function (key) {
					return key in this.get();
				},
				keys: function () {
					var keys = [], cookie = this.get();
					for (var k in cookie) keys.push(k);
					return keys;
				},
				erase: function (key) {
					for (var keys = key ? [key] : this.keys(), i = 0; i < keys.length; i++) this.set(keys[i], '', -1);
					for (var cookie = this.get(), i = 0; i < keys.length; i++) if (keys[i] in cookie) return false;
					return true;
				}
			};

			return new Cookie();
		})(),

		storage: (function () {

			// Unified method to access Storage interface
			var action = function (key, val) {
				if (null === key) {
					this.clear();
					return 0; // It means the storage length is now equal to 0
				}
				if (undefined === key) return this.length; // Get storage length

				if (null === val) {
					this.removeItem(key);
				} else if (undefined === val) {
					return tool.parse(this.getItem(key));
				} else {
					try {
						this.setItem(key, tool.stringify(val));
					} catch (e) {
						tool.console.error('Web storage error occured !');
					}
				}
			},

			Storage = function () { };

			Storage.prototype = {
				isReady: function (type) {
					switch (type) {
						case 'local': return !!window.localStorage;
						case 'session': return !!window.sessionStorage;
						default: return !!(window.localStorage && window.sessionStorage);
					}
				},
				local: function (key, val) {
					return action.call(localStorage, key, val);
				},
				session: function (key, val) {
					return action.call(sessionStorage, key, val);
				}
			};

			return new Storage();
		})(),

		selector: (function () {

			var SLCTR_ASC = '§', // Ascendant selector (non standard)
				SLCTR_DESC = ' ', // Descendant css selector
				slctr = ['+', '~', '>', SLCTR_ASC, SLCTR_DESC], // Supported css selectors (space character must be the last)

			search = {
				tg: /^[a-z0-9\*]+/i,// tag (including the star css selector)
				cs: /^\.[_\-\w]+/i,	// class
				id: /^#[_\-\w]+/i	// id
			},
			match = function (str, reg) {
				var match = reg.exec(str);
				if (!match) return;
				return {
					result: match[0],
					remain: str.substr(match[0].length)
				};
			},
			getTag = function (str) {
				var tag = {
					tg: null,	// tag
					cs: [],		// class
					id: null	// id
				},
				m = match(str, search.tg);
				if (m) {
					tag.tg = m.result.toLowerCase();
					str = m.remain;
				}
				do {
					m = match(str, search.cs);
					if (m) {
						tag.cs.push(m.result.substr(1));
						str = m.remain;
					} else if (!tag.id) {
						m = match(str, search.id);
						if (m) {
							tag.id = m.result.substr(1);
							str = m.remain;
						}
					}
				} while (m && str);
				return str ? null : tag;
			},
			// Get the stack of tags that match the css selector
			getStack = function (query) {
				query = query.replace(/^\s+|\s+$/g, '');
				for (var s = '\\s*', i = 0; i < slctr.length; i++) {
					query = query.replace(new RegExp(s + '\\' + slctr[i] + s, 'g'), slctr[i]);
				}
				for (var queries = [{ qy: query, sr: SLCTR_DESC }], i = 0; i < slctr.length; i++) { // qy=query, sr=selector
					for (var tmp = [], j = 0; j < queries.length; j++) {
						for (var qy = queries[j].qy.split(slctr[i]), k = 0; k < qy.length; k++) {
							tmp.push({ qy: qy[k], sr: 0 == k ? queries[j].sr : slctr[i] }); // The first query keeps the previous selector
						}
					}
					queries = tmp;
				}
				for (var stack = [], j = 0; j < queries.length; j++) {
					if (!queries[j].qy) continue;
					var tag = getTag(queries[j].qy);
					if (!tag) return []; // Invalid query
					tag.sr = queries[j].sr; // css selector like '+', '>', ... (between this tag and the previous one in the stack)
					stack.push(tag);
				}
				return stack;
			},
			stackIsId = function (stack) {
				if (1 == stack.length && !stack[0].tg && !stack[0].cs.length && stack[0].id) return true;
				return false;
			},
			elementMatchTag = function (element, tag) {
				if (!tag || !dom.isElement(element, false, tag.tg)) return false;
				if (tag.tg && element.nodeName.toLowerCase() !== tag.tg && '*' !== tag.tg) return false;
				var className = dom.className(element).split(' '), n = tag.cs.length, i;
				for (i = 0; i < n; i++) if (!tool.inArray(tag.cs[i], className)) return false;
				if (tag.id && element.id !== tag.id) return false;
				return true;
			},
			traverse = function (query, root) {
				root = root || document;
				var elements = [], stack = getStack(query);
				if (document === root && stackIsId(stack)) {
					elements = document.getElementById(stack[0].id); // Use native method
					return elements ? [elements] : [];
				}
				var analyse = function (element, index) {
					index = index || 0;
					var candidate = [], slctr = stack[index].sr, tag = stack[index].tg;
					switch (slctr) {
						case '+':
							var next = dom.next(element, tag);
							if (next) candidate.push(next); break;
						case '~':
							candidate = dom.nextAll(element, tag); break;
						case '>':
						case SLCTR_DESC:
							candidate = dom.children(element, undefined, tag); break;
						case SLCTR_ASC:
							var parent = element.parentNode;
							if (dom.isElement(parent)) candidate.push(parent); break;
					}
					for (var n = candidate.length, i = 0; i < n; i++) {
						if (elementMatchTag(candidate[i], stack[index])) {
							if (stack.length - 1 == index) {
								elements.push(candidate[i]);
							} else {
								analyse(candidate[i], index + 1);
							}
						}
						if (tool.inArray(slctr, [SLCTR_DESC, SLCTR_ASC])) analyse(candidate[i], index);
					}
				};
				if (tool.inArray(stack[0].sr, [SLCTR_DESC, SLCTR_ASC]) && elementMatchTag(root, stack[0])) {
					1 == stack.length ? elements.push(root) : analyse(root, 1);
				}
				analyse(root);
				return elements; // tool.arrayUnique is necessary and will be called bellow (*)
			},
			selector = function (query, root) {
				if (undefined === query || document === query) return [document];

				if (tool.isArray(query)) query = query.join(',');
				query = tool.splitString(query, ',');
				if (!query.join(',')) return [];

				if (undefined === root) root = document;
				else if (null === root) return [];

				var elements = [];
				if (tool.context.has("querySelectorAll", root)) {
					var nodeList = root.querySelectorAll(query); // Use native method
					if (nodeList) for (var n = nodeList.length, i = 0; i < n; i++) elements.push(nodeList[i]);
					return elements;
				}
				var time = new Date().getTime();
				for (var n = query.length, i = 0; i < n; i++) elements = elements.concat(traverse(query[i], root));
				tool.arrayUnique(elements, true, true); // (*)
				selector.stats.push({ query: query.join(', '), time: new Date().getTime() - time, items: elements.length });
				return elements;
			};
			selector.stats = [];
			selector.viewStats = function (sort) {
				var s = [].concat(selector.stats);
				if (sort) s.sort(function (s1, s2) { return s1.time < s2.time ? 1 : s1.time > s2.time ? -1 : 0; });
				for (var i = 0; i < s.length; i++) {
					tool.console.log(s[i].time + 'ms: ' + s[i].query + ' (' + s[i].items + ' item' + (s[i].items > 1 ? 's' : '') + ')');
				}
			};
			return selector;

		})()

	};

	// Expose avine
	window.avine.dom = dom;

})(this);

// avine-core.js
(function (window) {
	"use strict";

	var avine = window.avine;
	if (!avine || !avine.tool || !avine.dom) return;
	var tool = avine.tool, dom = avine.dom;

	// This class helps to call asynchronous methods sequentially without using nested functions
	var Core = function () {
		this._stack = Core._emptyStack();
		this.lastResult = undefined; // Public 'dynamic' property
		this.currentMethod = undefined; // Public 'dynamic' property
		var builder = Core._getBuilder(Core); // = 'buildCore'
		if (this[builder]) this[builder].apply(this, arguments); // Call the builder method (if defined) and propagate arguments
	};

	Core._emptyStack = function () {
		return {
			fn: [], // The stack of functions to execute sequentially
			start: false, // Is execution started ?
			stop: false, // Is execution stopped ?
			loop: false, // Is execution in loop ?
			done: [], // Record of each executed function in its context (if loop!==false)
			callback: { failure: [], complete: [] },
			listeners: []
		};
	};

	Core.prototype = {

		constructor: Core,

		// Clone the Core instance to create parallel call stacks and prevent competitors call problems !
		clone: function (callbacks, listeners) {
			var clone = Object.create(this);
			// Each clone has his own stack
			clone._stack = Core._emptyStack();
			clone.lastResult = undefined;
			clone.currentMethod = undefined;
			// Overwrite the inherited method 'setter' to affect the clone prototype (the original instance and not the clone instance)
			clone.setter = this.setter.bind(this); // This is equivalent to Object.getPrototypeOf(clone)[key] = value;
			// Clone callbacks and listeners
			if (undefined === callbacks || !!callbacks) {
				clone._stack.callback.failure = [].concat(this._stack.callback.failure);
				clone._stack.callback.complete = [].concat(this._stack.callback.complete);
			}
			if (undefined === listeners || !!listeners) {
				clone._stack.listeners = [].concat(this._stack.listeners);
			}
			return clone;
		},

		// Set a property to 'this' (just to make this method available for the original and the clones instances)
		setter: function (key, value) {
			if (undefined === value) {
				delete this[key]; // delete key
			} else {
				this[key] = value; // assign value
			}
		},

		// Push asynchronous function in the stack (notice that when it's called in the event handler, it can break the propagation of the last result)
		then: function (fn, argsStack, invoke) {
			var _f = this._stack.fn;
			if (!_f.length) _f[0] = []; // Init the main stack
			if (undefined === argsStack || !argsStack.length) {
				_f[0].push(fn); // Push the function once in the stack
			} else do {
				if (invoke != 'apply') invoke = 'call'; // Use fn.apply() or fn.call() to invoke the function
				var i = i || 0;
				_f[0].push(function (i) {
					fn[invoke](this, argsStack[i], // Push the function on each set of arguments
						function(r) { this.done(r); }.bind(this), // Make available the 'done' method as parameter (only if invoke='call')
						function(r) { this.fail(r); }.bind(this) // Make available the 'fail' method as parameter (only if invoke='call')
					);
				}.bind(this, i));
			} while (++i < argsStack.length);

			//this._stack.start || this.done(this.lastResult); // The first push starts the stack execution
			if (!this._stack.start) {
				this._stack.start = true;
				// Schedule the 'done' method to be executed once the current javascript call stack is empty
				setTimeout(function () { this.done(this.lastResult); }.bind(this), 0); // The first push starts the stack execution
			}
			return this;
		},

		// Push synchronous function in the stack (the 'done' method is invoked automatically)
		queue: function(fn) {
			return this.then(function () {
				var once = fn.call(this, this.lastResult);
				this.done(this.lastResult); // Propagate the last result
				return once;
			});
		},

		// Execute asynchronous function immediately after (use this method with caution, because it can break the propagation of the last result)
		now: function (fn) {
			var _f = this._stack.fn;
			if (!_f.length) _f[0] = [];
			_f[0].unshift(fn); // Execute the function immediately after

			if (!this._stack.start) {
				this._stack.start = true;
				// Schedule the 'done' method to be executed once the current javascript call stack is empty
				setTimeout(function () { this.done(this.lastResult); }.bind(this), 0); // The first push starts the stack execution
			}
			return this;
		},

		// Call the next asynchronous function in the stack
		done: function (result) {
			this.lastResult = result; // Make the last result available in the next method as a property
			var _f = this._stack.fn;
			while (_f.length) {
				if (_f[0].length) {
					var fn = _f[0].shift(); // Get the next function in the FIFO stack
					if (_f[0].length) _f.unshift([]); // Dedicate an empty main stack to the next method (defer what remains in the stack)
					var fnCall = function () {
						this.currentMethod = undefined; // Reset the previous method name (in case the next method is anonymous)
						// Call the function in the appropriate context
						// In case the next function is anonymous, make the last result also available as its parameter (in case the argsStack parameter in the 'then' method was empty)
						return fn.call(this, this.lastResult,
							function(r) { this.done(r); }.bind(this),
							function(r) { this.fail(r); }.bind(this)
						);
					}.bind(this);
					// Execute the function (check its return and _stack.loop property to determine whether the function should be looped)
					return "once" === fnCall() || false === this._stack.loop || this._stack.done.push(fnCall);
				} else {
					_f.shift();
				}
			};
			// When the FIFO stack is empty, it means that the execution is ended
			// (until an asynchronous call to the 'then' method occurs and restarts execution)
			this._stack.start = false; // Make possible the restart of execution
			this._callback('complete'); // Execute registered 'complete' callbacks
			// Loop the stack if requested
			if (this._stack.loop) {
				while (this._stack.done.length) this.then(this._stack.done.shift());
				if (tool.isNumber(this._stack.loop)) this._stack.loop--;
			}
		},

		// Get the number of remaining functions in the stack
		stackLength: function () {
			for (var length = 0, _f = this._stack.fn, i = 0; i < _f.length; i++) length += _f[i].length;
			if (this._stack.start) length++; // Add to length the asynchronous function which is being executed
			return length;
		},

		// Empty the stack (use it instead of the 'done' method when something wrong occurred)
		fail: function (data) {
			this._callback('failure', data); // Execute registered 'failure' callbacks
			tool.extend(this._stack, { fn: [], start: false, stop: false, loop: false, done: [] }); // Empty the stack
			this.done(this.lastResult); // Calling 'done' method on an empty stack will just execute registered 'complete' callbacks
		},

		// Empty the stack from the main stack (immediately after)
		nowFail: function (data) {
			return this.now(function () {
				this.fail(data);
			});
		},

		// Call the 'done' method of another Core instance
		thenDone: function (_this) {
			if (this === _this) {
				tool.console.error("Core.thenDone: Improper use of the method. " +
					"Instead of calling this.thenDone(this) simply call this.done().");
				this.done(); // Fallback
				return this;
			}
			return this.then(function (result) {
				_this.done(result); // Export the last result to external instance
				this.done();
			});
		},

		// Call the 'done' method after all listed cores are ended. Use this method instead of: .done()
		doneWhen: function (/* core1, core2, ... */) {
			var callDone = function (args) {
				for (var results = [], i = 0; i < args.length; i++) results.push(args[i].lastResult);
				this.done(results);
			}.bind(this, arguments);
			for (var cores = [], length = 0, i = 0; i < arguments.length; i++) {
				if (arguments[i].stackLength()) cores.push(arguments[i].onComplete(function () {
					if (++length === cores.length) callDone();
				}));
			}
			if (!cores.length) callDone();
			return this;
		},

		// Call the 'done' method after all listed cores are ended. Use this method instead of: .then()
		when: function (/* core1, core2, ... */) {
			for (var cores = [], i = 0; i < arguments.length; i++) cores.push(arguments[i].stop()); // Stop each core
			return this.then(function () {
				for (var i = 0; i < cores.length; i++) cores[i].restart(); // Restart each core
				this.doneWhen.apply(this, cores);
			});
		},

		// Delay the stack execution
		delay: function (duration, once) {
			return this.then(function (result) {
				setTimeout(function () {
					this.done(result); // Propagate the last result
				}.bind(this), duration);
				if (once) return "once";
			});
		},

		// Stop the stack execution immediately (or as soon as possible)
		stop: function (callback, useThen) {
			if (!this._stack.fn.length || this._stack.stop) return this;
			this._stack.stop = true;
			var fn = function () {
				if (callback) callback.call(this);
				// Omit the instruction this.done(); (whose call is deferred to the 'restart' method)
				return "once";
			};
			return useThen ? this.then(fn) : this.now(fn);
		},

		// Restart the stack execution after it was stopped
		restart: function (callback) {
			if (!this._stack.fn.length || !this._stack.stop) return this;
			delete this._stack.stop;
			if (callback) callback.call(this);
			this.done(this.lastResult); // Call the 'done' method outside the scope of the 'then' method (and propagate the last result)
			return this;
		},

		// Loop the stack execution (false to disable the functions record. 0 for record without loop. 1,2,... to loop n times. true to infinite loop)
		loop: function (count) {
			if (this._stack.loop) return this;
			return this.then(function (result) {
				this._stack.loop = (undefined === count) || count;
				this.done(result); // Propagate the last result
				return "once"; // Prevent nested calls !
			});
		},

		// Get the remaining count of loops
		loopCount: function () {
			return this._stack.loop;
		},

		// Erase the list of recorded functions
		erase: function (callback) {
			if (!this._stack.loop) return this;
			tool.extend(this._stack, { loop: false, done: [] });
			if (callback) callback.call(this);
		},

		// Register callback on failure
		onFailure: function (fn, once) {
			fn._once = !!once;
			this._stack.callback.failure.push(fn);
			return this;
		},

		// Register callback on complete
		onComplete: function (fn, once) {
			fn._once = !!once;
			this._stack.callback.complete.push(fn);
			return this;
		},

		// Execute registered callbacks
		_callback: function (type, data) {
			var fn = this._stack.callback[type], newFn = [];
			for (var i = 0; i < fn.length; i++) {
				fn[i].call(this, data);
				fn[i]._once || newFn.push(fn[i]);
			}
			this._stack.callback[type] = newFn;
		},

		// Trigger Core event
		triggerEvent: function (event, data) {
			dom.trigger(dom.getDoc(), 'avine.core.event', { event: { core: this, type: event }, data: data });
			return this;
		},

		// Add Core event listener
		addListener: function (core, events, fn, once) {
			var args = Core._listenerArgs(arguments, 4);
			core = args[0]; events = args[1]; fn = args[2]; once = args[3];
			events = tool.isString(events) ? tool.splitString(events, ',') : (events || []);
			if (!events.length) events.push(undefined); // Listen all events type
			for (var i = 0; i < events.length; i++) (function (type) {
				var listen = function (e) {
					var d = e.detail;
					if (core && d.event.core !== core) {
						// In case the event was triggered by a clone, propagate it to its prototype
						var c = d.event.core;
						while ((c = Object.getPrototypeOf(c)) && (c instanceof Core)) {
							if (c === core) {
								d.event.trigger = d.event.core; // Original event trigger
								d.event.core = core; // = c
								break;
							}
						}
					}
					if (core && d.event.core !== core || type && d.event.type !== type) return;
					fn.call(this, d.event, d.data);
				}.bind(this);
				dom.on(dom.getDoc(), 'avine.core.event', listen, once);
				this._stack.listeners.push({ core: core, type: type, fn: fn, remove: function () { dom.off(dom.getDoc(), 'avine.core.event', listen); } });
			}.bind(this))(events[i]);
			return this;
		},

		// Remove Core event listener
		removeListener: function (core, events, fn) {
			var args = Core._listenerArgs(arguments, 3);
			core = args[0]; events = args[1]; fn = args[2];
			events = tool.isString(events) ? tool.splitString(events, ',') : (events || []);
			for (var i = 0; i < this._stack.listeners.length; i++) {
				var listener = this._stack.listeners[i];
				if (core && listener.core !== core || events.length && !tool.inArray(listener.type, events) || fn && listener.fn !== fn) continue;
				listener.remove();
				this._stack.listeners[i] = null;
			}
			for (var listeners = [], i = 0; i < this._stack.listeners.length; i++) if (this._stack.listeners[i]) listeners.push(this._stack.listeners[i]);
			this._stack.listeners = listeners; // Clean listeners list
			return this;
		}

	};

	// Handle multiple signatures of the methods removeListener and addListener
	Core._listenerArgs = function (args, length) {
		var types = [function(c){ return c instanceof Core; }, function(c){ return tool.isArray(c) || tool.isString(c); }, tool.isFunction]; // removeListener requires 3 args
		if (4 === length) types.push(tool.isBoolean); // addListener requires 4 args
		return tool.signature(args, types);
	};

	// Helper for debugging (list manually the available "then" methods)
	Core.extendAsyncList = ['then', 'thenDone', 'doneWhen', 'delay', 'loop']; // By default .stop() is not a "then" method, unless its parameter useThen=true

	// Extend Core with asynchronous methods
	Core.extendAsync = function (/*fn*/) {
		var fn = Core._getFnList(arguments);
		for (var p in fn) if (Core._checkProp.call(this.prototype, p)) (function (core, prop) {
			(core.prototype[prop] = function () {
				var args = arguments, f = function () {
					this.currentMethod = prop;
					return fn[prop].apply(this, args); // Call the function in the appropriate context and propagate the original arguments
				}.bind(this);
				return this.then(f); // Push the function in the stack (instead of executing it immediately)
			}).toString = function () {
				return fn[prop].toString(); // Get the original function
			};
			var list = 'extendAsyncList';
			(core[list] = core[list] || []).push(p); // Helper for debugging (list the available "then" methods)
		})(this, p);
	};

	// Extend Core with synchronous methods
	Core.extendProto = function (/*fn*/) {
		var fn = Core._getFnList(arguments);
		for (var p in fn) if (Core._checkProp.call(this.prototype, p)) {
			var prop = ('builder' !== p) ? p : Core._getBuilder(this);
			this.prototype[prop] = fn[p]; // Add the method to this prototype
		}
	};

	// Extend Core with static functions (or any type of data)
	Core.extendStatic = function (/*fn*/) {
		var fn = Core._getFnList(arguments);
		for (var prop in fn) if (Core._checkProp.call(this, prop)) this[prop] = fn[prop]; // Add the property to this constructor
	};

	// Clone Core to create modules (inheritance)
	Core.module = function (Name, stopArgsPropagation) {
		var _Core = this, // Refers to Core or one of its modules
		Module = function (/* arguments */) {
			_Core.apply(this, stopArgsPropagation ? [] : arguments); // Call the constructor of the parent module and propagate arguments
			var builder = Core._getBuilder(_Core) + Name;
			if (this[builder]) this[builder].apply(this, arguments); // Call the builder method (if defined) and propagate arguments
		};
		// Inherits Module from _Core
		Module.prototype = Object.create(_Core.prototype);
		Module.prototype.constructor = Module; // Correct the constructor pointer (because it points to _Core instead of Module)
		// Set Module name and path
		Module.moduleName = Name;
		Module.modulePath = (_Core.modulePath || 'Core') + '.' + Name;
		// Clone extends functions
		Module.extendAsync = function (/*fn*/) { Core.extendAsync.apply(Module, arguments); };
		Module.extendProto = function (/*fn*/) { Core.extendProto.apply(Module, arguments); };
		Module.extendStatic = function (/*fn*/) { Core.extendStatic.apply(Module, arguments); };
		// Clone the module function itself !
		Module.module = function () { return Core.module.apply(Module, arguments); };
		// Expose the module as a new property
		if (Name in this) {
			tool.console.error("Core.module: Unable to expose the module because '" + Module.modulePath + "' already exists.");
		} else {
			this[Name] = Module;
			(this.module.list = this.module.list || []).push(Name); // Store the list of modules
		}
		return Module;
	};

	// Check the property availability in this core
	Core._checkProp = function (prop) {
		if (!(prop in this)) return true;
		tool.console.error("Core._checkProp: Unable to complete the core extension because the property '" + prop + "' already exists.");
		return false;
	};

	// Get a formatted list of functions from 2 possible signatures
	Core._getFnList = function (args) {
		var fn = {}; // { name1: fn1, name2: fn2, ... }
		if (2 == args.length && undefined !== args[1]) fn[args[0]] = args[1];
		else fn = args[0];
		return fn;
	};

	// Get the unique name of the custom constructor for Core or one of its modules
	Core._getBuilder = function (_Core) {
		return 'build' + (_Core.modulePath || 'Core').replace(/\./g, '');
	};

	// Expose avine
	window.avine.Core = Core;

})(this);

// avine-require.js
(function (window) {
	"use strict";

	var avine = window.avine;
	if (!avine || !avine.tool || !avine.dom || !avine.Core) return;
	var tool = avine.tool, dom = avine.dom, Core = avine.Core;

	Core.module('Require');

	Core.Require.extendProto({

		builder: function (baseUrl) {
			this.setBaseUrl(baseUrl);
		},

		setBaseUrl: function(baseUrl) {
			this.baseUrl = baseUrl || '';
			return this;
		}

	});

	Core.Require.extendAsync({

		scripts: function (/*urls1, urls2, ..., again*/) {
			_loads.call(this, 'scripts', arguments).done();
		},

		styles: function (/*urls1, urls2, ..., again*/) {
			_loads.call(this, 'styles', arguments).done();
		},

		images: function (/*urls1, urls2, ...*/) { // always again
			_loads.call(this, 'images', arguments).done();
		}

	});

	function _loads(method, args) {
		var again = tool.isBoolean(args[args.length - 1]) ? Array.prototype.pop.call(args) : false;
		tool.arrayEach(args, function(urls) {
			for (var i = 0; i < (urls = [].concat(urls)).length; i++) urls[i] = this.baseUrl + urls[i];
			this.then(function(result, done, fail) {
				dom.require[method](urls, done, fail, again);
			});
		}.bind(this));
		return this;
	}

})(this);

// avine-$.js
(function (window) {
	"use strict";

	var avine = window.avine;
	if (!avine || !avine.tool || !avine.dom || !avine.Core) return;
	var tool = avine.tool, dom = avine.dom, Core = avine.Core;

	// Create the module $
	Core.module('$');

	Core.$.extendProto({

		builder: function (data/*, $instance*/) { // = 'buildCore$'
			this.elements = [];
			if (tool.isString(data)) {
				var create = dom.create(data, false);
				this.elements = create ? [create] : dom.selector(data);
			} else if (data instanceof Core.$) {
				this.elements = data.get();
			} else {
				if (!tool.isArray(data)) data = data ? [data] : [];
				for (var i = 0; i < data.length; i++)
					if (dom.isElement(data[i]) || 9 == data[i].nodeType)
						if (!tool.inArray(data[i], this.elements))
							this.elements.push(data[i]);
			}
			this._history = [];
			if (arguments.length >= 2 && arguments[1] instanceof Core.$) {
				var $instance = arguments[1];
				this._history = $instance._history;
				this._history.push($instance);
			}
		},

		checkElements: function () {
			dom.insertDefaultSheet();
			var css = 'avn-core-highlight';
			tool.console.log(this.elements.length + ' item(s) in the selection.');
			this.addClass(css).on('click', function () {
				new Core.$(this).removeClass(css);
			}, true);
			return this;
		},

		get: function (i, getArray) {
			if (undefined === i) return this.elements;
			var element = this.elements[i];
			return getArray ? (element ? [element] : []) : element;
		},

		size: function () {
			return this.elements.length;
		},

		end: function () {
			if (!this._history.length) return this;
			return this._history[this._history.length - 1];
		},

		each: function (fn, i) {
			var result = [], elements = this.get(i, true), n = elements.length;
			for (i = 0; i < n; i++) (function (index, element) {
				result.push(fn.call(element, index, element));
			})(i, elements[i]);
			if (!tool.arrayLength(result, [undefined])) return this;
			return (1 === result.length) ? result[0] : result; // Notice: if you want .each() to always return a value then fn() should never return undefined
		},

		_each: function (data, call, type, a, b, c, d) {
			var result = [], fn;
			switch (type) {
				case 'instance': fn = function (data) { return new call(data, a, b, c, d); }; break;
				case 'property': fn = function (data) { return (undefined === a) ? data[call] : data[call] = a; }; break; // getter or setter
				case 'method': fn = function (data) { return data[call](a, b, c, d); }; break;
				case 'function': default: fn = function (data) { return call(data, a, b, c, d); }; break;
			}
			for (var n = data.length, i = 0; i < n; i++) result.push(fn(data[i]));
			return (1 === result.length) ? result[0] : result;
		},

		coords: function (i) {
			return this._each(this.get(i, true), dom.coords, 'function');
		},

		isVisible: function (all, i) {
			var elements = this.get(i, true), n = elements.length,
				r = this._each(elements, dom.isVisible);
			if (1 == n) return r;
			if (!all) return tool.inArray(true, r);
			for (i = 0; i < n; i++) if (false === r[i]) return false;
			return true;
		},

		text: function (text, i) {
			var r = this._each(this.get(i, true), dom.text, 'function', text);
			return (undefined === text) ? r : this;
		},

		html: function (html, i) {
			var r = this._each(this.get(i, true), 'innerHTML', 'property', html);
			return (undefined === html) ? r : this;
		},

		// Notice : check the method dom.css() to learn more about the flexibility of this method
		css: function (attr, value, i) {
			var r = this._each(this.get(i, true), dom.css, 'function', attr, value);
			if (!tool.isObject(attr) && undefined === value) return r;
			return this;
		},

		previousStyle: function (property, i) {
			return this._each(this.get(i, true), dom.previousStyle, 'function', property);
		},

		zIndex: function (i) {
			this._each(this.get(i, true), dom.zIndex, 'function');
			return this;
		},

		data: function (name, value, i) {
			var r = this._each(this.get(i, true), dom.data, 'function', name, value);
			return (undefined === value) ? r : this;
		},

		attr: function (attr, value, i) {
			if (undefined === value) {
				return this._each(this.get(i, true), 'getAttribute', 'method', attr);
			} else {
				this._each(this.get(i, true), 'setAttribute', 'method', attr, value);
				return this;
			}
		},

		prop: function (prop, value, i) {
			var r = this._each(this.get(i, true), dom.prop, 'function', prop, value);
			return undefined === value ? r : this;
		},

		className: function (value, i) {
			var r = this._each(this.get(i, true), dom.className, 'function', value);
			return undefined === value ? r : this;
		},

		hasClass: function (value, i) {
			return this._each(this.get(i, true), dom.hasClass, 'function', value);
		},

		addClass: function (value, i) {
			this._each(this.get(i, true), dom.addClass, 'function', value);
			return this;
		},

		removeClass: function (value, i) {
			this._each(this.get(i, true), dom.removeClass, 'function', value);
			return this;
		},

		toggleClass: function (value, i) {
			this._each(this.get(i, true), dom.toggleClass, 'function', value);
			return this;
		},

		parent: function (i) {
			var parent = [], elements = this.get(i, true), n = elements.length;
			for (i = 0; i < n; i++) {
				var elm = elements[i].parentNode;
				if (dom.isElement(elm)) parent.push(elm);
			}
			return new Core.$(parent, this); // Duplicated parents are automatically removed
		},

		parents: function (i) {
			var parents = [], elements = this.get(i, true), n = elements.length;
			for (i = 0; i < n; i++) parents = parents.concat(dom.parents(elements[i]));
			return new Core.$(parents, this); // Duplicated parents are automatically removed
		},

		children: function (pos, i) {
			var children = [], elements = this.get(i, true), n = elements.length;
			for (i = 0; i < n; i++) tool.merge2Array(children, dom.children(elements[i], pos));
			return new Core.$(children, this);
		},

		prev: function (i) {
			var prev = [], elements = this.get(i, true), n = elements.length;
			for (i = 0; i < n; i++) {
				var elm = dom.prev(elements[i]);
				if (elm) prev.push(elm);
			}
			return new Core.$(prev, this);
		},

		next: function (i) {
			var next = [], elements = this.get(i, true), n = elements.length;
			for (i = 0; i < n; i++) {
				var elm = dom.next(elements[i]);
				if (elm) next.push(elm);
			}
			return new Core.$(next, this);
		},

		prevAll: function (i) {
			var all = [], elements = this.get(i, true), n = elements.length;
			for (i = 0; i < n; i++) tool.merge2Array(all, dom.prevAll(elements[i]));
			return new Core.$(all, this);
		},

		nextAll: function (i) {
			var all = [], elements = this.get(i, true), n = elements.length;
			for (i = 0; i < n; i++) tool.merge2Array(all, dom.nextAll(elements[i]));
			return new Core.$(all, this);
		},

		find: function (query, i) {
			var find = [], elements = this.get(i, true), n = elements.length;
			for (i = 0; i < n; i++) tool.merge2Array(find, dom.selector(query, elements[i]));
			return new Core.$(find, this);
		},

		reduce: function (start, count) {
			var size = this.size();
			start = 'first' == start ? 0 : 'last' == start ? size-1 : start;
			start = start >= 0 ? start : size+start >= 0 ? size+start : undefined;
			if (undefined === start) start = size; // The slice will return an empty array
			if (undefined === count) count = 1;
			var reduce = this.elements.slice(start, start + count);
			return new Core.$(reduce, this);
		},

		prepend: function (newElement, i) {
			if (!dom.isElement(newElement, true)) newElement = new Core.$(newElement).get(0);
			var elements = this.get(i, true), n = elements.length;
			for (i = 0; i < n; i++) {
				if (i) newElement = dom.cloneNode(newElement);
				var first = new Core.$(elements[i]).children('first'); // Known issue: elements[i].firstChild is a extNode
				if (first.size()) first.before(newElement);
				else new Core.$(elements[i]).append(newElement);
			}
			return this;
		},

		append: function (newElement, i) {
			if (!dom.isElement(newElement, true)) newElement = new Core.$(newElement).get(0);
			var elements = this.get(i, true), n = elements.length;
			for (i = 0; i < n; i++) {
				if (i) newElement = dom.cloneNode(newElement);
				elements[i].appendChild(newElement);
			}
			return this;
		},

		appendTo: function (data, i) {
			var elements = this.get(i, true), n = elements.length;
			for (i = 0; i < n; i++) new Core.$(data).append(elements[i]);
			return this;
		},

		before: function (newElement, i) {
			if (!dom.isElement(newElement, true)) newElement = new Core.$(newElement).get(0);
			var elements = this.get(i, true), n = elements.length;
			for (i = 0; i < n; i++) {
				if (i) newElement = dom.cloneNode(newElement);
				elements[i].parentNode.insertBefore(newElement, elements[i]);
			}
			return this;
		},

		after: function (newElement, i) {
			if (!dom.isElement(newElement, true)) newElement = new Core.$(newElement).get(0);
			var elements = this.get(i, true), n = elements.length;
			for (i = 0; i < n; i++) {
				if (i) newElement = dom.cloneNode(newElement);
				var next = new Core.$(elements[i]).next();
				if (next.size()) next.before(newElement);
				else new Core.$(elements[i].parentNode).append(newElement);
			}
			return this;
		},

		wrap: function (newElement, i) {
			if (!dom.isElement(newElement)) newElement = new Core.$(newElement).get(0);
			var elements = this.get(i, true), n = elements.length, newClone;
			for (i = 0; i < n; i++) {
				if (n > 1 && i < n - 1) newClone = dom.cloneNode(newElement);
				elements[i].parentNode.insertBefore(newElement, elements[i]);
				newElement.appendChild(dom.remove(elements[i]));
				newElement = newClone;
			}
			return this;
		},

		remove: function (i) {
			var newElements = [], remove = [];
			for (var j = 0; j < this.elements.length; j++) {
				if (undefined === i || j == i) remove.push(dom.remove(this.elements[j]));
				else newElements.push(this.elements[j]);
			}
			this.elements = newElements; // no _history
			return (1 === remove.length) ? remove[0] : remove;
		},

		replace: function (newElement, i) {
			if (!dom.isElement(newElement, true)) newElement = new Core.$(newElement).get(0);
			var newElements = [], replace = [];
			for (var j = 0; j < this.elements.length; j++) {
				if (j) newElement = dom.cloneNode(newElement);
				if (undefined === i || j == i) {
					replace.push(dom.replace(newElement, this.elements[j]));
					newElements.push(newElement);
				} else {
					newElements.push(this.elements[j]);
				}
			}
			this.elements = newElements; // no _history
			return (1 === replace.length) ? replace[0] : replace;
		},

		on: function (event, fn, once, i) {
			this._each(this.get(i, true), dom.on, 'function', event, fn, once);
			return this;
		},

		click: function (fn, once, i) {
			return this.on('click', fn, once, i);
		},

		off: function (event, fn, i) {
			this._each(this.get(i, true), dom.off, 'function', event, fn);
			return this;
		},

		trigger: function (event, detail, canBubble, i) {
			this._each(this.get(i, true), dom.trigger, 'function', event, detail, canBubble);
			return this;
		},

		triggerClick: function (i) {
			return this._each(this.get(i, true), dom.triggerClick);
		},

		cloneNode: function (childs, events, i) { // TODO: renommer en clone (ainsi que la fonction dom)
			var clone = this._each(this.get(i, true), dom.cloneNode, 'function', childs, events);
			return new Core.$(clone, this);
		},

		drag: function (settings, callback, i) {
			settings = settings || {};
			if (settings.trigger) settings.trigger = new Core.$(settings.trigger).get(0); // For now the trigger should be a single DOM element
			this._each(this.get(i, true), dom.drag, 'function', settings, callback);
			return this;
		}

	});

	Core.$.extendAsync({

		animate: function (properties, duration, easing, callback, stoppable, i) {
			var anim = [];
			this.each(function () {
				anim.push(dom.animate(this, properties, duration, easing, function () {
					if (callback) callback.call(this);
				}));
			}, i);
			this.then(function () {
				if (!stoppable) {
					var _this = this;
					(function step() {
						var remain = false;
						for (i = 0; i < anim.length; i++) if (anim[i].step()) remain = true;
						if (remain) dom.duration.request(step);
						else _this.done();
					})();
				} else {
					if (anim.length) this.then(function stepStoppable() { // IE bug fix: don't call this function 'step'
						var remain = false;
						for (i = 0; i < anim.length; i++) if (anim[i].step()) remain = true;
						if (remain) this.then(stepStoppable);
						dom.duration.request(function () { this.done(); }.bind(this));
						return "once"; // Prevent nested calls !
					});
					this.done();
				}
			});
			this.done();
			return "once"; // Do not compute anim twice when loop !
		},

		hide: function (duration, value, easing, callback, stoppable, i) {
			this.animate({ opacity: undefined !== value ? value : 0 }, duration, easing, callback, stoppable, i).then(function () {
				if (!value) this.css('display', 'none', i);
				this.done();
			}).done();
		},

		show: function (duration, value, easing, callback, stoppable, i) {
			this.each(function (index) {
				if (undefined === i || index == i) {
					var cStyle = dom.computedStyle(this);
					if (!dom.isVisible(this)) dom.css(this, 'opacity', '0');
					if ('none' == cStyle.display) dom.css(this, 'display', dom.previousStyle(this, 'display') || 'block');
					if ('hidden' == cStyle.visibility) dom.css(this, 'visibility', dom.previousStyle(this, 'visibility') || 'visible');
				}
			});
			this.animate({ opacity: undefined !== value ? value : 1 }, duration, easing, callback, stoppable, i).done();
		}

	});

	// Code generator to create plugins for the $ module
	var plugin = function (name, settings, methods) {
		settings = settings || {};
		var Plugin = Core.$.module(name);
		Plugin.extendProto({
			_wakeup: function (options) {
				this.optionsHasChanged = !!(options && this.options && (function (s, t) { // s=source, t=target
					for (var p in s) if (t[p] != s[p]) return true;
				})(options, this.options));
				if (!this.options || options) this.options = tool.extend(null, settings, this.options || {}, options || {});
				if (this.isInit && 'init' in this) this.init.apply(this, arguments);
				if ('wakeup' in this) this.wakeup.apply(this, arguments);
			},
			callMethod: function (action/*, arg1, arg2, ...*/) {
				if (action in methods) return methods[action].apply(this, Array.prototype.slice.call(arguments, 1));
			}
		});
		methods = methods || {};
		var fn = function (action) {
			var args = arguments;
			return this.each(function () {
				var r, d = 'avn-plugin-instance-' + name, p = dom.data(this, d); // r=result, d=data, p=plugin
				if (undefined === p) {
					dom.data(this, d, p = new Plugin(this));
					p.methods = (function (o) { var a = []; for (var p in o) a.push(p); return a; })(methods); // Helper for debugging (list the available methods)
					p.id = tool.uniqueId(Plugin.modulePath); // Unique instance id per Plugin (optional unless plugin.helper is used)
					p.isInit = true;
				} else {
					p.isInit = false;
				}
				if (!(action in methods)) {
					p._wakeup.apply(p, args || []);
					if (p.options.defaultMethod) r = p.callMethod(p.options.defaultMethod); // Call default method if defined
				} else {
					p._wakeup();
					r = p.callMethod.apply(p, args);
				}
				return r;
			});
		};
		Core.$.extendProto(name, fn);
		Plugin.settings = settings;
		Plugin.methods = methods;
		return Plugin;
	};
	plugin.helper = {
		getClass: function (suffix) {
			return 'avn-' + tool.jsProperty2Css(this.constructor.moduleName) + '-' + suffix;
		},
		getId: function (prefix, suffix) {
			return prefix + this.id + (undefined !== suffix ? '-' + suffix : '');
		},
		bag: function (/*classSuffix1, classSuffix2, ...*/) {
			var bag = {}, i, n = arguments.length;
			for (i = 0; i < n; i++) bag[arguments[i]] = this.getClass(arguments[i]);
			this.bag = bag; // Overwrite
		},
		tag: function (tag, bag, content, idSuffix) {
			var param = { tag: tag, className: bag, content: content || '', id: this.getId(bag, idSuffix) };
			if ('a' == tag.toLowerCase()) param.href = '#';
			return dom.create(param);
		}
	};
	Core.$.extendStatic('plugin', plugin);

	Core.$.extendProto('getPluginInstance', function(name) { return this.data('avn-plugin-instance-' + name); });

	// Expose a shortcut to instantiate the Core.$ module
	var $ = function (data) {
		return new Core.$(data);
	};
	$.expose = function (name) {
		$.backup[name] = window[name];
		window[name] = $;
	};
	$.backup = {};
	$.restore = function (name) {
		for (var n in $.backup) {
			if (name && name !== n || undefined !== window[n] && $ !== window[n]) continue;
			if (undefined !== $.backup[n]) {
				window[n] = $.backup[n];
			} else if (n in window) {
				delete window[n];
			}
			delete $.backup[n];
		}
	};
	$.expose('avn');
	$.expose('$'); // Comment this line to not expose the $

	for (var p in window.avine) $[p] = window.avine[p]; // Add alias for tool, dom and Core
	$.fn = Core.$; // Add alias to the Core.$ module

	// Expose avine
	window.avine.$ = $;

})(this);
