var Panorama = (() => {
	const notNull = arg => arg !== undefined || arg !== null;

	const { THREE, Keybinder, EventDispatcher, EasyEvent, animate } = window;

	const { degToRad, clamp } = THREE.MathUtils;

	const PANORAMA_DIAMETER = 500;
	const MIN_FOV = 10;
	const MAX_FOV = 140;
	const DEFAULT_DPS = 36;
	const DEFAULT_FOV = 50;

	function onWheel({ deltaY }) {
		this.autorotationActive = false;
		this.zoom(deltaY * 0.05);
	}

	function raycasting(panorama, e) {
		const { raycaster, canvas, camera, spriteScene, userInteracting } = panorama;

		const mouse = new THREE.Vector2();

		const clientX = e.clientX || userInteracting.onMouseDownMouseX;
		const clientY = e.clientY || userInteracting.onMouseDownMouseY;

		mouse.x = (clientX / canvas.clientWidth) * 2 - 1;
		mouse.y = -(clientY / canvas.clientHeight) * 2 + 1;

		raycaster.setFromCamera(mouse, camera);

		return raycaster.intersectObject(spriteScene, true);
	}

	function onPoinerDown(e) {
		if (e.button !== 0 && e.type !== 'touchstart')
			return;

		this.autorotationActive = false;

		const { userInteracting } = this;

		userInteracting.mouseDown = true;

		userInteracting.onMouseDownMouseX = e.clientX || e.touches[0].clientX;
		userInteracting.onMouseDownMouseY = e.clientY || e.touches[0].clientY;

		userInteracting.onMouseDownLon = userInteracting.lon;
		userInteracting.onMouseDownLat = userInteracting.lat;

		e.preventDefault();
	}

	function onPointerMove(e) {
		if ((e.buttons === 1 || e.type === 'touchmove') && this.userInteracting.mouseDown) {

			const { userInteracting } = this;
			const { onMouseDownMouseX, onMouseDownMouseY, onMouseDownLon, onMouseDownLat } = userInteracting;

			const clientX = e.clientX || e.touches[0].clientX;
			const clientY = e.clientY || e.touches[0].clientY;

			userInteracting.lon = (onMouseDownMouseX - clientX) * 0.075 + onMouseDownLon;
			userInteracting.lat = (clientY - onMouseDownMouseY) * 0.075 + onMouseDownLat;

			if (e.type !== 'touchmove')
				e.preventDefault();
		} else {
			this.canvas.style.cursor = raycasting(this, e)[0] ? this.cursorOnHover : '';
		}
	}

	function onPointerClick(e) {
		const { onMouseDownLon, lon, onMouseDownLat, lat } = this.userInteracting;

		if (onMouseDownLon !== lon || onMouseDownLat !== lat)
			return;

		const intersect = raycasting(this, e)[0];
		if (intersect) {
			const event = new EasyEvent('click', intersect.object, {
				altKey: e.altKey,
				button: e.button,
				buttons: e.buttons,
				clientX: e.clientX,
				clientY: e.clientY,
				ctrlKey: e.ctrlKey,
				layerX: e.layerX,
				layerY: e.layerY,
				metaKey: e.metaKey,
				offsetX: e.offsetX,
				offsetY: e.offsetY,
				pageX: e.pageX,
				pageY: e.pageY,
				screenX: e.screenX,
				screenY: e.screenY,
				shiftKey: e.shiftKey,
				x: e.x,
				y: e.y,
			});
			intersect.object.dispatchEvent(event);
			this.dispatchEvent(event);
		}
	}

	function onPointerUp(e) {
		const { userInteracting, _velocity } = this;

		userInteracting.mouseDown = false;

		const { x, y } = _velocity;

		if (x) {
			animate({
				duration: 500,
				timing: (timeFraction) => 1 - timeFraction,
				draw: (progress) => {
					this._rotateSpeed.x = x * progress;
				},
			});
		}
		if (y) {
			animate({
				duration: 500,
				timing: (timeFraction) => 1 - timeFraction,
				draw: (progress) => {
					this._rotateSpeed.y = y * progress;
				},
			});
		}
	}

	const disabledAutorotateKeys = [
		'ArrowLeft',
		'ArrowRight',
		'ArrowUp',
		'ArrowDown',
		'Equal',
		'Minus',
		'NumpadAdd',
		'NumpadSubtract',
	];

	function Panorama(config, parentElement, listeners = []) {
		EventDispatcher.apply(this);

		listeners.forEach(listener => this.on(listener.type, listener.callback));

		this._rotateSpeed = {
			x: 0,
			y: 0,
		};

		this._velocity = {
			lon: 0,
			lat: 0,
			x: 0,
			y: 0,
		};

		this.cursorOnHover = 'pointer';

		// renderer
		this.renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true, antialias: true });
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.autoClear = false;

		// keybinder
		this.keybinder = new Keybinder();
		const disabledAutorotate = () => this.autorotationActive = false;
		disabledAutorotateKeys.forEach(key => this.keybinder.bind(key, disabledAutorotate));

		// scene
		this.scene = new THREE.Scene();
		this.polygonScene = new THREE.Scene();
		this.spriteScene = new THREE.Scene();

		// camera
		this.camera = new THREE.PerspectiveCamera(0, 1, .1, 3000);
		this.camera.target = new THREE.Vector3(0, 0, 0);

		// sphere
		this.sphere = new THREE.Mesh(new THREE.SphereBufferGeometry(PANORAMA_DIAMETER, 60, 40), new THREE.MeshBasicMaterial({
			side: THREE.BackSide,
		}));

		this.sphere.scale.x = -1;

		this.scene.add(this.sphere);

		// raycaster
		this.raycaster = new THREE.Raycaster();
		this.raycaster.mouse = new THREE.Vector2();
		this.raycaster.point = new THREE.Vector3();

		this.userInteracting = {
			mouseDown: false,
			onMouseDownMouseX: 0,
			onMouseDownMouseY: 0,
			lon: 0,
			onMouseDownLon: 0,
			lat: 0,
			onMouseDownLat: 0,
		};

		Object.defineProperty(this, 'canvas', { get: () => this.renderer.domElement });

		const canvas = this.canvas;

		canvas.addEventListener('mousedown', onPoinerDown.bind(this), false);
		document.addEventListener('mousemove', onPointerMove.bind(this), false);
		document.addEventListener('mouseup', onPointerUp.bind(this), false);
		canvas.addEventListener('mouseup', onPointerClick.bind(this), false);

		canvas.addEventListener('touchstart', onPoinerDown.bind(this), false);
		document.addEventListener('touchmove', onPointerMove.bind(this), false);
		document.addEventListener('touchend', onPointerUp.bind(this), false);
		canvas.addEventListener('touchend', onPointerClick.bind(this), false);

		canvas.addEventListener('wheel', onWheel.bind(this), false);

		let gidx = 0;
		let gidy = 0;

		window.addEventListener('keydown', ({ code }) => {
			if (code === 'ArrowLeft') {
				this._rotateSpeed.x = -this.dps;
				gidx++;
			} else if (code === 'ArrowRight') {
				this._rotateSpeed.x = this.dps;
				gidx++;
			} else if (code === 'ArrowUp') {
				this._rotateSpeed.y = this.dps;
				gidy++;
			} else if (code === 'ArrowDown') {
				this._rotateSpeed.y = -this.dps;
				gidy++;
			}
		});



		window.addEventListener('keyup', ({ code }) => {
			var options = {
				duration: 500,
				timing: (timeFraction) => 1 - timeFraction,
			};

			if (code === 'ArrowLeft' || code === 'ArrowRight') {
				var id = ++gidx;
				options.draw = (progress) => {
					if (gidx === id)
						this._rotateSpeed.x = (code === 'ArrowRight' ? 1 : -1) * this.dps * progress;
				};
			} else if (code === 'ArrowUp' || code === 'ArrowDown') {
				var id = ++gidy;
				options.draw = (progress) => {
					if (gidy === id)
						this._rotateSpeed.y = (code === 'ArrowDown' ? -1 : 1) * this.dps * progress;
				};
			} else {
				return;
			}

			animate(options);
		});

		window.addEventListener('blur', () => {
			this._rotateSpeed.y = 0;
			this._rotateSpeed.x = 0;
		});

		if (config) {
			if ('config' in config)
				config = config.config;
			this.load(config);
		}

		if (parentElement)
			this.setParent(parentElement);

		window.addEventListener('resize', this.resize.bind(this));

		/* Animate */
		;(() => {
			let lastTs = 0;
			const __animate = (ts) => {
					this.update(ts - lastTs);
					lastTs = ts;

					requestAnimationFrame(__animate);
				}
			requestAnimationFrame(__animate);
		})();
	}

	Panorama.prototype = Object.create(EventDispatcher.prototype);
	Object.defineProperties(Panorama.prototype, {
		constructor: {value: Panorama},
		[Symbol.toStringTag]: {value: 'Panorama'},
	});

	Panorama.prototype.resize = function() {
		const { camera, renderer, canvas } = this;
		const { parentElement } = canvas;

		if (parentElement) {
			renderer.setSize(parentElement.clientWidth, parentElement.clientHeight);
			camera.aspect = parentElement.clientWidth / parentElement.clientHeight;
			camera.updateProjectionMatrix();
			this.dispatchEvent('resize');
		}
	}

	Panorama.prototype.setParent = function(newParentElement) {
		newParentElement.appendChild(this.canvas);
		this.dispatchEvent('parentchanged');
		this.resize();
	}

	Panorama.prototype.load = function(config = {}) {
		const { camera, renderer, userInteracting, _velocity, canvas } = this;
		const { parentElement } = canvas;

		this.dispatchEvent('loadstart');

		this.isLoad = false;

		this.fov = notNull(config.fov) ? config.fov : DEFAULT_FOV;
		this.dps = notNull(config.dps) ? config.dps : DEFAULT_DPS;

		this.centerHorizontal = _velocity.lon = userInteracting.lon = notNull(config.centerHorizontal) ? config.centerHorizontal : 0;
		this.centerVertikal = _velocity.lat = userInteracting.lat = notNull(config.centerVertikal) ? config.centerVertikal : 0;

		this.angleLimitActive = notNull(config.angleLimitActive) ? config.angleLimitActive : false;
		this.angleLimit = notNull(config.angleLimit) ? config.angleLimit : 0;

		this.autorotationSide = notNull(config.autorotationSide) ? config.autorotationSide : '';
		this.autorotationDps = notNull(config.autorotationDps) ? config.autorotationDps : DEFAULT_DPS / 3;
		this.autorotationActive = !!this.autorotationSide;

		if (parentElement) {
			renderer.setSize(parentElement.clientWidth, parentElement.clientHeight);
			camera.aspect = parentElement.clientWidth / parentElement.clientHeight;
		}

		camera.fov = clamp(config.fov || DEFAULT_FOV, MIN_FOV, MAX_FOV);
		camera.updateProjectionMatrix();



		if (notNull(config.backgroundImage)) {
			let imageUrls = config.backgroundImage;
			if (!Array.isArray(imageUrls))
				imageUrls = [ imageUrls ];

			const load = ({ target: { resolve, response } }) => {
				response = new Blob([ new Uint8Array(response) ]);

				const texture = new THREE.Texture();
				texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
				texture.minFilter = THREE.LinearFilter;
				texture.needsUpdate = true;
				texture.format = response.type === 'image/jpeg' ? THREE.RGBFormat : THREE.RGBAFormat;

				const img = texture.image = new Image();
				img.onload = () => {
					const material = this.sphere.material;
					material.map = texture;
					material.needsUpdate = true;

					this.isLoad = true;

					this.dispatchEvent('load');

					resolve();
				};
				img.src = URL.createObjectURL(response);
			}

			const loadBackgroundImage = (url, progress) => {
				return new Promise(resolve => {
						const xhr = new XMLHttpRequest();
						xhr.onloadend = load;
						if (progress)
							xhr.onprogress = progress;

						xhr.resolve = resolve;
						xhr.responseType = 'arraybuffer';
						xhr.open('GET', url);
						xhr.send();
				});
			}

			const loadElement = (source) => {
				return new Promise(async resolve => {
					if (typeof source === 'string')
						source = JSON.parse(source);

					let { image, position, scale, userData } = source;

					if (image) {
						const map = await new Promise(resolve => {
							if (/\.svg$/.test(image)) {
								const img = new Image();
								img.onload = () => {
									const canvas = document.createElement('canvas');
									canvas.width = scale.x;
									canvas.height = scale.y;
									const ctx = canvas.getContext('2d');
									ctx.drawImage(img, 0, 0);
									resolve(new THREE.Texture(canvas));
								};
								img.src = image;
							} else {
								new THREE.TextureLoader().load(image, resolve);
							}
						});

						map.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
						map.minFilter = THREE.LinearFilter;
						map.needsUpdate = true;

						const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map }));

						sprite.center.set(0.5, 0.5);
						Object.assign(sprite.scale, scale);
						Object.assign(sprite.position, position);
						Object.assign(sprite.userData, userData);

						this.spriteScene.add(sprite);
					} else {
						return console.warn(`Unacceptable parameter "src": ${image}`);
					}
					resolve();
				});
			}

			;(async () => {
				await loadBackgroundImage(imageUrls[0], ({ loaded, total }) => this.dispatchEvent('progress', { loaded, total }));
				for (let i = 1; i < imageUrls.length; i++)
						await loadBackgroundImage(imageUrls[i]);

				if (notNull(config.children))
					await Promise.all(config.children.map(loadElement));

				this.dispatchEvent('loadend');
			})();
		}
	}

	Panorama.prototype.zoom = function(n) {
		const { camera, fov } = this;
		const newFov = camera.fov + n;

		camera.fov = clamp(newFov, MIN_FOV, clamp(fov, MIN_FOV, MAX_FOV));
		camera.updateProjectionMatrix();
	}

	Panorama.prototype.update = function(ms) {
		const { isLoad, canvas } = this;

		if (!isLoad || !canvas.parentElement)
			return;

		// rotate
		;(() => {
			const { _rotateSpeed, userInteracting } = this;

			const m = ms / 1000;
			userInteracting.lon += m * _rotateSpeed.x;
			userInteracting.lat += m * _rotateSpeed.y;
		})();

		// autorotate
		// var { autorotationActive, autorotationDps, autorotationSide } = this;

		// if (autorotationActive) {
		// 	var autorotationDps = ms / 1000 * autorotationDps;
		// 	lon += autorotationDps * (autorotationSide === 'left' ? -1 : 1);
		// }


		// keyboard rotation
		// var { dps } = this;
		// var { ArrowLeft, ArrowRight, ArrowUp, ArrowDown } = keybinder.keys;
		//
		// var dps = ms / 1000 * dps;
		//
		// if (ArrowLeft ^ ArrowRight)
		// 	lon += dps * (ArrowLeft ? -1 : 1);
		// if (ArrowUp ^ ArrowDown)
		// 	lat += dps * (ArrowUp ? 1 : -1);

		// keyboard zoom
		// var { Equal, Minus, NumpadAdd, NumpadSubtract } = keybinder.keys;
		//
		// var increase = Equal || NumpadAdd;
		// var reduce = Minus || NumpadSubtract;
		//
		// if (increase ^ reduce)
		// 	this.zoom(ms / 20 * (increase ? -1 : 1));

		// angle limit
		// var { angleLimitActive, angleLimit, centerHorizontal, autorotationActive } = this;

		// if (angleLimitActive) {
		// 	angleLimit /= 2;
		// 	if (autorotationActive) {
		// 		if (lon < -angleLimit + centerHorizontal)
		// 			this.autorotationSide = 'right';
		// 		else if (lon > angleLimit + centerHorizontal)
		// 			this.autorotationSide = 'left';
		// 	}
		// 	lon = clamp(lon, -angleLimit + centerHorizontal, angleLimit + centerHorizontal);
		// }

		// if (lon > 180)
		//     lon -= 360;
		// else if (lon < -180)
		//     lon += 360;

		// camera
		;(() => {
			const { userInteracting, camera } = this;
			let { lon, lat } = userInteracting;

			lat = userInteracting.lat = clamp(lat, -85, 85);
			const phi = degToRad(90 - lat);
			const theta = degToRad(lon);

			camera.target.x = PANORAMA_DIAMETER * Math.sin(phi) * Math.cos(theta);
			camera.target.y = PANORAMA_DIAMETER * Math.cos(phi);
			camera.target.z = PANORAMA_DIAMETER * Math.sin(phi) * Math.sin(theta);

			camera.lookAt(camera.target);
		})();

		// render
		;(() => {
			const { renderer, camera, scene, polygonScene, spriteScene } = this;

			renderer.clear();
			renderer.render(scene, camera);
			renderer.clearDepth();
			renderer.render(polygonScene, camera);
			renderer.clearDepth();
			renderer.render(spriteScene, camera);
		})();

		// speedometer
		;(() => {
			const { userInteracting, _velocity } = this;
			const { lon, lat } = userInteracting;
			const { lon: _lon, lat: _lat } = _velocity;

			let x = (lon - _lon) / ms * 1000;
			let y = (lat - _lat) / ms * 1000;

			Object.assign(_velocity, { lon, lat, x, y });
		})();
	}

	return Panorama;
})();
