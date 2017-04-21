/* Avine. Copyright (c) 2014 S. Francel (http://avine.fr). Dual licensed under the MIT and GPL Version 2 licenses. */

(function ($) {

	plugin = $.fn.plugin('hover', {

		mouseOver: false,
		mouseOverDelay: 125,
		mouseOut: false,
		mouseOutDelay: 1000,
		noCollapse: false

	}, {

		toggle: function (index, action) {
			if (undefined === index) index = 0;
			var $item = this.$items.reduce(index);
			if (!$item.size()) return;
			var isOpen = $item.hasClass(this.bag.jsOver);
			if (action && ('open' == action && isOpen || 'close' == action && !isOpen)) return;
			$item.children().reduce(0).trigger('click');
		},

		open: function (index) {
			this.callMethod('toggle', index, 'open');
		},

		close: function () {
			var _this = this;
			this.$items.each(function(index) {
				if ($(this).hasClass(_this.bag.jsOver)) _this.callMethod('toggle', index, 'close');
			});
		}

	});

	plugin.extendProto($.fn.plugin.helper);

	plugin.extendProto({

		init: function () {
			this.bag('wrap', 'jsOver', 'jsOut', 'jsMouseOver', 'jsMouseOut', 'jsNoCollapse');
			this.$root = $(this).removeClass(this.bag.wrap);
			this.handleOptions();
			this.setItemsAndTitles();
			this.handleTitles();
			this.handleHoverOut();
		},

		wakeup: function () {
			if (this.optionsHasChanged) this.handleOptions();
		},

		handleOptions: function () {
			var opt = ['mouseOver', 'mouseOut', 'noCollapse'], opt2Bag = function (o) {
				return 'js' + o.substr(0, 1).toUpperCase() + o.substr(1); // 'jsMouseOver', 'jsMouseOut', 'jsNoCollapse'
			};
			for (var i = 0; i < opt.length; i++) {
				var o = opt[i], b = opt2Bag(o);
				if (this.isInit && this.$root.hasClass(this.bag[b])) this.options[o] = true;
				this.$root[this.options[o] ? 'addClass' : 'removeClass'](this.bag[b]);
			}
		},

		setItemsAndTitles: function () {
			var titles = [];
			this.$items = this.$root.children().addClass(this.bag.jsOut).each(function () {
				titles.push($(this).children().get(0));
			});
			this.titles = titles;
		},

		handleTitles: function () {
			this.handleTitleOnce(function ($title, index) {
				this.handleClick($title, index);
				this.handleOver($title, index);
			});
		},

		handleTitleOnce: function (callback) {
			$.tool.arrayEach(this.titles, function (title, index) {
				var $title = $(title);
				if (true == $title.data('avnHoverJsHandled')) return;
				callback.call(this, $title, index);
				$title.data('avnHoverJsHandled', true);
			}, this);
		},

		handleClick: function ($title, index) {
			var $item = $title.parent(), $target = $title.next(), _this = this;
			$title.click(function () {
				if (_this.overInProgress) return;
				var isOpen = $item.hasClass(_this.bag.jsOver);
				if (_this.options.noCollapse && isOpen) return;
				_this.$items.each(function (currentIndex) {
					var $this = $(this), $childs = $this.children();
					_this.closeDeepHover($childs.reduce(1));
					if (!$this.hasClass(_this.bag.jsOver)) return;
					$this.toggleClass([_this.bag.jsOver, _this.bag.jsOut]);
					_this.trigger('hoverClose', {
						index: currentIndex, source: $childs.get(0), target: $childs.get(1)
					}, false);
				});
				if (!isOpen) {
					_this.closeDeepHover(_this.$root.prevAll());
					_this.closeDeepHover(_this.$root.nextAll());
					_this.openParentsHover();
					$item.toggleClass([_this.bag.jsOver, _this.bag.jsOut]);
					_this.trigger('hoverOpen', {
						index: index, source: $title.get(0), target: $target.get(0)
					}, false);
				}
			});
		},

		openParentsHover: function() {
			var _this = this;
			this.$root.parents().each(function() {
				var $this = $(this);
				if ($this.hasClass(_this.bag.jsOut)) $this.children().reduce(0).trigger('click');
			});
		},

		closeDeepHover: function ($elements) {
			$elements.find('.' + this.bag.jsOver).parent().each(function() {
				var $this = $(this);
				if ($this.getPluginInstance('hover')) $this.hover('close');
			});
		},

		handleOver: function ($title, index) {
			var $item = $title.parent(), _this = this;
			$title.on('mouseover, mouseout', function (e) {
				if (!_this.options.mouseOver || !e.mouseEventJustHappened) return;
				if ('mouseout' == e.type) {
					_this.overInProgress = false;
					return $item.fail();
				}
				_this.overInProgress = true;
				$item.delay(_this.options.mouseOverDelay).then(function () {
					_this.overInProgress = false;
					if (!this.hasClass(_this.bag.jsOver)) $title.trigger('click');
					this.done();
				});
			});
		},

		handleHoverOut: function () {
			this.$root.on('mouseover, mouseout', function (e) {
				if (!this.options.mouseOut || !e.mouseEventJustHappened) return;
				if ('mouseover' == e.type) return this.$root.fail();
				var _this = this;
				this.$root.delay(this.options.mouseOutDelay).then(function () {
					var $item = _this.$root.find('.' + _this.bag.jsOver);
					if ($item.size()) $item.children().reduce(0).trigger('click');
					this.done();
				});
			}.bind(this));
		}

	});

})(avine.$);



