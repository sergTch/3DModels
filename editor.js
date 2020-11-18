var myFloor;
var myImage;
var myHouse;
var myPlan;
var myRoomsPlans;
var eps = 0.0000001
function len2(a)    { return Math.sqrt(a.x*a.x + a.y*a.y);}
function len3(a)    { return Math.sqrt(a.x*a.x + a.y*a.y + a.z*a.z);}
function add2(a,b)  { return new point2(a.x+b.x,a.y+b.y);}
function add3(a,b)  { return new point3(a.x+b.x,a.y+b.y,a.z+b.z);}
function sub2(a,b)  { return new point2(a.x-b.x,a.y-b.y);}
function sub3(a,b)  { return new point3(a.x-b.x,a.y-b.y,a.z-b.z);}
function dot2(a,b)  { return a.x*b.x+a.y*b.y}
function dot3(a,b)  { return a.x*b.x+a.y*b.y+a.z*b.z}
function copy2(a) { return new point2(a.x, a.y)}
function copy3(a) { return new point3(a.x, a.y, a.z)}
function smul2(a,k) { return new point2(a.x*k, a.y*k)}
function smul3(a,k) { return new point3(a.x*k, a.y*k, a.z*k)}
function mult2(a,b) { return a.x*b.y-a.y*b.x}
function mult3(a,b) { return a.y*b.z-a.z*b.y+a.z*b.x-a.x*b.z+a.x*b.y-a.y*b.x}
function cos(a,b)   { return dot2(a,b)/len2(a)/len2(b)}
function sin(a,b)   { return mult2(a,b)/len2(a)/len2(b)}

function replace(arr, newArr, i) {
    a = []
    for (let t = 0; t < i && t < arr.length; t++)
        a.push(arr[t])
    for (let t = 0; t < newArr.length; t++)
        a.push(newArr[t])
        for (let t = i+1; t < arr.length; t++)
            a.push(arr[t])
    return a
}

