/* Avine. Copyright (c) 2013-2015 Stéphane Francel (http://avine.fr). Dual licensed under the MIT and GPL Version 2 licenses. */

(function ($) {

	var plugin = $.fn.plugin('overlay', {

		target:		'next',		// 'prev', 'next', 'title' (source attribute), css selector (or false to set it later)
		position:	'auto',		// 'absolute', 'fixed or 'auto' for tooltip behavior
		width:		'auto',		// px, % or 'auto'
		height:		'auto',		// important notice: if you are using 'title' or 'action' blocks then set only height:'auto'
		mouseover:	300,		// source triggers the target on mouseover after a delay in milliseconds (or false)
		mouseout:	600,		// delay after mouseout before turning off the target
		shift:		10,			// space between the target and source in px for tooltip behavior (when position='auto')
		fade:		150,		// target fadeIn and fadeOut in milliseconds
		opacity:	0.9,		// target opacity
		blur:		false,		// delay to blur the page background in milliseconds (or false)
		blurOpacity:0.6,		// page background opacity
		textClose:	'Close',	// close button
		textConfirm:'Confirm',
		textReset:	'Reset',
		title:		'',			// add a title block into the target
		follow:		true		// follow the source link after the target displayed

	}, {

	});

	plugin.extendProto($.fn.plugin.helper);

	plugin.extendProto({

		init: function () {
			this.bag('source', 'target', 'content', 'tooltip', 'close', 'blur', 'drag', 'title', 'action', 'confirm', 'reset');
			this.initSource();
			this.setTarget();
		},

		initSource: function () {
			var _this = this;
			this.addClass(this.bag.source)
			.on('click', function(e){
				if (!_this.target) return;
				_this.handleSource(e);
			});

			$('body').on('keydown', function(e){
				if (!_this.target) return;
				if ('27' == e.keyCode) _this.close(); // press ESC to close target
			});

			if (this.options.mouseover) {
				var fire;
				this.on('mouseover', function (e) {
					if (!_this.target) return;
					fire = setTimeout(function(){
						_this._noCloseButton = true;
						clearTimeout(_this._timeoutToHide);
						_this.handleSource(e);
					}, _this.options.mouseover);
				})
				.on('mouseout', function(e){
					if (!_this.target) return;
					clearTimeout(fire);
					if (_this.options.blur) return;
					if (!e.mouseEventJustHappened) return;
					_this._timeoutToHide = setTimeout(function() {
						_this.close();
					}, _this.options.mouseout);
				});
			}
			this.source = this.get(0);
		},

		setTarget: function( target ) {
			var content = this._findContent(target);
			if (!content) return;

			// wrap target
			target = content.className(this.bag.content)
			.css({ display: 'block', overflow: 'auto' })
			.wrap(this.tag('div', this.bag.target)).parent()
			.css({ display: 'none', position: 'absolute' });

			// draggable
			var div;
			if (this.options.title) div = this.tag('div', this.bag.title, this.options.title);
			if (!this.options.mouseover && !this.options.blur) {
				div = div || this.tag('div', this.bag.drag);
				target.drag({ trigger: div });
			}
			if (div) target.prepend(div);

			// confirm/reset actions
			if (this.source.href && this.options.follow && this.options.blur) {
				target.append(this.tag('div', this.bag.action));
				var action = $('#' + this.getId(this.bag.action)),
				confirm = this.tag('a', this.bag.confirm, this.options.textConfirm);
				confirm.href = this.source.href;
				confirm.title = this.options.textConfirm;
				action.append(confirm);//.append(' '); // FIXME does not work in ie8
				this.addCloseButton(this.bag.reset, this.options.textReset, action);
			}

			if ('auto' == this.options.position) target.addClass(this.bag.tooltip);

			var body = $('body');
			if (body.size()) body.append($.dom.remove(target.get(0)));

			if (this.options.mouseover) {
				var _this = this;
				target.on('mouseover', function() {
					clearTimeout(_this._timeoutToHide);
				})
				.on('mouseout', function(e) {
					if (!e.mouseEventJustHappened) return;
					_this._timeoutToHide = setTimeout(function() {
						_this.close();
					}, _this.options.mouseout);
				});
			}
			target.on('click', function() {
				target.zIndex();
			});
			this.target = target.get(0);
		},

		_findContent: function (target) {
			if (undefined !== target) this.options.target = target;
			if (false === this.options.target) return;
			var content, t = this.options.target; // alias
			if ('title' == t) {
				if (!this.source.title) return;
				content = $(this.source).after($.dom.create({ tag: 'div', content: this.source.title })).next();
				this.source.title = '';
			} else if ($.tool.inArray(t, ['prev', 'next'])) {
				content = $(this.source)[t]();
			} else {
				content = $(t).reduce('first'); // make sure it's a single DOM element
			}
			if (!content.size()) return;

			// remember the target as a content before wrap it
			this.content = content.get(0);
			return content;
		},

		handleSource: function( e ){
			if (!this._active) {
				this.open();
				this.targetPosition(); // must be done after the open() method
			} else if (this.options.follow) {
				return true;
			}
			e.preventDefault();
		},

		targetPosition: function() {
			// set target size
			var t = { w:this.options.width, h:this.options.height };
			$(this.content).css({ width:t.w, height:t.h });

			var content = $.dom.coords(this.content),
			target = $.dom.coords(this.target), // FIXME target n'a aucune dimension !!!
			win = $.dom.coords(window),
			dsb = 32; // double scroll bar size

			var space = this._getSpacing(content, target), offset;
			if (-1 != t.w.indexOf('px') && target.width > win.width - dsb) {
				offset = target.width - parseInt(t.w, 10);
				t.w = (win.width - offset - dsb - space.horizontal) + 'px';
				if (parseInt(t.w, 10) < contentMin.width) t.w = contentMin.width + 'px';
			}
			if (-1 != t.h.indexOf('px') && target.height > win.height - dsb) {
				offset = target.height - parseInt(t.h, 10);
				t.h = (win.height - offset - dsb - space.vertical) + 'px';
				if (parseInt(t.h, 10) < contentMin.height) t.h = contentMin.height + 'px';
			}
			$(this.content).css({ width:t.w, height:t.h });
			target = $.dom.coords(this.target);

			// set target position
			var top, left;
			if ('auto' == this.options.position) {
				var source = $.dom.coords(this.source);
				space = this._getSpacing(source, win);
				if ('top' == space.vMax) {
					top = source.top - target.height - this.options.shift;
				} else {
					top = source.bottom + this.options.shift;
				}
				if ('left' == space.hMax) {
					left = source.right - target.width - this.options.shift;
				} else {
					left = source.left + this.options.shift;
				}
			} else {
				top = parseInt((win.height - target.height)/2, 10),
				left = parseInt((win.width - target.width)/2, 10);
				if ('fixed' == this.options.position) {
					this.target.style.position = 'fixed';
				} else {
					top += win.top;
					left += win.left;
				}
			}
			$(this.target).css({
				top: top + 'px',
				left: left + 'px'
			}).zIndex();
		},

		_getSpacing: function( child, parent ) {
			var s = {
				top:	child.top - parent.top,
				left:	child.left - parent.left,
				bottom:	parent.bottom - child.bottom,
				right:	parent.right - child.right
			};
			s.horizontal = s.left + s.right;
			s.vertical = s.top + s.bottom;
			s.hMax = s.left > s.right ? 'left' : 'right';
			s.vMax = s.top > s.bottom ? 'top' : 'bottom';
			return s;
		},

		close: function() {
			if (!this._active) return;
			this._active = false;
			this._get$target().hide(this.options.fade);
			if (this.options.blur) this.blurHide();
		},

		open: function() {
			if (this._active) return;
			this.addCloseButton();
			this._active = true;
			this._get$target().css({ display: 'block', opacity: '0' }).show(this.options.fade, this.options.opacity);
			if (this.options.blur) this.blurShow();
		},

		_get$target: function() {
			if (!this._$target) this._$target = $(this.target);
			return this._$target;
		},

		addCloseButton: function( id, content, target ) {
			id = id || this.bag.close;
			content = content || this.options.textClose;
			if (!target) {
				target = $(this.target);
				if (this._noCloseButton) return;
				this._noCloseButton = true; // prevent duplicate button
			}
			var close = this.tag('a', id, content);
			close.title = content;
			target.append(close);
			var _this = this;
			$(close).on('click', function(e){
				e.preventDefault();
				_this.close();
			});
		},

		blurHide: function() {
			var blur = $('#' + this.getId(this.bag.blur)).hide(this.options.blur);
			setTimeout(function(){ blur.remove(); }, this.options.blur);
		},

		blurShow: function() {
			var blur = this.tag('div', this.bag.blur);
			$('body').append(blur);
			$(blur).show(this.options.blur, this.options.blurOpacity);
		}

	});

	plugin.DRAG = {
		mouseover:	false,
		position:	'absolute'
	};

	plugin.PROMPT = {
		mouseover:	false,
		position:	'fixed',
		fade:		0,
		blur:		150
	};

})(avine.$);
