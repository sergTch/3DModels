let camera, scene, renderer, house;
const KB = new Keybinder();
KB.bind(['Escape'], ShowHouse)
KB.bind(['KeyS'], Down);
KB.bind(['KeyW'], Up);
KB.bind(['KeyD'], Right);
KB.bind(['KeyA'], Left);
KB.bind(['KeyH'], Higher);
KB.bind(['KeyL'], Lower);
KB.bind(['KeyQ'], RotateL);
KB.bind(['KeyE'], RotateR);
KB.bind(['KeyX'], Bigger);
KB.bind(['KeyC'], Smaller);
KB.bind(['KeyZ'], LogAll);
function Up(){scene.position.z -= 1;}
function Down(){scene.position.z += 1;}
function Right(){scene.position.x += 1;}
function Left(){scene.position.x -= 1;}
function Higher(){scene.scale.z *= 1/0.99;}
function Lower(){scene.scale.z *= 0.99;}
function Bigger(){scene.scale.x *= 1/0.99;scene.scale.y *= 1/0.99;scene.scale.z *= 1/0.99;}
function Smaller(){scene.scale.x *= 0.99;scene.scale.y *= 0.99;scene.scale.z *= 0.99;}
function Lower(){scene.scale.z *= 0.99;}
function RotateL(){scene.rotation.z += Math.PI / 90}
function RotateR(){scene.rotation.z -= Math.PI / 90}
function LogAll() {console.log(house); console.log(scene)}
function ShowHouse() {house.show()}

mapboxgl.accessToken = 'pk.eyJ1Ijoic2VyZ2V5NTc2IiwiYSI6ImNranU0dHdjYTAzZTcyeW1zdmtoZXVnaXIifQ.5P3gsgT5INtsgEhQGv8mcw';
var map = (window.map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v10',
    zoom: 18,
    center: [148.9819, -35.3981],
    pitch: 60,
    antialias: true // create the gl context with MSAA antialiasing, so custom layers are antialiased
}));
 
// parameters to ensure the model is georeferenced correctly on the map
var modelOrigin = [148.9819, -35.39847];
var modelAltitude = 0;
var modelRotate = [Math.PI / 2, 0, 0];
 
var modelAsMercatorCoordinate = mapboxgl.MercatorCoordinate.fromLngLat(
    modelOrigin,
    modelAltitude
);
 
// transformation parameters to position, rotate and scale the 3D model onto the map
var modelTransform = {
    translateX: modelAsMercatorCoordinate.x,
    translateY: modelAsMercatorCoordinate.y,
    translateZ: modelAsMercatorCoordinate.z,
    rotateX: modelRotate[0],
    rotateY: modelRotate[1],
    rotateZ: modelRotate[2],
    /* Since our 3D model is in real world meters, a scale transform needs to be
    * applied since the CustomLayerInterface expects units in MercatorCoordinates.
    */
    scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits()
};
 
var THREE = window.THREE;
 
// configuration of the custom layer for a 3D model per the CustomLayerInterface
var customLayer = {
    id: '3d-model',
    type: 'custom',
    renderingMode: '3d',
    onAdd: function (map, gl) {
        this.camera = new THREE.Camera();
        this.scene = new THREE.Scene();
        
        // create two three.js lights to illuminate the model
        var directionalLight = new THREE.DirectionalLight(0xffffff);
        directionalLight.position.set(0, -70, 100).normalize();
        this.scene.add(directionalLight);
        
        var directionalLight2 = new THREE.DirectionalLight(0xffffff);
        directionalLight2.position.set(0, 70, 100).normalize();
        
        this.scene.add(directionalLight2);
        this.scene.add(createScene())
        camera = this.camera
        raycaster = this.raycaster
        console.log(this)
        this.map = map;
        
        // use the Mapbox GL JS map canvas for three.js
        this.renderer = new THREE.WebGLRenderer({
            canvas: map.getCanvas(),
            context: gl,
            antialias: true
        });
        
        this.renderer.autoClear = false;
    },

    render: function (gl, matrix) {
            var rotationX = new THREE.Matrix4().makeRotationAxis(
            new THREE.Vector3(1, 0, 0),
            modelTransform.rotateX
        );
        var rotationY = new THREE.Matrix4().makeRotationAxis(
            new THREE.Vector3(0, 1, 0),
            modelTransform.rotateY
        );
        var rotationZ = new THREE.Matrix4().makeRotationAxis(
            new THREE.Vector3(0, 0, 1),
            modelTransform.rotateZ
        );
        
        var m = new THREE.Matrix4().fromArray(matrix);
        var l = new THREE.Matrix4()
            .makeTranslation(
            modelTransform.translateX,
            modelTransform.translateY,
            modelTransform.translateZ
        )
        .scale(
            new THREE.Vector3(
                modelTransform.scale,
                -modelTransform.scale,
                modelTransform.scale
            )
        )
        .multiply(rotationX)
        .multiply(rotationY)
        .multiply(rotationZ);
        
        this.camera.projectionMatrix = m.multiply(l);
        this.renderer.state.reset();
        this.renderer.render(this.scene, this.camera);
        this.map.triggerRepaint();
    }
};
 
map.on('style.load', function () {
    map.addLayer(customLayer, 'waterway-label');
});

map.on('click', function(e) {
    onClick(e)
});

function onClick( event ) {
    event.preventDefault();
    //I had to change the changedTouches to point to adapt
    //  to the incoming event object as for me there was no such property
    var mouse = new THREE.Vector2( Infinity, Infinity );
    mouse.x = ( event.point.x / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.point.y / window.innerHeight ) * 2 + 1;

    const camInverseProjection = 
        new THREE.Matrix4().getInverse(camera.projectionMatrix);
    const cameraPosition =
        new THREE.Vector3().applyMatrix4(camInverseProjection);
    const mousePosition =
        new THREE.Vector3(mouse.x, mouse.y, 1)
        .applyMatrix4(camInverseProjection);
    const viewDirection = mousePosition.clone()
        .sub(cameraPosition).normalize();

    var raycaster = new THREE.Raycaster();
    raycaster.set(cameraPosition, viewDirection);

    let mindist = 1000000, f = 0, r = 0, int, room
    for (let i = 0; i < house.visible; i++){
        for (let j = 0; j < house.floors[i].length; j++){
            var intersects = raycaster.intersectObjects( [house.floors[i][j].mesh], true );
            if (intersects.length > 0){
                if (intersects[0].distance < mindist){
                    mindist = intersects[0].distance
                    f = i
                    r = j
                    int = intersects[0]
                    room = house.floors[i][j]
                }
            }
        }
    }
    if (mindist == 1000000){
        ShowHouse()
        return
    }
    console.log("floor: ", f + 1);
    console.log("room: ", r)
    house.hideTop(f+1)
    house.filter(function 
        (x) {
            if (room == x) 
                return new THREE.Color(0x00FF00)
            return new THREE.Color(0x777777)
    })
    //alert("You chose room " + r.toString() + " on floor " + (f+1).toString())
}