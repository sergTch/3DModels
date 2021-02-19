const EasyEvent = (() => {
	function EasyEvent(type, target = null, ...props) {
		Object.assign(this, ...props);

		let defaultPrevented = false;

		Object.defineProperties(this, {
			type: { value: type, enumerable: true },
			target: { value: target, enumerable: true },
			timeStamp: { value: performance.now(), enumerable: true },
			defaultPrevented: { get: () => defaultPrevented, enumerable: true },
		});
		this.preventDefault = () => defaultPrevented = true;
	}

	Object.defineProperties(EasyEvent.prototype, {
		constructor: { value: EasyEvent },
		[Symbol.toStringTag]: { value: 'EasyEvent' },
	});

	return EasyEvent;
})();

const EventDispatcher = (() => {
	function EventDispatcher() {
		Object.defineProperty(this, '_listeners', { value: {} });
	}

	Object.defineProperties(EventDispatcher.prototype, {
		constructor: { value: EventDispatcher },
		[Symbol.toStringTag]: { value: 'EventDispatcher' },
	});

	Object.assign(EventDispatcher.prototype, {
		addEventListener(type = '', callback, disposable = false) {
			if (typeof type !== 'string')
				throw `type can only be a string! you set: "${typeof type}".`;
			if (typeof callback !== 'function')
				throw `callback can only be a function, you set: "${typeof callback}".`;

			let callbacks = this._listeners[type];
			if (!callbacks)
				callbacks = this._listeners[type] = [];

			callbacks.push({
				callback: callback,
				disposable: disposable,
			});
		},
		dispatchEvent(event, ...props) {
			if (typeof event === 'string')
				event = new EasyEvent(event, this, ...props);

			const callbacks = this._listeners[event.type];
			const on = this[`on${event.type}`];

			if (typeof on === 'function')
				on(event);

			if (callbacks)
				for (let i = 0; i < callbacks.length; i++) {
					callbacks[i].callback.call(this, event);
					if (callbacks[i].disposable)
						callbacks.splice(i--, 1);
				}
		},
		removeEventListener(type, callback) {
			let callbacks = this._listeners[type];

			if (callback && callbacks)
				this._listeners[type] = callbacks.filter(c => c !== callback);
		},
	});

	EventDispatcher.prototype.on = EventDispatcher.prototype.addEventListener;

	return EventDispatcher;
})();
