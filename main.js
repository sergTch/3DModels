const createSVGElement = (tag) => document.createElementNS('http://www.w3.org/2000/svg', tag);

SVGGraphicsElement.prototype.set = function(param, value) {
	this.setAttribute(param, value);
};

SVGGraphicsElement.prototype.get = function(param) {
	if (this[param] instanceof SVGAnimatedLength)
		return this[param].baseVal.value;
	if (param in this)
		return this[param];
	return this.getAttribute(param);
};

SVGPointList.prototype.forEach = function(func) {
	for (let i = 0; i < this.numberOfItems; i++)
		func(this.getItem(i), i, this);
};

Object.defineProperty(SVGPointList.prototype, 'length', {
	get() { return this.numberOfItems; },
});

SVGPointList.prototype.toArray = function() {
	const ary = [];
	this.forEach(point => ary.push(point));
	return ary;
};

SVGPoint.prototype.equal = function(point) {
	return this === point || (this.x === point.x && this.y === point.y);
};

NodeList.prototype.forEach = function(func) {
	for (let i = 0, l = this.length; i < l; i++)
		func(this[i], i, this);
};



const Tools = document.querySelector('.Tools');
const Editor = document.querySelector('.Editor');
const EditorBackground = document.querySelector('.EditorBackground');

const KB = new Keybinder();

const Tool = Object.create(EventDispatcher.prototype);
;(() => {
	Object.defineProperties(Tool, {
		[Symbol.toStringTag]: { value: 'Tool' },
	});

	EventDispatcher.apply(Tool);

	let active;

	Object.defineProperty(Tool, 'active', {
		get: () => active,
		set(val) {
			active = val;
			document.documentElement.setAttribute('tool', val);
			this.dispatchEvent('change');
		},
	});
})();



