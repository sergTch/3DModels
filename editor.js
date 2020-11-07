var myFloor;
var myImage;
var myHouse;
var myPlan
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
            p.push(copy2(projecction));
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
};
class room {
    constructor(points) {
        var p=[123,123, 444,123,444,444,123,444];
        this.picture = createPolygonFromPoints(p);
        this.plan = points;
    }
};
class floor {
    constructor(points) {
        var p=[123,123, 444,123,444,444,123,444];
        this.circles = []
        this.picture = createPolygonFromPoints(p);
        this.moved = [-1, -1];
        this.plan = points;
        this.placement = new polygon3D([]);
        for (let i = 0; i < points.length; i++){
            this.placement.points.push(new point3(points[i].x, (myImage.pos.y - myImage.height) / 2, points[i].y + myImage.dist));
        }
    }
    move(x){
        if (this.moved[0] != x){
            this.moved[1] = this.moved[0];
            this.moved[0] = x;
        }
    }
    hide(){
        this.picture.set('points', [0,0,1,1,1,0].join(' '));
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
                this.placement.points[this.moved[0]] = center;
                this.placement.show(myImage, this.picture);
            }
            for (let i = 0; i < this.circles.length; i++){
				this.circles[i].cx.baseVal.value = this.picture.points[i].x
				this.circles[i].cy.baseVal.value = this.picture.points[i].y
                this.circles[i].point = this.picture.points[i]
            }
        }
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
    addFloor(plan, a, a0, b, b0) {
        this.floors.push(new floor(plan))
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
            this.floors[i].hide()
            let n = this.floors[i].plan.length
            let h = new point3(0, this.height[i],0)
            if (i < this.floors.length-1 || i < 1)
            for (let j = 0; j < n; j++){
                this.walls.push(new polygon3D([this.floors[i].placement.points[j], this.floors[i].placement.points[(j+1)%n], add3(this.floors[i].placement.points[(j+1)%n], h), add3(this.floors[i].placement.points[j], h)]))
                this.wallProjections.push([this.walls[this.walls.length-1].project(myImage)])
            }
        }
        for (let i = 0; i < this.walls.length; i++){
            for (let j = 0; j < this.walls.length; j++){
                if (j == i)
                    continue

                let a = this.wallProjections[i]
                let b = this.wallProjections[j]
                let sa = 0
                let sb = 0
                let ma = 10000000
                let mb = 10000000
                for (let t = 0; t < this.walls[i].points.length; t++){
                    ma = Math.min(ma, this.walls[i].points[t].z)
                    sa += this.walls[i].points[t].z
                }
                for (let t = 0; t < this.walls[j].points.length; t++){
                    mb = Math.min(mb, this.walls[j].points[t].z)
                    sb += this.walls[j].points[t].z
                }
                sa/=this.walls[i].points.length
                sb/=this.walls[j].points.length
                if (sa - sb <= eps)
                    continue

                for (let t = 0; t < b.length;t++){
                    let newA = []
                    for (let k = 0; k < a.length;k++){
                        let res = overlap(a[k],b[t])
                        newA=newA.concat(res)
                    }
                    a=newA
                    // this.showWalls()
                    // return
                }
                this.wallProjections[i]=a
            }
        }
        this.showWalls()
    }
    showWalls() {
        for (let i = 0; i < this.wallProjections.length; i++){
            for (let j = 0; j < this.wallProjections[i].length; j++){
                let p=[]
                let arr = this.wallProjections[i][j]
                for (let t = 0; t < arr.length; t++){
                    p.push(arr[t].x)
                    p.push(arr[t].y)
                }
                createPolygonFromPoints(p)
            }
        }
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
    //myPlan=[new point2(0,0), new point2(1000,500), new point2(300,0), new point2(1000,-500)]
    myHouse = new house(new floor(myPlan))    
    // for (let i = 0; i < myHouse.floors[myHouse.n].placement.points.length; i++){
    //     myHouse.floors[myHouse.n].placement.points[i].x-=1600;
    //     myHouse.floors[myHouse.n].placement.show(myImage, myHouse.floors[myHouse.n].picture);
    // }
    // for (let i = 0; i < myHouse.floors[myHouse.n].placement.points.length; i++){
    //     myHouse.floors[myHouse.n].placement.points[i].y+=500;
    //     myHouse.floors[myHouse.n].placement.show(myImage, myHouse.floors[myHouse.n].picture);
    // }  
    myHouse.floors[myHouse.n].placement.show(myImage, myHouse.floors[myHouse.n].picture);
    console.log(myHouse)
}

function logFlor(){
    //console.dir(myImage);
    //console.dir(myHouse);
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
    myHouse.addFloor(myPlan,0,0,1,1)
}

function buildWalls(){
    myHouse.buildWalls()
}

function Left() {
    for (let i = 0; i < myHouse.floors[myHouse.n].placement.points.length; i++){
        myHouse.floors[myHouse.n].placement.points[i].x-=2;
        myHouse.floors[myHouse.n].placement.show(myImage, myHouse.floors[myHouse.n].picture);
    }   
}

function Right() {
    for (let i = 0; i < myHouse.floors[myHouse.n].placement.points.length; i++){
        myHouse.floors[myHouse.n].placement.points[i].x+=2;
        myHouse.floors[myHouse.n].placement.show(myImage, myHouse.floors[myHouse.n].picture);
    }   
}

function Down() {
    if (myHouse.n > 0)
        myHouse.height[myHouse.n-1]-=2
    if (myHouse.n+1 != myHouse.height.length)
        myHouse.height[myHouse.n]+=2
    else myHouse.height[myHouse.n]-=2
    for (let i = 0; i < myHouse.floors[myHouse.n].placement.points.length; i++){
        myHouse.floors[myHouse.n].placement.points[i].y-=2;
        myHouse.floors[myHouse.n].placement.show(myImage, myHouse.floors[myHouse.n].picture);
    }   
}

function Up() {
    if (myHouse.n > 0)
        myHouse.height[myHouse.n-1]+=2
    if (myHouse.n+1 != myHouse.height.length)
        myHouse.height[myHouse.n]-=2
    else myHouse.height[myHouse.n]+=2
    for (let i = 0; i < myHouse.floors[myHouse.n].placement.points.length; i++){
        myHouse.floors[myHouse.n].placement.points[i].y+=2;
        myHouse.floors[myHouse.n].placement.show(myImage, myHouse.floors[myHouse.n].picture);
    }   
}

function Forward() {
    for (let i = 0; i < myHouse.floors[myHouse.n].placement.points.length; i++){
        myHouse.floors[myHouse.n].placement.points[i].z+=2;
        myHouse.floors[myHouse.n].placement.show(myImage, myHouse.floors[myHouse.n].picture);
    }   
}

function Back() {
    for (let i = 0; i < myHouse.floors[myHouse.n].placement.points.length; i++){
        myHouse.floors[myHouse.n].placement.points[i].z-=2;
        myHouse.floors[myHouse.n].placement.show(myImage, myHouse.floors[myHouse.n].picture);
    }   
}