(function ($) {

	var plugin = $.fn.plugin('carousel', {

		itemsStart: 0, // index of the first visible item
		itemsShift: 0, // shift factor between items
		itemsPerPage: 1, // number of visible items per page
		itemsPerNav: 1, // number of items to slide per navigation
		itemsMinWidth: 320, // (for responsive) min item width before reduce the itemsPerPage (in px) or false

		pagination: true,
		pageWrapCss: 'jsPageDefault', // css class suffix for the pages buttons wrapper
		pageContent: '<span>{index}</span>', // html of the page button ('<i class="fa fa-circle"></i>')
		pageContainer: false, // domElement, css id selector or false

		navigation: true,
		navCss: 'jsNavDefault', // css class suffix for the nav button
		navPrev: '<i class="fa fa-chevron-left"></i>', // html of the previous nav button
		navNext: '<i class="fa fa-chevron-right"></i>', // html of the next nav button
		navContainer: false, // 'pagination', domElement, css id selector or false

		slideSpeed: 700, // slide speed (in ms)
		autoPlay: 3500, // delay between slides (in ms) or false
		stopOnHover: true, // stop autoPlay on mouseover and restart autoPlay on mouseout
		stopOnAction: true, // stop autoPlay when clicking on page or nav button (should not be disabled for mobile accessibility)

		swipe: true, // make the slides draggable
		swipeShift: 15, // allow drag items out of range (in % of the page width)
		swipeSmooth: 0, // Smoothness of the drag behaviour (in ms)

		sloganDelay: 250 // delay before the slogan appears

	}, {

		goTo: function (index, softMax) {
			this.goTo(index, softMax);
		},

		jumpTo: function (index) {
			this.jumpTo(index);
		},

		addItem: function (index, html) {
			this.addItem(index, html);
		},

		removeItem: function (index) {
			this.removeItem(index);
		},

		refresh: function () {
			this.isInit = false; // force
			this.build();
		},

		play: function () {
			this.play();
		},

		stopPlay: function () {
			this.stopPlay();
		}

	});

	plugin.extendProto($.fn.plugin.helper);

	plugin.extendProto({

		init: function () {
			this.bag('jsStart', 'jsPageWrap', 'jsPage', 'jsPageCurrent', 'jsNav', 'jsNavPrev', 'jsNavNext', 'jsItemActive', 'jsSloganHide');

			this.$root = $(this);
			this.$wrap = this.$root.parent();

			this.build();
			this.addNavigation('prev');
			this.addNavigation('next');

			this.handleWindowResize();
			this.handleHover();
			if (this.options.swipe) this.handleSwipe();
		},

		wakeup: function () {
			if (this.optionsHasChanged) this.build();
		},

		build: function () {
			this.handleItems();
			this.handleTransition();
			this.addPagination();
			if (this.isInit) {
				this.handleCurrentItem();
			} else {
				this.jumpTo(this.currentItem);
				$(this.nav).css('display', this.options.navigation ? 'block' : 'none');
			}
			if (!!this.options.autoPlay) this.play();
		},

		handleItems: function() {
			this.$items = this.$root.children();
			this.pageWidth = this.$wrap.coords().width;

			var perPage = this.options.itemsPerPage; // alias
			do {
				this.itemsPerPage = perPage; // Real number of items per page
				this.itemWidth = Math.floor(this.pageWidth / perPage);
				this.pageExtra = this.pageWidth % perPage;
			}
			while (this.options.itemsMinWidth && (this.itemWidth < this.options.itemsMinWidth) && --perPage >= 1);
			perPage = this.itemsPerPage;

			this.itemsPerNav = this.options.itemsPerNav; // Real number of items per nav
			if (this.itemsPerNav > perPage) this.itemsPerNav = perPage;

			var shift = this.options.itemsShift; // alias
			this.itemsWidth = [];
			for (var i = 0; i < perPage; i++) {
				this.itemsWidth.push(this.itemWidth + (i < this.pageExtra ? 1 : 0) - shift * (perPage - 1));
			}
			var width = this.itemsWidth, count = this.$items.size(), rootWidth = 0; // alias
			this.$items.each(function (index) {
				var w = width[index % perPage], mr = (index < count - 1) ? shift * perPage : 0;
				$(this).css({ 'width': w + 'px', 'margin-right': mr + 'px', 'display': 'block' });
				rootWidth += w + mr;
			});
			this.rootWidth = rootWidth;
			this.$root.css('width', this.rootWidth + 'px');
		},

		handleTransition: function (speed) {
			speed = (undefined !== speed) ? speed : this.options.slideSpeed;
			$.tool.arrayEach($.tool.cssVendors('transition'), function (transition) {
				this.$root.css(transition, 'left ' + speed + 'ms ease-out');
			}.bind(this));
		},

		addPagination: function () {
			if (this.isInit) {
				this.$pageWrap = $('<div>').addClass(this.bag.jsPageWrap);
				if (this.options.pageWrapCss) this.$pageWrap.addClass(this.getClass(this.options.pageWrapCss));
			} else {
				this.$pageWrap.find('.' + this.bag.jsPage).remove();
			}
			this.pagesIndex = [];
			var maxIndex = this.$items.size() - this.itemsPerPage;
			for (var navIndex = 0, index = 0; index <= maxIndex; index++) (function (index) {
				if (index % this.itemsPerNav && index != maxIndex) return;
				this.pagesIndex.push(index);

				var $page = $(this.tag('a', this.bag.jsPage, this.options.pageContent.replace('{index}', navIndex + 1), index));
				$page.click(function (e) {
					e.preventDefault();
					if (this.options.stopOnAction) this.stopPlay();
					this.goTo(index);
				}.bind(this)).appendTo(this.$pageWrap);

				if (!this.options.pagination) $page.css('display', 'none');
				navIndex++;
			}.bind(this))(index);
			if (this.isInit) {
				this.$pageWrap.appendTo(this.options.pageContainer ? this.options.pageContainer : this.$wrap);
			}
		},

		handleCurrentItem: function () {
			var start = this.options.itemsStart,
				bagStart = this.bag.jsStart;
			this.$items.each(function (index) {
				if ($(this).hasClass(bagStart)) start = index;
			});
			this.currentItem = start;
			this.jumpTo(this.currentItem);
		},

		addNavigation: function (dir) {
			var isNext = 'next' == dir, navOpt = isNext ? 'navNext' : 'navPrev';
			var $nav = $(this.tag('a', isNext ? this.bag.jsNavNext : this.bag.jsNavPrev, this.options[navOpt]));
			$nav.addClass(this.bag.jsNav);
			if (this.options.navCss) $nav.addClass(this.getClass(this.options.navCss));
			if (!this.options.navigation) $nav.css('display', 'none');
			$nav.click(function (e) {
				e.preventDefault();
				if (this.options.stopOnAction) this.stopPlay();
				this.goTo(this.currentItem + (isNext ? +1 : -1) * this.itemsPerNav, true);
			}.bind(this));
			if ('pagination' == this.options.navContainer) {
				this.$pageWrap[isNext ? 'append' : 'prepend']($nav);
			} else {
				$nav.appendTo(this.options.navContainer ? this.options.navContainer : this.$wrap);
			}
			this.nav = this.nav || [];
			this.nav.push($nav.get(0));
		},

		goTo: function (index, softMax) {
			var trigger = function (event) {
				this.$root.trigger(event, {
					currentItem: this.currentItem,
					itemsPerPage: this.itemsPerPage,
					$collection: this.$items.reduce(this.currentItem, this.itemsPerPage),
					instance: this
				});
				this.hideSlogan('avnCarousel.start' == event);
			}.bind(this);
			trigger('avnCarousel.start');
			var maxIndex = this.$items.size() - this.itemsPerPage;
			if (index > maxIndex) {
				this.currentItem = (softMax ? this.currentItem < maxIndex : index < this.$items.size()) ? maxIndex : 0;
			} else if (index < 0) {
				this.currentItem = (softMax ? this.currentItem > 0 : false) ? 0 : maxIndex;
			} else {
				this.currentItem = index;
			}
			this.$items.removeClass(this.bag.jsItemActive);
			for (var left = 0, i = 0; i< this.currentItem; i++) {
				left -= this.itemsWidth[i % this.itemsPerPage] + this.options.itemsShift * this.itemsPerPage;
			}
			this.$root.css('left', left + 'px').delay(this.options.slideSpeed).then(function () { // TODO: can be improved using 'transitionEnd' event...
				this.$items.reduce(this.currentItem, this.itemsPerPage).addClass(this.bag.jsItemActive);
				var $pages = this.$pageWrap.find('.' + this.bag.jsPage).removeClass(this.bag.jsPageCurrent);
				for (var i = 0; i < this.pagesIndex.length; i++) {
					if (this.currentItem >= this.pagesIndex[i] && (i + 1 == this.pagesIndex.length || this.currentItem < this.pagesIndex[i + 1])) {
						$pages.reduce(i).addClass(this.bag.jsPageCurrent);
						break;
					}
				}
				trigger('avnCarousel.end');
				this.$root.done();
			}.bind(this));
		},

		jumpTo: function (index) {
			this.$root.css('display', 'none');
			this.goTo(index);
			this.$root.css('display', 'block');
		},

		handleWindowResize: function () {
			var timeout, _this = this;
			$.dom.on(window, 'resize', function () {
				if (_this.$wrap.coords().width == _this.pageWidth) return;
				_this.$wrap.css('opacity', '0');
				clearTimeout(timeout);
				timeout = setTimeout(function () {
					_this.callMethod('refresh');
					_this.$wrap.css('opacity', '1');
				}, 250);
			});
		},

		handleHover: function () {
			this.$wrap.on('mouseover, mouseout', function (e) {
			if (!this.options.autoPlay || !this.options.stopOnHover || !e.mouseEventJustHappened) return;
				'mouseover' == e.type ? this.stopPlay() : this.play();
			}.bind(this));
		},

		handleSwipe: function () {
			var shift = this.pageWidth * this.options.swipeShift / 100;
			this.$root.drag({
				position: '',
				cursor: '',
				direction: 'horizontal',
				zIndexOnTop: false,
				start: function () {
					this.handleTransition(this.options.swipeSmooth);
				}.bind(this),
				progress: function (o, pos) {
					if (this.options.stopOnAction) this.stopPlay();
					if (pos.left <= -(this.rootWidth - this.pageWidth) - shift || pos.left >= shift) delete pos.left;
				}.bind(this)
			}, function (o) {
				this.handleTransition();
				var deltaPx = o.from.left - o.to.left;
				if (deltaPx < this.itemWidth / 2) deltaPx *= 2;
				var deltaIndex = Math.round(deltaPx / this.itemWidth),
					newIndex = this.currentItem + deltaIndex,
					maxIndex = this.$items.size() - this.itemsPerPage;
				if (0 == this.currentItem && newIndex < this.currentItem || maxIndex == this.currentItem && newIndex > this.currentItem) {
					newIndex = this.currentItem;
				}
				this.goTo(newIndex, true);
			}.bind(this));
		},

		addItem: function (index, html) {
			this.$items.each(function (i) {
				if (index != i) return;
				$(this).before($(html));
			});
			if (index <= this.currentItem) this.currentItem++;
			this.callMethod('refresh');
		},

		removeItem: function (index) {
			this.$items.reduce(index).remove();
			if (index <= this.currentItem) this.currentItem--;
			this.callMethod('refresh');
		},

		play: function () {
			var d = this.options.autoPlay + this.options.slideSpeed;
			if (!this.loopCount()) this.loop().delay(d).then(function () {
				this.goTo(this.currentItem + this.itemsPerNav, true);
				this.done();
			});
		},

		stopPlay: function () {
			this.nowFail();
		},

		hideSlogan: function (start) {
			this.$items.find('.avn-carousel-slogan')[start ? 'addClass' : 'removeClass'](this.bag.jsSloganHide)
		}

	});

})(avine.$);