;(() => {
	function click() {
		Tool.active = this.dataset.toolType;
	}

	const byDefault = Tools.querySelector('button[data-tool-type][default]');

	Tools.querySelectorAll('button[data-tool-type]').forEach(el => {
		el.addEventListener('click', click);

		const { hotkey } = el.dataset;

		if (hotkey)
			KB.bind(hotkey, () => el.click());
	});

	const toolImage = Tools.querySelector('button[data-tool-type="image"]');

	const fileInput = document.createElement('input');
	fileInput.type = 'file';
	fileInput.accept = 'image/*';
	fileInput.multiple = true;

	fileInput.onchange = async function() {
		if (fileInput.files.length < 1)
			return;

		toolImage.disabled = this.disabled = true;

		for (let i = 0; i < this.files.length; i++) {
			const file = this.files[i];

			try {
				SevingProgress.set(`Image "${file.name}" load started!`);

				if (!/^image\//.test(file.type))
					throw `Unexpected type: "${file.type}"!`;

				await new Promise((resolve, reject) => {
					let fr = new FileReader();
					fr.onload = function() {
						const img = document.createElement('img');
						img.onload = function() {
							const image = createSVGElement('image');
							image.onload = function() {
								Editor.appendChild(this);
								resolve();
							};
							image.onerror = reject;

							let { width, height } = this;

							const size = 128;
							if (width > height) {
								let w = height / width;
								width = size;
								height = w * size;
							} else {
								let h = width / height;
								height = size;
								width = h * size;
							}

							image.setAttribute('width', width);
							image.setAttribute('height', height);
							image.setAttribute('href', this.src);
							image.setAttribute('serialize', '');
						}
						img.onerror = reject;
						img.src = this.result;
					};
					fr.onerror = reject;
					fr.readAsDataURL(file);
				});

				SevingProgress.set(`Image "${file.name}" load successfully!`);
				historySystemAdd('Image', '<i class="far fa-file-image"></i>');
			} catch (e) {
				SevingProgress.set(`Image "${file.name}" load failed!`);
				console.warn(e);
			}
		}

		toolImage.disabled = this.disabled = false;
	};

	toolImage.addEventListener('click', function() {
		fileInput.click();
		byDefault.click();
	});

	Tool.on('change', () => {
		Tools.querySelectorAll('button.active[data-tool-type]').forEach(el => el.classList.remove('active'));

		const tool = Tools.querySelector(`button[data-tool-type="${Tool.active}"]`);
		if (tool)
			tool.classList.add('active');
	});

	byDefault.click();
})();





;(() => {
	EditorBackground.onload = function() {
		Editor.set('width', this.width);
		Editor.set('height', this.height);
	};

	EditorBackground.src = 'd1e01ecb5039d4732687fb3ec2c449a5135566488b75486352bd056.jpg';
})();





const historySystem = new HistorySystem();
const HistoryEl = document.querySelector('.History table');

historySystem.on('change', function() {
	HistoryEl.innerHTML = '';

	this.forEach(({ name, icon }, status, i) => {
		const row = HistoryEl.insertRow();
		row.insertCell().innerHTML = icon || '';
		row.insertCell().innerHTML = name || '';
		row.onclick = () => {
			Editor.innerHTML = this.goto(i).data;
			Tool.active = 'move';
		};
		if (status === this.ACTIVE)
			row.classList.add('active');
		else if (status === this.AFTER)
			row.classList.add('shadow');
	});
});

historySystem.equal = (a, b) => a.data === b.data;
const historySystemAdd = (name, icon) => historySystem.push({ name, icon, data: Editor.innerHTML });

/*
 * move
 */
;(() => {
	let mouseDown = false;
	let mouseMove = false;
	let clipboard = [];
	let pasted = false;

	const condition = () => Tool.active === 'move';

	Editor.addEventListener('mousedown', (e) => {
		if (!condition() && Tool.active !== 'edit')
			return;

		if (e.button === 0) {
			mouseDown = true;
			mouseMove = false;
		}

		if (pasted)
			return;

		const { classList } = e.target;

		if (!e.ctrlKey && !classList.contains('select'))
			unselectAll(e);

		if (Tool.active === 'edit' && e.target instanceof SVGPolygonElement)
			return;

		if (e.target !== Editor) {
			if (!e.ctrlKey)
				classList.add('select');
			else
				classList.toggle('select');

			// if (classList.contains('select'))
			// 	e.target.parentElement.appendChild(e.target);
		}
	});

	document.addEventListener('mousemove', (e) => {
		if ((!condition() && Tool.active !== 'edit') || (!mouseDown && !pasted))
			return;

		mouseMove = true;

		Editor.querySelectorAll('.select').forEach(el => {
			if (el.points) {
				el.points.forEach(p => (p.x += e.movementX) & (p.y += e.movementY));
			} else if (el.x) {
				el.x.baseVal.value += e.movementX;
				el.y.baseVal.value += e.movementY;
			} else if (el.cx) {
				el.cx.baseVal.value += e.movementX;
				el.cy.baseVal.value += e.movementY;
				if (el.point) {
					for (let i = 0; i < myHouse.floors[myHouse.n].picture.points.length; i++){
						if (myHouse.floors[myHouse.n].picture.points[i].x == el.point.x && myHouse.floors[myHouse.n].picture.points[i].y == el.point.y){
							myHouse.floors[myHouse.n].move(i);
						}
					}
					el.point.x += e.movementX;
					el.point.y += e.movementY;
					myHouse.floors[myHouse.n].buildByPicture()
				}
			}
		});
	});

	document.addEventListener('mouseup', (e) => {
		if (!mouseDown)
			return;

		if (pasted)
			historySystemAdd('Paste', '<i class="far fa-clone"></i>');
		else if (mouseMove && Tool.active !== 'edit')
			historySystemAdd('Move', '<i class="fas fa-arrows-alt"></i>');

		pasted = false;
		mouseDown = false;
	});

	function deleteElements() {
		const selected = Editor.querySelectorAll('.select');
		if (confirm(`Delete ${selected.length} element${selected.length > 1 ? 's' : ''}?`))
			selected.forEach(el => el.remove());

		historySystemAdd('Delete', '<i class="far fa-trash-alt"></i>');
	}

	function selectAll() {
		if (condition())
			Editor.querySelectorAll('*').forEach(el => el.classList.add('select'));
		else if (Tool.active === 'edit')
			Editor.querySelectorAll('.angle').forEach(el => el.classList.add('select'));
		
	}

	function unselectAll() {
		Editor.querySelectorAll('.select').forEach(el => {
			if (pasted)
				el.remove();
			else
				el.classList.remove('select');
		});

		pasted = false;
	}

	function copy() {
		clipboard.length = 0;

		Editor.querySelectorAll('.select').forEach(el => clipboard.push(el.cloneNode()));
	}

	function paste() {
		unselectAll();
		clipboard.forEach(el => Editor.appendChild(el.cloneNode()));
		pasted = true;
	}

	function cut() {
		clipboard.length = 0;

		Editor.querySelectorAll('.select').forEach(el => {
			clipboard.push(el.cloneNode());
			el.remove();
		});
	}

	function duplicate() {
		copy();
		paste();
	}

	function editElement(el) {
		myHouse.floors[myHouse.n].circles = []
		for (let i = 0; i < el.points.numberOfItems; i++) {
			const circle = Editor.appendChild(createSVGElement('circle'));

			let { x, y } = circle.point = el.points[i];

			circle.set('cx', x);
			circle.set('cy', y);
			circle.set('r', 20);
			circle.classList.add('angle');
			myHouse.floors[myHouse.n].circles.push(circle)
		}

		el.classList.remove('select');
		el.classList.add('edit');
	}

	function editElements() {
		Tool.active = 'edit';
		Tools.querySelector(`button[data-tool-type="move"]`).classList.add('active');

		Editor.querySelectorAll('polygon.select').forEach(editElement);
	}

	function exitEdit() {
		Editor.querySelectorAll('circle.angle').forEach(el => el.remove());
		Editor.querySelectorAll('polygon.edit').forEach(el => el.classList.remove('edit'));
		historySystemAdd('Edit', '<i class="fas fa-pen"></i>');
	}

	KB.bind(['Delete', 'Backspace'], deleteElements, condition);
	KB.bind(['Ctrl+KeyA', 'Cmd+KeyA'], selectAll);
	KB.bind('Escape', unselectAll, condition);
	KB.bind('Escape', () => {
		exitEdit();
		Tool.active = 'move';
	});
	KB.bind(['Ctrl+KeyC', 'Cmd+KeyC'], copy, condition);
	KB.bind(['Ctrl+KeyV', 'Cmd+KeyV'], paste, condition);
	KB.bind(['Ctrl+KeyX', 'Cmd+KeyX'], cut, condition);
	KB.bind(['Ctrl+KeyD', 'Cmd+KeyD'], duplicate, condition);
	KB.bind(['Ctrl+KeyE', 'Cmd+KeyE'], editElements, condition);

	Tool.on('change', exitEdit);

	Editor.editElement = editElement;
})();



/*
 * polygon
 */
;(() => {
	let currentPolyline;

	const condition = () => Tool.active === 'polygon';

	Editor.addEventListener('mousemove', (e) => {
		if (!condition() || !currentPolyline)
			return;

		Object.assign(currentPolyline.points.getItem(currentPolyline.points.numberOfItems - 1), { x: e.layerX, y: e.layerY });
	});

	Editor.addEventListener('click', (e) => {
		if (!condition())
			return;

		if (!currentPolyline) {
			currentPolyline = Editor.appendChild(createSVGElement('polyline'));
			currentPolyline.points.appendItem(Object.assign(Editor.createSVGPoint(), { x: e.layerX, y: e.layerY }));
		}
		
		currentPolyline.points.appendItem(Object.assign(Editor.createSVGPoint(), { x: e.layerX, y: e.layerY }));
	});

	function stopDrawing() {
		if (!currentPolyline)
			return;

		currentPolyline.remove();
		currentPolyline = null;
	}

	function completePolygonCreation() {
		if (!currentPolyline)
			return;

		currentPolyline.points.removeItem(currentPolyline.points.numberOfItems - 1);
		if (currentPolyline.points.numberOfItems > 2) {
			const polygon = Editor.appendChild(createSVGElement('polygon'));
			polygon.setAttribute('serialize', '');
			currentPolyline.points.forEach(p => polygon.points.appendItem(p));
		}

		stopDrawing();
		historySystemAdd('Polygon', '<i class="fas fa-draw-polygon"></i>');
	}

	function removeLastPoint() {
		if (!currentPolyline)
			return;

		currentPolyline.points.removeItem(currentPolyline.points.numberOfItems - 2);
		if (currentPolyline.points.numberOfItems < 2)
			stopDrawing();
	}

	KB.bind([ 'Enter', 'NumpadEnter' ], completePolygonCreation, condition);
	KB.bind([ 'Delete','Backspace' ], removeLastPoint, condition);
	KB.bind('Escape', stopDrawing, condition);

	Tool.on('change', stopDrawing);
})();



/*
 * cut
 */
;(() => {
	let currentPolyline;

	const condition = () => Tool.active === 'cut';

	Editor.addEventListener('mousemove', (e) => {
		if (!condition() || !currentPolyline)
			return;

		Object.assign(currentPolyline.points.getItem(currentPolyline.points.numberOfItems -1), { x: e.layerX, y: e.layerY });

		e.preventDefault();
	});


	Editor.addEventListener('click', (e) => {
		if (!condition())
			return;

		if (!currentPolyline) {
			currentPolyline = Editor.appendChild(createSVGElement('polyline'));
			currentPolyline.classList.add('cut');
			currentPolyline.points.appendItem(Object.assign(Editor.createSVGPoint(), { x: e.layerX, y: e.layerY }));
		}
		
		currentPolyline.points.appendItem(Object.assign(Editor.createSVGPoint(), { x: e.layerX, y: e.layerY }));

		e.preventDefault();
	});

	function checkIntersection({ x: x1, y: y1 }, { x: x2, y: y2 }, { x: x3, y: y3 }, { x: x4, y: y4 }) {
		let t1 = x1 * y2 - y1 * x2;
		let t2 = x3 * y4 - y3 * x4;
		let t3 = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

		let x = (t1 * (x3 - x4) - (x1 - x2) * t2) / t3;
		let y = (t1 * (y3 - y4) - (y1 - y2) * t2) / t3;

		let k1 = (x - x1) / (x2 - x1);
		// let k2 = (y - y1) / (y2 - y1);
		let k3 = (x - x3) / (x4 - x3);
		// let k4 = (y - y3) / (y4 - y3);
		if (k1 <= 1 && k1 >= 0 && k3 <= 1 && k3 >= 0)
			return Object.assign(Editor.createSVGPoint(), { x, y });
	}

	function cp({ x, y }, name, color = 'white') {
		const circle = Editor.appendChild(createSVGElement('circle'));
		circle.set('cx', x);
		circle.set('cy', y);
		circle.set('r', 4);
		circle.set('fill', color);

		const text = Editor.appendChild(createSVGElement('text'));
		text.innerHTML = name;
		// text.innerHTML = `${name ? `${name} ` : ''}(x: ${x.toFixed(1)}, y: ${y.toFixed(1)})`;
		text.set('x', x + 5);
		text.set('y', y + 16);
		text.set('fill', color);
		text.set('font-size', '12px');
	} // debugger

	function cutPolygon(polygon, path, from, to) {
		function rcolor(min = 0, max = 255) {
			const r = Math.floor(Math.random() * (max - min) + min);
			const g = Math.floor(Math.random() * (max - min) + min);
			const b = Math.floor(Math.random() * (max - min) + min);

			return `rgba(${r}, ${g}, ${b}, 0.3)`;
		} // debugger

		const points = polygon.points.toArray();

		// points.forEach((p, i) => cp(p, i, 'red')); // debugger

		polygon.points.clear();
		const newPolygon = polygon.parentElement.appendChild(polygon.cloneNode());

		// polygon
		// polygon.style.fill = rcolor(); // debugger

		path.forEach(p => polygon.points.appendItem(p));

		for (let i = from; i++ !== to;) {
			if (i >= points.length)
				i = 0;
			polygon.points.appendItem(points[i]);
		}

		// newPolygon
		// newPolygon.style.fill = rcolor(); // debugger

		path.forEach(p => newPolygon.points.appendItem(p));

		for (let i = from; i !== to; i--) {
			newPolygon.points.appendItem(points[i]);
			if (i < 1)
				i = points.length;
		}

		return newPolygon;
	}

	function identifyIntersections(polyline) {
		const { parentElement } = polyline;

		const cPoints = polyline.points.toArray();

		let polygons = parentElement.querySelectorAll('polygon.select');
		if (!polygons.length)
			polygons = parentElement.querySelectorAll('polygon');

		polygons = Array.from(polygons);

		for (var pi = 0; pi < polygons.length; pi++) {
			const polygon = polygons[pi];
			const pPoints = polygon.points.toArray();
			const intersections = [];

			for (let cpi = polygon.cpi || 1; cpi < cPoints.length; cpi++) {
				const c1 = cPoints[cpi - 1];
				const c2 = cPoints[cpi];

				for (let ppi = 0; ppi < pPoints.length; ppi++) {
					const p1 = pPoints[ppi];
					const p2 = pPoints[ppi + 1] || pPoints[0];

					const inter = checkIntersection(c1, c2, p1, p2);
					if (inter) {
						intersections.push({
							i: inter,
							c: c2,
							p: p1,
						});
						// cp(inter, `${cpi - 1} - ${cpi}`);
						if (intersections.length === 2) {
							const [ a, b ] = intersections;
							intersections.length = 0;

							const path = [ a.i ];
							const to = cPoints.indexOf(b.c);
							for (let from = cPoints.indexOf(a.c); from < to; from++)
								path.push(cPoints[from]);
							path.push(b.i);

							// path.forEach((p, i) => cp(p, i, 'lime')); // debugger

							const newPolygon = cutPolygon(polygon, path, pPoints.indexOf(b.p), pPoints.indexOf(a.p));

							polygon.cpi = newPolygon.cpi = cpi + 1;
							polygons.push(polygon, newPolygon);

							cpi = cPoints.length;
							break;
						}
					}
				}
			}
		}

		polygons.forEach(el => el.cpi = null);
	}

	function applyCutLine() {
		if (!currentPolyline)
			return;

		currentPolyline.points.removeItem(currentPolyline.points.numberOfItems - 1);

		if (currentPolyline.points.numberOfItems > 1){
			console.log("cut")
			const { parentElement } = currentPolyline;
			let polygons = parentElement.querySelectorAll('polygon.select');
			if (!polygons.length)
				polygons = parentElement.querySelectorAll('polygon');
			for (let t = 0; t < polygons.length; t++){
				let polygonSVG = polygons[t].points.toArray();
				let res = cutWithKnife(polygonSVG,currentPolyline.points, 10)
				console.log(res)
				let p=[]
				for (var i = 0; i < res[0].length; i++){
					p.push(res[0][i].x);
					p.push(res[0][i].y);
				}
				polygons[t].set('points', p.join(' '));
				for (let i = 1; i < res.length; i++) {
					showFromPoints2(res[i])
				}
			}
			// identifyIntersections(currentPolyline);
		}

		stopDrawing();

		historySystemAdd('Cut', '<i class="fas fa-cut"></i>');		
	}

	function removeLastPoint() {
		if (!currentPolyline)
			return;

		currentPolyline.points.removeItem(currentPolyline.points.numberOfItems - 2);
		if (currentPolyline.points.numberOfItems < 2)
			stopDrawing();
	}

	function stopDrawing() {
		if (!currentPolyline)
			return;

		currentPolyline.remove();
		currentPolyline = null;
	}

	KB.bind([ 'Enter', 'NumpadEnter' ], applyCutLine, condition);
	KB.bind([ 'Delete', 'Backspace' ], removeLastPoint, condition);
	KB.bind('Escape', stopDrawing, condition);

	Tool.on('change', stopDrawing);
})();





function serialize() {
	const svg = createSVGElement('svg');
	Editor.querySelectorAll('[serialize]').forEach(el => svg.innerHTML += el.outerHTML);
	svg.querySelectorAll('*').forEach(el => {
		el.removeAttribute('class');
		el.removeAttribute('serialize');
	});

	return svg.innerHTML;
}

const SevingProgress = document.querySelector('.SevingProgress');
SevingProgress.set = function(text) {
	this.innerText = text;
	SevingProgress.classList.remove('hide');

	clearTimeout(this._timer);
	this._timer = setTimeout(() => this.classList.add('hide'), 2000);
}

function save() {
	SevingProgress.set('Saving...');

	localStorage.setItem('awd', serialize());

	SevingProgress.set('Saving successfully!');
}

KB.bind(['KeyW'], initiate);

KB.bind(['KeyQ'], logFlor);

KB.bind(['KeyA'], AddFloor);

KB.bind(['KeyE'], buildWalls);

KB.bind(['ArrowDown'], Down);

KB.bind(['ArrowUp'], Up);

KB.bind(['ArrowRight'], Right);

KB.bind(['ArrowLeft'], Left);

KB.bind(['KeyF'], Forward);

KB.bind(['KeyB'], Back);

KB.bind(['Ctrl+KeyS', 'Cmd+KeyS'], () => {
	save();
});

KB.bind(['Ctrl+KeyZ', 'Cmd+KeyZ'], () => {
	Editor.innerHTML = historySystem.undo().data;
});

KB.bind(['Ctrl+Shift+KeyZ', 'Ctrl+KeyU', 'Cmd+Shift+KeyZ', 'Cmd+KeyU'], () => {
	Editor.innerHTML = historySystem.redo().data;
});

let g_polygon = [ 399.821, 153.151, 510.785, 153.151, 510.785, 171.792, 548.068, 173.568, 548.956, 153.151, 928.894, 152.263, 929.782, 240.146, 903.151, 248.135, 904.926, 342.232, 872.081, 348.446, 874.744, 445.206, 845.45, 453.195, 845.45, 547.292, 815.268, 558.832, 813.493, 645.828, 784.198, 660.031, 787.749, 755.016, 754.904, 764.78, 755.792, 850.888, 642.165, 886.396, 642.165, 974.279, 532.09, 1000.02, 532.977, 858.877, 564.935, 850.888, 565.822, 723.946, 591.566, 724.834, 594.229, 691.988, 623.523, 691.988, 620.86, 554.394, 651.042, 546.405, 651.042, 451.843, 680.337, 441.19, 680.337, 322.237, 532.977, 363.96, 529.427, 344.43, 508.122, 343.542, 408.698, 368.398, 400.709, 346.206 ];

function createPolygonFromPoints(points) {
	let ary = [];

	if (points.length > 0 && typeof points[0] === 'object') {
		for (let i = 0; i < points.length; i++) {
			let { x, y } = points[i];
			ary.push(x, y);
		}
	} else {
		ary = points;
	}

	let el = createSVGElement('polygon');
	el.set('points', ary.join(' '));

	return Editor.appendChild(el);
}

window.addEventListener('load', () => {
	SevingProgress.set('Loading...');

	// const tmp = createSVGElement('svg');
	// tmp.innerHTML = localStorage.getItem('awd');

	// while (tmp.firstElementChild) {
	// 	tmp.firstElementChild.setAttribute('serialize', '');
	// 	Editor.appendChild(tmp.firstElementChild);
	// }

	// historySystemAdd('Load', '<i class="fas fa-cloud-download-alt"></i>');

	//createPolygonFromPoints(g_polygon);

	SevingProgress.set('Loading successfully!');
});
