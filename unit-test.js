// Unit-test behaviour

var ut2 = (function () {
	var scripts = [], ut = function (script) { scripts.push(script); };
	ut.get = function (index) { return undefined === index ? scripts : scripts[index]; };
	return ut;
})();

$.dom.ready(function () {
	$('.ut2').each(function (index) {

		var $this = $(this),
			$code = $this.find('.ut-code'),
			$html = $this.find('.ut-area'),
			$log = $this.find('.ut-samp'),
			$run = $this.find('.ut-run');

		$this.addClass('ut2-enabled');

		// For prism code highlighter
		$code = $code.append('<code class="language-markup">').children();

		var tabChars = '    ';

		var html = ($html.size() ? $html.html() : '').replace(/^\s+|\s+$/g, '').replace(/\t/g, tabChars);

		var script = ut2.get(index),
			code = (script || '').toString().split('\n');
		code.shift();
		code.pop();
		code = code.join('\n').replace(/^\s+|\s+$/g, '').replace(/\t/g, tabChars);
		if (code) code = '<script>\n' + code + '\n<' + '/script>';

		$code.text(html + (html && code ? '\n\n' : '') + code);

		var once = ('yes' == $run.data('once')), run = function (e) {
			if (e) e.preventDefault();
			script(function (log) {
				$log.html($log.html() + log + '<br />');
			}, $html.children().get(0));
			if (once) $run.remove();
		};
		$run.size() ? $run.on('click', run, once) : setTimeout(run, 60);

		$this.before($('<a href="#" class="ut-toggle">+</a>').click(function (e) {
			$(this).toggleClass('ut-toggle-hide').next().toggleClass('hide');
			e.preventDefault();
		}).get(0));
	});

	$('.ut-trigger').css('visibility', 'visible').click(function (e) {
		var $trigger = $(this), hide = !$trigger.hasClass('ut-trigger-close');
		$('.ut-toggle').each(function () {
			var $toggle = $(this), hidden = $toggle.hasClass('ut-toggle-hide');
			if (hide !== hidden) $toggle.trigger('click');
		});
		$trigger.toggleClass('ut-trigger-close');
		e.preventDefault();
	});

	// Table of contents
	var $index = $('<ul>');
	$('h2').each(function () {
		var $h2 = $(this), index = $h2.data('index');
		if (!index) {
			index = $.tool.splitString($h2.text(), '(')[0];
			index = index.replace(/\s+/g, '-');
		}
		$h2.attr('id', index);
		var html = ($h2.find('a').size() ? $h2.children() : $h2).html();
		$index.append($('<li>').append($.dom.create({
			tag: 'a', content: html, href: '#' + index
		})));
	});
	$('#index').append($index).css('display', 'block');
});
