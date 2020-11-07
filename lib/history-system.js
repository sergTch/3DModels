const HistorySystem = (() => {
	function HistorySystem(equal, limit) {
		EventDispatcher.apply(this);

		this.stack = [];
		this.limit = limit || 0;
		this.position = -1;
		if (equal)
			this.equal = equal;
	}

	HistorySystem.prototype = Object.create(EventDispatcher.prototype);

	Object.defineProperties(HistorySystem.prototype, {
		constructor: { value: HistorySystem },
		[Symbol.toStringTag]: { value: 'HistorySystem' },

		length: {
			get() {
				return this.stack.length;
			},
			set(len) {
				this.stack.length = len;
			},
		},
	});

	const goto = (hs, i) => {
		hs.position = i;
		if (hs.position < 0)
			hs.position = 0;
		else if (hs.position >= hs.stack.length)
			hs.position = hs.stack.length - 1;
		const current = hs.stack[hs.position];
		hs.dispatchEvent('change', { current });
		return current;
	};

	Object.assign(HistorySystem.prototype, {
		equal: (a, b) => a === b,
		push(el) {
			const last = this.stack[this.position];
			if (!last || !this.equal(el, last)) {
				this.stack.length = ++this.position;
				this.stack.push(el);
				this.dispatchEvent('push', { current: el });
				this.dispatchEvent('change', { current: el });
			}
			return el;
		},
		forEach(func) {
			const p = this.position;
			for (let i = 0; i < this.stack.length; i++)
				func(this.stack[i], i < p ? this.BEFORE : i === p ? this.ACTIVE : this.AFTER, i, this);
		},
		goto(i) {
			const current = goto(this, i);
			this.dispatchEvent('goto', { current });
			return current;
		},
		undo(n = 1) {
			const current = goto(this, this.position - n);
			this.dispatchEvent('undo', { current });
			return current;
		},
		redo(n = 1) {
			const current = goto(this, this.position + n);
			this.dispatchEvent('redo', { current });
			return current;
		},
	});

	function setConstant(name, value) {
		Object.defineProperty(HistorySystem, name, { enumerable: true, value });
		Object.defineProperty(HistorySystem.prototype, name, { enumerable: true, value });
	}

	[ 'BEFORE', 'ACTIVE' ,'AFTER' ].forEach((name ,i) => setConstant(name, i));

	return HistorySystem;
})();
