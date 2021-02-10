
class Room{
    constructor(roomData, height, shift, size){
        this.shift = shift
        this.height = height
        const extrudeSettings = {
            steps: 1,
            depth: height * size,
            bevelEnabled: false,
        };
        const shape = new THREE.Shape();
        shape.moveTo( roomData[0] * size, roomData[1] * size );
        for (let j = 2; j < roomData.length;  j += 2){
            shape.lineTo( roomData[j] * size, roomData[j+1] * size );
        }

        const geometry = new THREE.ExtrudeBufferGeometry( shape, extrudeSettings );
        const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
        material.color.g = Math.random()
        this.mesh = new THREE.Mesh( geometry, material ) ;
        var geometryEd = new THREE.EdgesGeometry( this.mesh.geometry ); // or WireframeGeometry
        var materialEd = new THREE.LineBasicMaterial( { color: 0x00ff00, linewidth: 2 } );
        var edges = new THREE.LineSegments( geometryEd, materialEd );
        this.mesh.add( edges );
        this.mesh.position.z += shift*size
    }
    hide(){
        this.mesh.material.transparent = true
        this.mesh.material.opacity = 0
        for (let i = 0; i < this.mesh.children.length; i++){
            this.mesh.children[i].material.transparent = true
            this.mesh.children[i].material.opacity = 0.2
        }
    }
    show(){
        this.mesh.visible = true
        this.mesh.material.transparent = false
        this.mesh.material.opacity = 1
        for (let i = 0; i < this.mesh.children.length; i++){
            this.mesh.children[i].material.transparent = false
            this.mesh.children[i].material.opacity = 1
        }
    }
    center(){
        if (!this.mesh.geometry.boundingBox)
            this.mesh.geometry.computeBoundingBox();
        console.log(this.mesh.geometry.boundingBox)
        var X = 0.5 * ( this.mesh.geometry.boundingBox.max.x - this.mesh.geometry.boundingBox.min.x );
        var Y = 0.5 * ( this.mesh.geometry.boundingBox.max.y - this.mesh.geometry.boundingBox.min.y );
        var Z = 0.5 * ( this.mesh.geometry.boundingBox.max.z - this.mesh.geometry.boundingBox.min.z );

        return new THREE.Vector3(X+this.mesh.position.x, Y+this.mesh.position.y,Z+this.mesh.position.z)
    }
}

class House{
    constructor(){
        this.floors = []
        this.size = 0.05
        let shift = 0
        for (let i = 0; i < data.floors.length; i++){
            this.floors.push([])
            for (let j = 0; j < data.floors[i].length; j++){
                this.floors[i].push(new Room(data.floors[i][j], data.heights[i], shift, this.size))
            }
            shift += data.heights[i]
        }   
        this.visible = this.floors.length
    }

    addToScene() {
        for (let i = 0; i < this.floors.length; i++){
            for (let j = 0; j < this.floors[i].length; j++){
                scene.add(this.floors[i][j].mesh)
            }   
        }
    }
    hideTop(f) {
        for (let i = 0; i < f; i++){
            for (let j = 0; j < data.floors[i].length; j++){
                this.floors[i][j].show()
            }
        }
        for (let i = f; i < this.floors.length; i++){
            for (let j = 0; j < data.floors[i].length; j++){
                //this.floors[i][j].mesh.visible = false
                this.floors[i][j].hide()
            }
        }
        this.visible = f
    }
    show() {
        for (let i = 0; i < this.floors.length; i++){
            for (let j = 0; j < data.floors[i].length; j++){
                this.floors[i][j].show()
            }
        }
        this.visible = this.floors.length
    }
    filter(f) {
        for (let i = 0; i < this.floors.length; i++){
            for (let j = 0; j < data.floors[i].length; j++){
                this.floors[i][j].mesh.material.color = f(this.floors[i][j])
                // if (f(this.floors[i][j]))
                //     this.floors[i][j].mesh.material.color = new THREE.Color(0xFF0000)
                // else this.floors[i][j].mesh.material.color = new THREE.Color(0x777777)
            }
        }
    }
}

function createScene(){
    //let scene;
    scene = new THREE.Scene();
    house = new House();
    console.log(house)
    house.addToScene();
    scene.rotation.x = -Math.PI/2
    //scene.rotation.z = Math.PI
    return scene
}