function SimpleAnimation(options, listeners = [], autoPlay = false) {
	window.EventDispatcher.apply(this);

	listeners.forEach(listener => this.on(listener.type, listener.callback));

	Object.assign(this, options);

	if (autoPlay)
		this.play();
}

SimpleAnimation.prototype = Object.create(window.EventDispatcher.prototype);
Object.defineProperties(SimpleAnimation.prototype, {
	constructor: { value: SimpleAnimation },
	[Symbol.toStringTag]: { value: 'SimpleAnimation' },
});

SimpleAnimation.prototype.play = function() {
	this.dispatchEvent('start');
	const start = performance.now();

	const animate = (ms) => {
		const { duration, timing } = this;
		var timeFraction = (ms - start) / duration;

		if (timeFraction > 1)
			timeFraction = 1;

		this.dispatchEvent('progress', { progress: timing(timeFraction) })

		if (timeFraction < 1)
			requestAnimationFrame(animate);
		else
			this.dispatchEvent('end');
	}

	requestAnimationFrame(animate);
}

function animate(options) {
	var start = performance.now();

	requestAnimationFrame(function animate(time) {
		var timeFraction = (time - start) / options.duration;
		if (timeFraction > 1)
			timeFraction = 1;

		options.draw(options.timing(timeFraction));

		if (timeFraction < 1)
			requestAnimationFrame(animate);
	});
}