(function ($) {

	var plugin = $.fn.plugin('toggle', {

		trigger: false

	});

	plugin.extendProto($.fn.plugin.helper);

	plugin.extendProto({

		init: function () {
			this.bag = { hover: 'avn-hover', hoverJsOver: 'avn-hover-jsOver', hoverJsOut: 'avn-hover-jsOut'};

			this.$root = $(this).removeClass(this.bag.hover).addClass(this.bag.hoverJsOut);

			this.$source = this.$root.find('.' + this.getClass('source'));
			this.$target = this.$root.find('.' + this.getClass('target'));

			this.$trigger = this.options.trigger ? $(this.options.trigger) : this.$source;
			this.$trigger.css('cursor', 'pointer').click(function (e) {
				e.preventDefault();
				this.$root.toggleClass([this.bag.hoverJsOver, this.bag.hoverJsOut]);
				this.trigger('avnToggle', !!this.$root.hasClass(this.bag.hoverJsOver));
			}.bind(this));
		}

	});

})(avine.$);



/*// DEPRECATED
(function ($) {

	var plugin = $.fn.plugin('navbarToggle', {

		trigger: false

	});

	plugin.extendProto($.fn.plugin.helper);

	plugin.extendProto({

		init: function () {
			this.bag('jsClose', 'jsOpen');

			this.$root = $(this).addClass(this.bag.jsClose);
			this.$source = this.$root.find('.' + this.getClass('source'));
			this.$target = this.$root.find('.' + this.getClass('target'));

			this.$trigger = this.options.trigger ? $(this.options.trigger) : this.$source;
			this.$trigger.css('cursor', 'pointer').click(function (e) {
				e.preventDefault();
				this.$source.toggleClass(this.bag.jsOpen);
				this.trigger('avnNavbarToggle', !!this.$source.hasClass(this.bag.jsOpen));
			}.bind(this));
		}

	});

})(avine.$);*/






