const Keybinder = (() => {
	const FuncKeys = [ 'Alt', 'Ctrl', 'Shift', 'Win', 'Cmd' ];
	FuncKeys.names = FuncKeys.map(key => `${key.toLowerCase()}Key`);

	FuncKeys.get = function(key) {
		return Math.floor(Math.pow(2, this.indexOf(key)));
	};

	FuncKeys.getByIndex = function(i) {
		return this.get(this[i]);
	};

	function keydown(e) {
		if (this.target && this.target !== e.target)
			return;

		this.keys[e.code] = true;

		Object.defineProperty(e, metaKey, { enumerable: true, value: e.metaKey });

		FuncKeys.names.forEach((key, i) => this.funcKeys |= e[key] ? FuncKeys.getByIndex(i) : 0);

		this.binds.forEach(bind => {
			const { funcKeys, keys, callback } = bind;
			const { condition, preventDefault } = bind.options;

			if ((!condition || condition(e, bind)) && this.funcKeys === funcKeys) {
				for (var i = 0; i < keys.length; i++)
					if (!this.keys[keys[i]])
						break;

				if (i === keys.length) {
					if (preventDefault)
						e.preventDefault();
					callback(e, bind);
				}
			}
		});
	}

	function keyup(e) {
		this.keys[e.code] = false;

		Object.defineProperty(e, metaKey, { enumerable: true, value: e.metaKey });

		FuncKeys.names.forEach((key, i) => this.funcKeys &= ~(!e[key] ? FuncKeys.getByIndex(i) : 0));
	}

	function blur() {
		for (const key in this.keys)
			this.keys[key] = false;
		this.funcKeys = 0;
	}

	function Keybinder(target, currentWindow = window) {
		this.keys = {};
		this.binds = [];
		this.target = target;
		this.funcKeys = 0;

		currentWindow.addEventListener('keydown', keydown.bind(this));
		currentWindow.addEventListener('keyup', keyup.bind(this));
		currentWindow.addEventListener('blur', blur.bind(this));
	}

	Object.defineProperties(Keybinder.prototype, {
		constructor: { value: Keybinder },
		[Symbol.toStringTag]: { value: 'Keybinder' },
	});

	function setConstant(name, value) {
		Object.defineProperty(Keybinder, name, { enumerable: true, value });
		Object.defineProperty(Keybinder.prototype, name, { enumerable: true, value });
	}

	FuncKeys.forEach(key => setConstant(key.toUpperCase(), FuncKeys.get(key)));

	setConstant('isMac', /macintosh/.test(navigator.userAgent.toLowerCase()));

	const metaKey = Keybinder.isMac ? 'cmdKey' : 'winKey';

	Keybinder.prototype.bind = function(keys, callback, options = {}) {
		if (!Array.isArray(keys))
			keys = [ keys ];

		if (typeof options === 'function')
			options = { condition: options };

		options = Object.assign({
			preventDefault: true,
		}, options);

		keys.forEach(keysset => {
			if (typeof keysset !== 'string')
				throw 'ighsefhisehgosefsef';

			const keys = [];
			let funcKeys = 0;

			keysset.split('+').forEach(key => {
				if (FuncKeys.includes(key))
					funcKeys |= FuncKeys.get(key)
				else if (!keys.includes(key))
					keys.push(key);
			});

			this.binds.push({ funcKeys, keys, callback, options });
		});

		return callback;
	}

	return Keybinder;
})();