function setLen(p,r) {
    var t = Math.sqrt(p.x*p.x + p.y * p.y + p.z * p.z);
    p.x = p.x/t*r;
    p.y = p.y/t*r;
    p.z = p.z/t*r;
}
class point3{
    constructor(x,y,z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    len() {
        return len3(this)
        // return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z)
    }
}
class point2{
    constructor(x,y) {
        this.x = x;
        this.y = y;
    }
    eq(p) {
        //console.log(Math.abs(p.x - this.x) < eps && Math.abs(p.y - this.y) < eps)
        return Math.abs(p.x - this.x) < eps && Math.abs(p.y - this.y) < eps
    }
    len() {
        return len2(this)
        // return Math.sqrt(this.x*this.x + this.y*this.y)
    }
}
class verticalImage {
    constructor(angle, camera, target, height, width) {
        var diff = sub3(target,camera);
        this.height = height;
        this.width = width;
        setLen(diff, Math.max(this.height, this.width)/2/Math.tan(angle*Math.PI/360));
        this.dist = len2(diff);
        this.pos = new point3(-this.width/2, this.height/2 + diff.z, this.dist);
    }
    projection(p){
        var t = this.dist/p.z;
        return new point2(p.x * t - this.pos.x, -(p.y * t - this.pos.y))
    }
    worldPos(p){
        return new point3(this.pos.x+p.x, this.pos.y-p.y, this.dist)
    }
}
class image {
    constructor(angle, camera, target, height, width, shift) {
        var diff = sub3(target,camera);
        this.height = height;
        this.width = width;
        this.dist = Math.max(this.height, this.width)/2/Math.tan(angle*Math.PI/360);
        setLen(diff, this.dist);
        this.dir = new point3(1, len2(diff)/this.dist, -diff.z/this.dist)
        this.pos = new point3(-this.width/2, diff.z + (1+2*shift*width/height) * this.height/2 * this.dir.y, len2(diff) + (1+2*shift*width/height) * this.height/2 * this.dir.z);
    }
    projection(p){
        let y = (p.y*this.pos.z - p.z*this.pos.y) / (p.y*this.dir.z - p.z*this.dir.y)
        let x = p.x/p.y*(this.pos.y-y*this.dir.y) - this.pos.x
        return new point2(x, y)
    }
    worldPos(p){
        return new point3(this.pos.x+p.x, this.pos.y-p.y*this.dir.y, this.pos.z-p.y*this.dir.z)
    }
}
class polygon3D {
    constructor(points) {
        this.points = points;
    }
    project(image){
        var p = []
        for (var i = 0; i < this.points.length; i++){
            var projecction = image.projection(this.points[i]);
            p.push(projecction);
        }
        return p
    }
    show(image, polygon){
        let p=[]
        for (var i = 0; i < this.points.length; i++){
            var projecction = image.projection(this.points[i]);
            p.push(projecction.x);
            p.push(projecction.y);
        }
        polygon.set('points', p.join(' '));
    }
    move(v){
        for (let i = 0; i < this.points.length; i++){
            this.points[i].x+=v.x
            this.points[i].y+=v.y
            this.points[i].z+=v.z
        }
    }
};
class wall {
    constructor (placement, id) {
        this.id = id
        this.pictures = []
        this.placement = placement;
        this.pictures.push(placement.project(myImage));
        this.SVGpols = []
        this.minx = 1000000;
        this.miny = 1000000;
        this.maxx = -1000000;
        this.maxy = -1000000;
        this.avarage = 0;
        for (let i = 0; i < this.pictures[0].length; i++){
            this.minx = Math.min(this.minx, this.pictures[0][i].x)
            this.miny = Math.min(this.miny, this.pictures[0][i].y)
            this.maxx = Math.max(this.maxx, this.pictures[0][i].x)
            this.maxy = Math.max(this.maxy, this.pictures[0][i].y)
        }
        for (let i = 0; i < placement.points.length; i++)
            this.avarage += placement.points[i].z
        this.avarage /= placement.points.length

        // let p=[]
        // let arr = this.pictures[0]
        // for (let t = 0; t < arr.length; t++){
        //     p.push(arr[t].x)
        //     p.push(arr[t].y)
        // }
        // createPolygonFromPoints(p)
    }
    overlap(w){
        if (this.avarage - w.avarage < eps)
            return
        for (let t = 0; t < w.pictures.length;t++){
            let newPictures = []
            for (let k = 0; k < this.pictures.length;k++){
                let res = overlap(this.pictures[k], w.pictures[t])
                newPictures=newPictures.concat(res)
            }
            this.pictures=newPictures
        }
    }
    show(){
        for (let i = 0; i < this.pictures.length; i++){
            let p = []
            for (let j = 0; j < this.pictures[i].length; j++){
                p.push(this.pictures[i][j].x)
                p.push(this.pictures[i][j].y)
            }
            console.log(p)
            if (this.SVGpols.length <= i)
                this.SVGpols.push(createPolygonFromPoints(p))
            else this.SVGpols[i].set('points', p.join(' '));
        }
    }
}
class room {
    constructor(points, id) {
        var p=[123,123, 444,123,444,444,123,444];
        this.picture = createPolygonFromPoints(p);
        this.plan = points;
        this.id = id;
        this.placement = new polygon3D([]);
        for (let i = 0; i < points.length; i++){
            this.placement.points.push(new point3(points[i].x, (myImage.pos.y - myImage.height) / 2, points[i].y + myImage.dist));
        }
        this.placement.show(myImage, this.picture);
        this.walls = []
    }
    buildWalls(height){
        console.log("buildWalls room: ", this.id)
        this.picture.set('points', [0,0,1,1,1,0].join(' '));
        let n = this.plan.length
        let h = new point3(0, height,0)
        for (let j = 0; j < n; j++){
            let w = new wall(new polygon3D([copy3(this.placement.points[j]), copy3(this.placement.points[(j+1)%n]), add3(this.placement.points[(j+1)%n], h), add3(this.placement.points[j], h)]),this.id)
            if (w.maxx - w.minx > 10 * eps && w.maxy - w.miny > 10 * eps)
                this.walls.push(w);
        }
    }
    move(v){
        this.placement.move(v)
        this.placement.show(myImage, this.picture)
    }
};
class floor {
    constructor(points, rooms) {
        var p=[123,123, 444,123,444,444,123,444];
        this.circles = []
        this.rooms = []
        this.picture = createPolygonFromPoints(p);
        this.moved = [-1, -1];
        this.plan = points;
        this.placement = new polygon3D([]);
        for (let i = 0; i < rooms.length; i++){
            this.rooms.push(new room(rooms[i], i))
        }
        for (let i = 0; i < points.length; i++){
            this.placement.points.push(new point3(points[i].x, (myImage.pos.y - myImage.height) / 2, points[i].y + myImage.dist));
        }
        this.placement.show(myImage, this.picture);
    }
    buildWalls(height){
        console.log("buildWalls floors")
        for (let i = 0; i < this.rooms.length; i++)
            this.rooms[i].buildWalls(height)
    }
    hide(){
        this.picture.set('points', [0,0,1,1,1,0].join(' '));
        for (let i = 0; i < this.rooms.length; i++)
            this.rooms[i].picture.set('points', [0,0,1,1,1,0].join(' '));
    }
    move(x){
        if (this.moved[0] != x){
            this.moved[1] = this.moved[0];
            this.moved[0] = x;
        }
    }
    buildByPicture(){
        if (this.moved[0] != -1){ 
            if (this.moved[1] == -1){
                this.placement.points[this.moved[0]] = myImage.worldPos(this.picture.points[this.moved[0]]);
            } else {
                this.placement.points[this.moved[0]] = myImage.worldPos(this.picture.points[this.moved[0]]);
                this.placement.points[this.moved[1]] = myImage.worldPos(this.picture.points[this.moved[1]]);
            }
            this.buildByMoved();
        }
    }
    buildByMoved(){
        if (this.moved[0] != -1){ 
            if (this.moved[1] == -1){
                var wrld = this.placement.points[this.moved[0]]
                var shift = new point2(wrld.x-this.plan[this.moved[0]].x,wrld.z-this.plan[this.moved[0]].y);
                var height = wrld.y;
                for (let i = 0; i < this.plan.length; i++){
                    this.placement.points[i] = new point3(this.plan[i].x + shift.x, height,this.plan[i].y + shift.y);
                }
                this.placement.show(myImage, this.picture);
                for (let t = 0; t < this.rooms.length; t++){
                    var room = this.rooms[t]
                    for (let i = 0; i < this.plan.length; i++){
                        room.placement.points[i] = new point3(room.plan[i].x + shift.x, height,room.plan[i].y + shift.y);
                    }
                    room.placement.show(myImage, room.picture);
                }
            } else {
                var center = this.placement.points[this.moved[0]];
                var aim = this.placement.points[this.moved[1]];
                var height = center.y;
                var t = height/aim.y;
                var vecPlan = sub2(this.plan[this.moved[1]], this.plan[this.moved[0]]);
                var vecPlace = sub3(new point3(t*aim.x, height, t*aim.z), center);
                var vec
                var si
                var co
                for (let i = 0; i < this.plan.length; i++){
                    if (i != this.moved[0]){
                        vec = sub2(this.plan[i], this.plan[this.moved[0]])
                        si = sin(vecPlan, vec) * len2(vec)/len2(vecPlan)
                        co = cos(vecPlan, vec) * len2(vec)/len2(vecPlan)
                        this.placement.points[i]=new point3(center.x+vecPlace.x*co-vecPlace.z*si,center.y,center.z+vecPlace.x*si+vecPlace.z*co)
                    }
                }
                this.placement.points[this.moved[0]] = copy3(center);
                this.placement.show(myImage, this.picture);
                for (let t = 0; t < this.rooms.length; t++){
                    var room = this.rooms[t]
                    for (let i = 0; i < room.plan.length; i++){
                        vec = sub2(room.plan[i], this.plan[this.moved[0]])
                        if (len2(vec) > eps){
                            si = sin(vecPlan, vec) * len2(vec)/len2(vecPlan)
                            co = cos(vecPlan, vec) * len2(vec)/len2(vecPlan)
                            room.placement.points[i]=new point3(center.x+vecPlace.x*co-vecPlace.z*si,center.y,center.z+vecPlace.x*si+vecPlace.z*co)
                        } else {
                            room.placement.points[i] = copy3(center);
                        }
                    }
                    room.placement.show(myImage, room.picture);
                }
            }
            for (let i = 0; i < this.circles.length; i++){
				this.circles[i].cx.baseVal.value = this.picture.points[i].x
				this.circles[i].cy.baseVal.value = this.picture.points[i].y
                this.circles[i].point = this.picture.points[i]
            }
        }
    }
    move(v){
        this.placement.move(v)
        this.placement.show(myImage, this.picture)
        
        for (let i = 0; i < this.rooms.length; i++)
            this.rooms[i].move(v)
    }
}
class house{
    constructor(ground) {
        this.floors=[ground]
        this.height=[50]
        this.walls=[]
        this.wallProjections=[]
        this.wallPictures=[]
        this.n = 0
    }
    addFloor(plan, rooms, a, a0, b, b0) {
        this.floors.push(new floor(plan, rooms))
        this.n++
        this.height.push(this.height[this.n-1])
        this.floors[this.n].placement.points[a] = copy3(this.floors[this.n-1].placement.points[a0])
        this.floors[this.n].placement.points[a].y += this.height[this.n-1]
        this.floors[this.n].placement.points[b] = copy3(this.floors[this.n-1].placement.points[b0])
        this.floors[this.n].placement.points[b].y += this.height[this.n-1]
        this.floors[this.n].moved=[a,b]
        this.floors[this.n].buildByMoved()
        this.floors[this.n].placement.show(myImage, this.floors[this.n].picture);
    }
    buildWalls() {
        this.walls=[]
        this.wallProjections=[]
        for (let i = 0; i < this.floors.length; i++){
            this.floors[i].hide();
            if (i < this.floors.length-1 || i < 1)
                this.floors[i].buildWalls(this.height[i])
        }
        let walls = []
        for (let i = 0; i < this.floors.length; i++)
            for (let j = 0; j < this.floors[i].rooms.length; j++)
                for (let k = 0; k < this.floors[i].rooms[j].walls.length; k++)
                    walls.push(this.floors[i].rooms[j].walls[k])
        console.dir(walls)
        for (let i = 0; i < walls.length; i++)
            for (let j = 0; j < walls.length; j++)
                walls[i].overlap(walls[j]);
        console.dir(walls)
        for (let i = 0; i < walls.length; i++){
            walls[i].show();
        }

        // for (let i = 0; i < this.walls.length; i++){
        //     for (let j = 0; j < this.walls.length; j++){
        //         if (j == i)
        //             continue

        //         let a = this.wallProjections[i]
        //         let b = this.wallProjections[j]
        //         let sa = 0
        //         let sb = 0
        //         let ma = 10000000
        //         let mb = 10000000
        //         for (let t = 0; t < this.walls[i].points.length; t++){
        //             ma = Math.min(ma, this.walls[i].points[t].z)
        //             sa += this.walls[i].points[t].z
        //         }
        //         for (let t = 0; t < this.walls[j].points.length; t++){
        //             mb = Math.min(mb, this.walls[j].points[t].z)
        //             sb += this.walls[j].points[t].z
        //         }
        //         sa/=this.walls[i].points.length
        //         sb/=this.walls[j].points.length
        //         if (sa - sb <= eps)
        //             continue

        //         for (let t = 0; t < b.length;t++){
        //             let newA = []
        //             for (let k = 0; k < a.length;k++){
        //                 let res = overlap(a[k],b[t])
        //                 newA=newA.concat(res)
        //             }
        //             a=newA
        //             // this.showWalls()
        //             // return
        //         }
        //         this.wallProjections[i]=a
        //     }
        // }
        this.showWalls()
    }
    showWalls() {
        // for (let i = 0; i < this.wallProjections.length; i++){
        //     for (let j = 0; j < this.wallProjections[i].length; j++){
        //         let p=[]
        //         let arr = this.wallProjections[i][j]
        //         for (let t = 0; t < arr.length; t++){
        //             p.push(arr[t].x)
        //             p.push(arr[t].y)
        //         }
        //         createPolygonFromPoints(p)
        //     }
        // }
        
    }
};

function initiate(){
    // var angle = 96.958;
    // var camera = new point3(121.217,-101.512, 16.297);
    // var target = new point3(66.085,-41.917,7.433);
    var angle = 67.975;
    var shift = -0.08;
    var camera = new point3(-51.872, 87.838, 26.746);
    var target = new point3(-142.255, 14.704, 19.368);
    var height = 2160;
    var width = 3840;
    myImage = new image(angle, camera, target, height, width, shift);
    //myImage = new verticalImage(angle, camera, target, height, width);
    myPlan=[];
    m=1000000
    for (let i = 0; i < g_polygon.length; i+=2){
        if (m > g_polygon[i+1])
            m = g_polygon[i+1]
    }
    for (let i = 0; i < g_polygon.length; i+=2){
        myPlan.push(new point2(-g_polygon[i], g_polygon[i+1]-m));
    }
    myPlan=[new point2(0,0), new point2(0,1000), new point2(1000,1000), new point2(1000,0)]
    myRoomsPlans = []
    for (let i = 0; i < data.floors.placements.length; i++){
        let roomPlan = []
        for (let j = 0; j < data.floors.placements[i].length; j+=2){
            //roomPlan.push(new point2(-data.floors.placements[i][j], data.floors.placements[i][j+1]-m));
            roomPlan.push(new point2(data.floors.placements[i][j], data.floors.placements[i][j+1]));
        }
        console.log(roomPlan)
        myRoomsPlans.push(roomPlan)
    }
    //console.log(rooms)
    myHouse = new house(new floor(myPlan, myRoomsPlans))    
    // for (let i = 0; i < myHouse.floors[myHouse.n].placement.points.length; i++){
    //     myHouse.floors[myHouse.n].placement.points[i].x-=1600;
    //     myHouse.floors[myHouse.n].placement.show(myImage, myHouse.floors[myHouse.n].picture);
    // }
    // for (let i = 0; i < myHouse.floors[myHouse.n].placement.points.length; i++){
    //     myHouse.floors[myHouse.n].placement.points[i].y+=500;
    //     myHouse.floors[myHouse.n].placement.show(myImage, myHouse.floors[myHouse.n].picture);
    // }  
    // myHouse.floors[0].placement.show(myImage, myHouse.floors[0].picture);
    console.log(myHouse)
}

function logFlor(){
    //console.dir(myImage);
    console.dir(myHouse);
    // let a1 = [0,1,4]
    // let a2 = [2,3]
    // a1.splice(2, 0, ...a2);
    // console.log(a1);
    // let a = [new point2(0,0), new point2(2,0), new point2(0,2)]
    // let b = [new point2(1,-1), new point2(1,0), new point2(1,4), new point2(-4,-1)]
    //console.log(intersect(new point2()))
    let a = [new point2(0,100), new point2(300,100), new point2(300,0), new point2(0,0)]
    let b = [new point2(100,300), new point2(0,100), new point2(0,0), new point2(100,200)]
    overlap(a,b)
    // for (let t = 0; t < arr.length; t++){
    //     p.push(arr[t].x)
    //     p.push(arr[t].y)
    // }
    // createPolygonFromPoints(p)
}

function AddFloor(){
    myHouse.addFloor(myPlan, myRoomsPlans,0,0,1,1)
}

function buildWalls(){
    myHouse.buildWalls()
}

function Left() {
    myHouse.floors[myHouse.n].move(new point3(-2,0,0))
}

function Right() {
    myHouse.floors[myHouse.n].move(new point3(2,0,0))
}

function Down() {
    if (myHouse.n > 0)
        myHouse.height[myHouse.n-1]-=2
    if (myHouse.n+1 != myHouse.height.length)
        myHouse.height[myHouse.n]+=2
    else myHouse.height[myHouse.n]-=2
        myHouse.floors[myHouse.n].move(new point3(0,-2,0))
}

function Up() {
    if (myHouse.n > 0)
        myHouse.height[myHouse.n-1]+=2
    if (myHouse.n+1 != myHouse.height.length)
        myHouse.height[myHouse.n]-=2
    else myHouse.height[myHouse.n]+=2
        myHouse.floors[myHouse.n].move(new point3(0,2,0))
}

function Forward() {
    myHouse.floors[myHouse.n].move(new point3(0,0,2))
}

function Back() {
    myHouse.floors[myHouse.n].move(new point3(0,0,-2))
}

let data = {
	height: 100,
	floors: {
		num: 3,
		// placements: [
		// 	[336.0693664550781, 1771.4720458984375, 329.87054443359375, 1761.90234375, 587.2391967773438, 1761.90234375, 587.5280151367188, 1756.4140625, 598.8519897460938, 1755.5400390625, 674.7329711914062, 2065.219970703125, 326.0870056152344, 2151.35009765625, 324.0360107421875, 2089.830078125, 335.2146911621094, 2076.96044921875, 335.64208984375, 1908.1961669921875, 335.6493835449219, 1905.8580322265625, 417.543212890625, 1906.321533203125, 417.8320617675781, 1894.478515625, 335.6849670410156, 1894.478515625, 335.6857604980469, 1894.22119140625],
		// 	[335.6857604980469, 1894.22119140625, 263.873046875, 1895.0562744140625, 264.45074462890625, 1905.4549560546875, 335.6493835449219, 1905.8580322265625, 335.64208984375, 1908.1961669921875, 335.2146911621094, 2076.96044921875, 324.0360107421875, 2089.830078125, 43.06809997558594, 2159.56005859375, 42.33029556274414, 1771.472900390625, 336.0693664550781, 1771.4720458984375],
		// 	[334.8865051269531, 1343.643798828125, 260.1399841308594, 1343.643798828125, 260.8235778808594, 1327.2369384765625, 334.90264892578125, 1327.2369384765625, 335.0524597167969, 1174.9971923828125, 340.0749816894531, 1169.9747314453125, 334.6339111328125, 1166.207763671875, 41.18113708496094, 1167.0111083984375, 42.194580078125, 1700.0869140625, 129.44288635253906, 1699.610107421875, 130.16673278808594, 1599.7210693359375, 334.6351623535156, 1599.050537109375],
		// 	[334.8865051269531, 1343.643798828125, 417.3726806640625, 1343.643798828125, 417.3726806640625, 1327.2369384765625, 334.90264892578125, 1327.2369384765625, 335.0524597167969, 1174.9971923828125, 340.0749816894531, 1169.9747314453125, 595.02587890625, 1175.722412109375, 602.9530029296875, 1183.3499755859375, 678.8350219726562, 1464.3199462890625, 600.9019775390625, 1484.8199462890625, 656.2760009765625, 1683.760009765625, 602.9530029296875, 1700.1600341796875, 587.3877563476562, 1702.5101318359375, 587.6290283203125, 1696.719482421875, 351.4184875488281, 1696.7137451171875, 351.17718505859375, 1598.996337890625, 334.6351623535156, 1599.050537109375],
		// 	[345.0074768066406, 1079.253173828125, 426.2957763671875, 1079.5543212890625, 426.8735046386719, 1062.80078125, 344.986083984375, 1063.3675537109375, 344.9857177734375, 1063.0936279296875, 344.7327880859375, 875.2698364257812, 346.0002746582031, 861.38134765625, 587.803466796875, 861.38134765625, 587.1419067382812, 854.1041259765625, 602.5585327148438, 854.1041259765625, 602.9530029296875, 867.5139770507812, 676.7839965820312, 1164.8900146484375, 602.9530029296875, 1183.3499755859375, 595.02587890625, 1175.722412109375, 340.0749816894531, 1169.9747314453125, 345.11785888671875, 1161.2305908203125],
		// 	[424.1104736328125, 412.1105651855469, 582.2708129882812, 412.1105651855469, 582.7477416992188, 393.5097351074219, 740.6163940429688, 393.9866943359375, 741.5702514648438, 549.947509765625, 756.7598876953125, 611.128173828125, 621.4110107421875, 643.969970703125, 656.2760009765625, 783.4290161132812, 600.9019775390625, 797.7849731445312, 587.1419067382812, 799.8555297851562, 587.803466796875, 796.2169189453125, 424.3961181640625, 795.2245483398438],
		// 	[348.97686767578125, 351.31121826171875, 344.2279357910156, 300.7898864746094, 335.1568298339844, 300.3954772949219, 334.3680419921875, 274.7597351074219, 133.70037841796875, 274.3655090332031, 132.51719665527344, 267.6607666015625, 39.472023010253906, 268.01055908203125, 40.301361083984375, 704.244384765625, 129.99815368652344, 703.92626953125, 130.3289337158203, 697.97216796875, 349.96905517578125, 698.6338500976562],
		// 	[741.0958862304688, 1.493748664855957, 740.6213989257812, 294.751708984375, 610.41552734375, 294.751708984375, 610.8910522460938, 346.7386474609375, 424.06488037109375, 350.9804382324219, 424.1104736328125, 412.1105651855469, 582.2708129882812, 412.1105651855469, 582.7477416992188, 393.5097351074219, 740.6163940429688, 393.9866943359375, 741.5702514648438, 549.947509765625, 756.7598876953125, 611.128173828125, 900.3280029296875, 576.2919921875, 899.4452514648438, 1.3681049346923828],
		// 	[1977.23681640625, 575.5545043945312, 1977.23681640625, 466.646728515625, 1958.142578125, 467.3539123535156, 1959.556884765625, 372.5899658203125, 2116.553955078125, 374.0043640136719, 2116.711181640625, 293.4309387207031, 2118.814697265625, 275.0257568359375, 2370.70947265625, 276.0774841308594, 2379.489990234375, 282.3869934082031, 2378.9599609375, 397.5509948730469, 2382.1201171875, 397.5509948730469, 2382.639892578125, 561.093994140625, 2294.820068359375, 582.6539916992188, 2279.91552734375, 575.5545043945312],
		// 	[741.0958862304688, 1.493748664855957, 740.6213989257812, 294.751708984375, 610.41552734375, 294.751708984375, 610.8910522460938, 346.7386474609375, 424.06488037109375, 350.9804382324219, 348.97686767578125, 351.31121826171875, 344.2279357910156, 300.7898864746094, 335.1568298339844, 300.3954772949219, 334.3680419921875, 274.7597351074219, 133.70037841796875, 274.3655090332031, 132.51719665527344, 267.6607666015625, 39.472023010253906, 268.01055908203125, 38.966400146484375, 2.0508599281311035],
		// 	[1212.06005859375, 563.9869995117188, 1211.0433349609375, 538.4764404296875, 1210.607421875, 75.05279541015625, 1064.8653564453125, 74.18009185791016, 1064.8653564453125, 1.2368508577346802, 899.4452514648438, 1.3681049346923828, 900.3280029296875, 576.2919921875, 918.7860107421875, 637.8179931640625],
		// 	[344.9857177734375, 1063.0936279296875, 270.3147888183594, 1063.3785400390625, 270.3147888183594, 1078.9765625, 345.0074768066406, 1079.253173828125, 345.11785888671875, 1161.2305908203125, 340.0749816894531, 1169.9747314453125, 334.6339111328125, 1166.207763671875, 41.18113708496094, 1167.0111083984375, 40.43002700805664, 771.9236450195312, 129.33657836914062, 771.071533203125, 130.05372619628906, 870.6383056640625, 329.8473205566406, 870.9690551757812, 344.7327880859375, 875.2698364257812],
		// 	[1516.8818359375, 561.3443603515625, 1515.1202392578125, 546.3704833984375, 1516.69775390625, 362.31884765625, 1496.189208984375, 362.8446960449219, 1497.2408447265625, 292.9050598144531, 1516.171875, 293.4309387207031, 1515.6461181640625, 85.71548461914062, 1505.1444091796875, 75.05279541015625, 1397.3651123046875, 74.61644744873047, 1383.40185546875, 89.8888168334961, 1383.4022216796875, 300.21112060546875, 1289.586181640625, 299.7747497558594, 1289.1507568359375, 547.6238403320312, 1283.1949462890625, 582.9615478515625, 1285.8900146484375, 619.3599853515625],
		// 	[1641.5771484375, 530.0260009765625, 1637.64599609375, 516.9222412109375, 1638.69775390625, 296.06024169921875, 1849.568359375, 295.5343933105469, 1854.3011474609375, 291.3274841308594, 1854.8270263671875, 229.80165100097656, 1657.1029052734375, 224.54302978515625, 1655.0028076171875, 0.877963662147522, 1504.7135009765625, 0.9464337825775146, 1505.1444091796875, 75.05279541015625, 1515.6461181640625, 85.71548461914062, 1516.171875, 293.4309387207031, 1533.525390625, 293.4309387207031, 1532.99951171875, 363.3705749511719, 1516.69775390625, 362.31884765625, 1515.1202392578125, 546.3704833984375, 1516.8818359375, 561.3443603515625],
		// 	[1854.8270263671875, 229.80165100097656, 1954.2198486328125, 230.32749938964844, 1964.211181640625, 223.49130249023438, 1977.883544921875, 223.49130249023438, 1976.8319091796875, 296.5860900878906, 2116.711181640625, 293.4309387207031, 2118.814697265625, 275.0257568359375, 2370.70947265625, 276.0774841308594, 2379.489990234375, 282.3869934082031, 2457.320068359375, 263.45599365234375, 2456.7099609375, 0.5127147436141968, 1655.0028076171875, 0.877963662147522, 1657.1029052734375, 224.54302978515625],
		// 	[2294.820068359375, 582.6539916992188, 2279.91552734375, 575.5545043945312, 1977.23681640625, 575.5545043945312, 1978.651123046875, 663.2465209960938, 1958.142578125, 663.2465209960938, 1958.142578125, 800.4420776367188, 2041.5914306640625, 801.8565063476562, 2042.298583984375, 876.11181640625, 2193.637939453125, 876.8189697265625, 2207.4560546875, 886.0309448242188, 2207.449951171875, 883.2969970703125, 2296.1201171875, 860.97802734375],
		// 	[1868.1402587890625, 1175.4771728515625, 1868.7286376953125, 1316.10595703125, 2120.889404296875, 1319.814208984375, 2120.590087890625, 1183.0799560546875, 2208.06005859375, 1161.969970703125, 2207.4560546875, 886.0309448242188, 2193.637939453125, 876.8189697265625, 2042.298583984375, 876.11181640625, 1950.1767578125, 874.8790893554688, 1958.378173828125, 1003.790771484375, 1960.721923828125, 1040.706298828125, 1865.8668212890625, 1041.7965087890625],
		// 	[1726.8299560546875, 572.6079711914062, 1875.7620849609375, 574.2813720703125, 1876.3475341796875, 295.94891357421875, 1849.568359375, 295.5343933105469, 1638.69775390625, 296.06024169921875, 1637.64599609375, 516.9222412109375, 1641.5771484375, 530.0260009765625, 1726.8299560546875, 508.614013671875],
		// 	[1950.1767578125, 874.8790893554688, 1958.378173828125, 1003.790771484375, 1865.21044921875, 1003.204833984375, 1865.8668212890625, 1041.7965087890625, 1868.1402587890625, 1175.4771728515625, 1654.2646484375, 1176.0631103515625, 1640.68994140625, 1160.7900390625, 1638.6400146484375, 881.8699951171875, 1726.8299560546875, 859.3109741210938, 1944.3172607421875, 866.0896606445312],
		// 	[1689.3782958984375, 1776.1091466490732, 1689.3782958984375, 2015.166748046875, 1608.92138671875, 2015.166748046875, 1609.710205078125, 2075.114990234375, 1396.7362060546875, 2076.692626953125, 1376.4214016405185, 2061.5488522304518, 1378.1800537109375, 2061.1201171875, 1380.22998046875, 1774, 1462.260009765625, 1759.6400146484375, 1483.75634765625, 1776.6619873046875],
		// 	[1548.958740234375, 1474.2598876953125, 1765.463623046875, 1472.611328125, 1772.6328125, 1472.5567626953125, 1773.21875, 1316.69140625, 1868.7286376953125, 1316.10595703125, 1868.1402587890625, 1175.4771728515625, 1654.2646484375, 1176.0631103515625, 1640.68994140625, 1160.7900390625, 1550.449951171875, 1183.3499755859375],
		// 	[1701.7066650390625, 1771.9249267578125, 1944.219970703125, 1784.25, 2032.4000244140625, 1761.68994140625, 2032.530029296875, 1482.8699951171875, 2121.199951171875, 1461.760009765625, 2120.889404296875, 1319.814208984375, 1868.7286376953125, 1316.10595703125, 1773.21875, 1316.69140625, 1772.6328125, 1472.5567626953125, 1765.463623046875, 1472.611328125, 1763.2593994140625, 1593.84228515625, 1700.5616455078125, 1595.6002197265625]
        // ],
        placements: [
            [0, 0, 0, 500, 500, 500, 500, 0]
        ],
	},
};