/* // DEPRECATED
(function ($) {

	var plugin = $.fn.plugin('tab', {

		mouseOver: false,
		mouseOverDelay: 125,
		mouseOut: false,
		mouseOutDelay: 1000,
		noCollapse: false

	}, {

		toggle: function (index, action) {
			if (undefined === index) index = 0;
			var $item = this.$items.reduce(index);
			if (!$item.size()) return;
			var isOpen = $item.hasClass(this.bag.jsOpen);
			if (action && ('open' == action && isOpen || 'close' == action && !isOpen)) return;
			$item.children().reduce(0).trigger('click');
		},

		open: function (index) {
			this.callMethod('toggle', index, 'open');
		},

		close: function (index) {
			this.callMethod('toggle', index, 'close');
		}

	});

	plugin.extendProto($.fn.plugin.helper);

	plugin.extendProto({

		init: function () {
			this.bag('jsClose', 'jsOpen', 'jsMouseOver', 'jsMouseOut', 'jsNoCollapse');
			this.$root = $(this).addClass(this.bag.jsClose);
			this.handleOptions();
			this.setItemsAndTitles();
			this.handleTitles();
			this.handleTabOut();
		},

		wakeup: function () {
			if (this.optionsHasChanged) this.handleOptions();
		},

		handleOptions: function () {
			var opt = ['mouseOver', 'mouseOut', 'noCollapse'], opt2Bag = function (o) {
				return 'js' + o.substr(0, 1).toUpperCase() + o.substr(1); // 'jsMouseOver', 'jsMouseOut', 'jsNoCollapse'
			};
			for (var i = 0; i < opt.length; i++) {
				var o = opt[i], b = opt2Bag(o);
				if (this.isInit && this.$root.hasClass(this.bag[b])) this.options[o] = true;
				this.$root[this.options[o] ? 'addClass' : 'removeClass'](this.bag[b]);
			}
		},

		setItemsAndTitles: function () {
			var titles = [];
			this.$items = this.$root.find('.avn-tab-item').each(function () {
				titles.push($(this).children().get(0));
			});
			this.titles = titles;
		},

		handleTitles: function () {
			this.handleTitleOnce(function ($title, index) {
				this.handleClick($title, index);
				this.handleOver($title, index);
			});
		},

		handleTitleOnce: function (callback) {
			$.tool.arrayEach(this.titles, function (title, index) {
				var $title = $(title);
				if (true == $title.data('avnTabJsHandled')) return;
				callback.call(this, $title, index);
				$title.data('avnTabJsHandled', true);
			}, this);
		},

		handleClick: function ($title, index) {
			var $item = $title.parent(), _this = this;
			$title.click(function () {
				if (_this.clickInProgress) return;
				var isOpen = $item.hasClass(_this.bag.jsOpen);
				if (_this.options.noCollapse && isOpen) return;
				_this.$items.each(function (currentIndex) {
					var $this = $(this);
					if (!$this.hasClass(_this.bag.jsOpen)) return;
					$this.removeClass(_this.bag.jsOpen);
					_this.trigger('tabClose', { index: currentIndex, item: $this.get(0) });
				});
				if (!isOpen) {
					$item.addClass(_this.bag.jsOpen);
					_this.trigger('tabOpen', { index: index, item: $item.get(0) });
				}
			});
		},

		handleOver: function ($title, index) {
			var $item = $title.parent(), _this = this;
			$title.on('mouseover, mouseout', function (e) {
				if ('a' == this.nodeName.toLowerCase()) return;
				if (!_this.options.mouseOver || !e.mouseEventJustHappened) return;
				if ('mouseout' == e.type) return $item.fail();
				_this.clickInProgress = true;
				$item.delay(_this.options.mouseOverDelay).then(function () {
					_this.clickInProgress = false;
					if (!this.hasClass(_this.bag.jsOpen)) $title.trigger('click');
					this.done();
				});
			});
		},

		handleTabOut: function () {
			this.$root.on('mouseover, mouseout', function (e) {
				if (!this.options.mouseOut || !e.mouseEventJustHappened) return;
				if ('mouseover' == e.type) this.$root.fail();
				var $item = this.$root.find('.' + this.bag.jsOpen);
				if (!$item.size()) return;
				if ('mouseout' == e.type) this.$root.delay(this.options.mouseOutDelay).then(function () {
					$item.children().reduce(0).trigger('click');
					this.done();
				});
			}.bind(this));
		}

	});

})(avine.$);
*/