/* Avine. Copyright (c) 2013-2015 Stéphane Francel (http://avine.fr). Dual licensed under the MIT and GPL Version 2 licenses. */

(function ($) {

	var Plugin = function () {};
	Plugin.prototype = {
		setId: (function () {
			var id = 1;
			return function (element) {
				if (element) {
					this.id = $.dom.data(element, 'avn-plugin-id') || $.dom.data(element, 'avn-plugin-id', id++);
				} else {
					this.id = id++;
				}
			};
		})(),
		getId: function (idPrefix, idSuffix) {
			return idPrefix + this.id + (undefined !== idSuffix ? '-' + idSuffix : '');
		},
		tag: function (tag, idPrefix, content, idSuffix) {
			content = content || '';
			var param = { tag: tag, className: idPrefix, content: content, id: this.getId(idPrefix, idSuffix) };
			if ('a' == tag) param.href = '#';
			return $.dom.create(param);
		},
		param: function (defaultParam, userParam) {
			for (var p in userParam) if (p in defaultParam) defaultParam[p] = userParam[p];
			this.param = defaultParam; // overwrite
		},
		attr: function (prefix, list) {
			var attr = {}, i, n = list.length;
			for (i = 0; i < n; i++) attr[list[i]] = prefix + '-' + list[i];
			this.attr = attr; // overwrite
		}
	};

	avine.Core.$.extendProto({

		slideshow: function (param, val) {

			var plugin = new Plugin();

			plugin.param({

				start: 0,		// first slide index
				fade: false,	// fade transition in ms (false to disable)

				autoSlide: false,	// auto-slide delay in ms (false to disable)
				autoStop: false,	// stop auto-slide on navigation click

				autoHeight: false,	// ajust the root height according to each slide in ms (false to disable) only if autoSlide != false
				autoHeightEase: 'easeInOutQuart',

				navigPos: 'top',	// 'top', 'bottom' (false to disable)
				navigContainer: {	// on each area, true/false to enable/disable or string which represents a css selector
					prev: true,
					anchors: true,
					next: true,
					counter: true,
					resume: true
				},
				navigCss: '',		// css class of the navigation		  TODO: changer le nom en navigClassName

				textPrev: 'Previous',
				textNext: 'Next',
				textResume: 'Resume',
				text2Title: true	// copy tag content to title

			}, param);

			plugin.attr('avnSlideshow', ['root', 'item', 'navig', 'prev', 'anchor', 'next', 'counter', 'resume', 'active']);

			return this.each(function (index, root) {

				plugin.setId(root);

				var $root = $(root),
					$items = $root.children(),
					total = $items.size(),
					current = plugin.param.start;

				var slideshow = {

					init: function () {
						this.setRootHeight();
						$root.addClass(plugin.attr.root);
						$items.addClass(plugin.attr.item);

						if (plugin.param.navigPos) this.navig();
						this.show(this.getCurrent()); // do not use showItem() method
						if (plugin.param.autoSlide) this.autoSlide();
						this.stopOnMouseover(root);
					},

					setRootHeight: function () {
						var height = 0;
						$items.each(function (i) {
							if (!plugin.param.fade || !plugin.param.autoHeight || i == current) {
								var coords = $.dom.coords(this);
								height = Math.max(coords.height, height);
							}
						});
						$root.css('height', height + 'px');
					},

					navig: function () {
						var className = [plugin.attr.navig];
						if (plugin.param.navigCss) className.push(plugin.param.navigCss);
						var navig = $.dom.create({ tag: 'div', className: className.join(' ') }),
						feature = { prev: 'appendPrev', anchors: 'appendAnchors', next: 'appendNext', counter: 'appendCounter', resume: 'appendResume' },
						insert = false;
						for (var area in feature) {
							var container = plugin.param.navigContainer[area];
							if (true === container) {
								this[feature[area]](navig);
								insert = true;
							} else if (false !== container) {
								this[feature[area]]($(container).get(0));
							}
						}
						if (insert) $root['top' == plugin.param.navigPos ? 'before' : 'after'](navig);
					},

					appendPrev: function (container) {
						var tag = plugin.tag('a', plugin.attr.prev, plugin.param.textPrev);
						this.text2Title(tag);
						$(tag).on('click', function (e) { e.preventDefault(); if (slideshow.prev()) slideshow.stopOnNavig(); });
						this.stopOnMouseover(tag);
						$(container).append(tag);
					},

					appendNext: function (container) {
						var tag = plugin.tag('a', plugin.attr.next, plugin.param.textNext);
						this.text2Title(tag);
						$(tag).on('click', function (e) { e.preventDefault(); if (slideshow.next()) slideshow.stopOnNavig(); });
						this.stopOnMouseover(tag);
						$(container).append(tag);
					},

					appendAnchors: function (container) {
						var tabs, tag;
						if (true !== plugin.param.navigContainer.anchors) {
							var children = $(container).children();
							if (total == children.size()) tabs = children.get();
						}
						for (var i = 0; i < total; i++) (function (i) {
							if (tabs) {
								tag = tabs[i];
								$.dom.addClass(tag, plugin.attr.anchor);
								tag.id = plugin.getId(plugin.attr.anchor);
							} else {
								tag = plugin.tag('a', plugin.attr.anchor, ' ' + (i + 1) + ' ');
							}
							tag.id += '-' + i; // unique id
							$(tag).on('click', function (e) { e.preventDefault(); slideshow.anchor(i); slideshow.stopOnNavig(); });
							slideshow.stopOnMouseover(tag);
							$(container).append(tag);
						})(i);
					},

					appendCounter: function (container) {
						$(container).append(plugin.tag('span', plugin.attr.counter));
					},

					appendResume: function (container) {
						if (false === plugin.param.autoStop) return;
						var tag = plugin.tag('a', plugin.attr.resume, plugin.param.textResume);
						this.text2Title(tag);
						$(tag).css({ display: 'none', opacity: 0 }).on('click', function (e) {
							e.preventDefault();
							if (!slideshow.autoSlideStoppedOnNavig) return;
							$(this).hide(plugin.param.fade);
							delete slideshow.autoSlideStoppedOnNavig;
							slideshow.autoSlide();
						});
						$(container).append(tag);
					},

					showResume: function () {
						$('#' + plugin.getId(plugin.attr.resume)).css('display', 'inline').show(plugin.param.fade);
					},

					text2Title: function (tag) {
						if (plugin.param.text2Title) tag.title = $.dom.text(tag);
					},

					showItem: function (i) {
						this[plugin.param.fade ? 'showFade' : 'show'](i);
					},

					show: function (i) {
						$items.css('display', 'none').reduce(i).css('display', 'block');
						this.pageChanged();
					},

					showFade: function (i) {
						$items.then(function () {
							slideshow.fadeInProgress = true;
							this.reduce(slideshow.previous).hide(plugin.param.fade).thenDone(this);
						}).then(function () {
							var $item = this.css('display', 'none').reduce(i).css({ opacity: 0, display: 'block' });
							if (plugin.param.autoHeight) {
								var coords = $.dom.coords($item.get(0));
								$root.animate({
									height: coords.height + 'px'
								}, plugin.param.autoHeight, plugin.param.autoHeightEase).thenDone(this);
							} else {
								this.done();
							}
						}).then(function () {
							slideshow.pageChanged();
							this.reduce(i).show(plugin.param.fade).thenDone(this);
						}).then(function () {
							slideshow.fadeInProgress = false;
							this.done();
						});
					},

					pageChanged: function () {
						$('#' + plugin.getId(plugin.attr.counter)).html(' (' + (current + 1) + ' / ' + total + ') ');
						$root.trigger('slideshowPageChanged', current);
					},

					next: function () {
						if (this.fadeInProgress) return false;
						this.showItem(this.getCurrent(+1));
						return true;
					},

					prev: function () {
						if (this.fadeInProgress) return false;
						this.showItem(this.getCurrent(-1));
						return true;
					},

					anchor: function (i) {
						if (this.fadeInProgress || current == i) return false;
						this.showItem(this.getCurrent(i, false));
						return true;
					},

					getCurrent: function (i, relative) {
						this.previous = current;
						i = i || 0;
						if (false === relative) current = i;
						else current += i;
						if (current >= total) current = 0;
						else if (current < 0) current = total - 1;
						this.updateAnchor();
						return current;
					},

					updateAnchor: function () {
						for (var i = 0; i < total; i++) {
							var anchor = $('#' + plugin.getId(plugin.attr.anchor, i));
							if (current == i) anchor.addClass(plugin.attr.active);
							else anchor.removeClass(plugin.attr.active);
						}
					},

					autoSlide: function () {
						if (this.autoSlideInProgress) return;
						if (!$.dom.isInViewport(root)) {
							setTimeout(function () {
								slideshow.autoSlide();
							}, 250);
							return;
						}
						this.autoSlideInProgress = setInterval(function () {
							if ($.dom.isInViewport(root)) {
								slideshow.next();
							} else {
								slideshow.stopAutoSlide();
								slideshow.autoSlide();
							}
						}, plugin.param.autoSlide + 2 * plugin.param.fade);
					},

					stopAutoSlide: function () {
						if (!this.autoSlideInProgress) return;
						clearInterval(this.autoSlideInProgress);
						delete this.autoSlideInProgress;
					},

					stopOnMouseover: function (elem) {
						if (!plugin.param.autoStop) return;
						$(elem).on('mouseover', function (e) {
							if (e.mouseEventJustHappened) slideshow.stopAutoSlide();
						}).on('mouseout', function (e) {
							if (e.mouseEventJustHappened && !slideshow.autoSlideStoppedOnNavig) slideshow.autoSlide();
						});
					},

					stopOnNavig: function () {
						if (false === plugin.param.autoStop || this.autoSlideStoppedOnNavig) return;
						this.autoSlideStoppedOnNavig = true;
						this.stopAutoSlide();
						this.showResume();
					}

				};
				slideshow.init();

			});

		}

	});

})(avine.$);
