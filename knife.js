var eps = 0.0001

function showFromPoints2(points){
    p=[]
    for (var j = 0; j < points.length; j++){
        p.push(points[j].x);
        p.push(points[j].y);
    }
    createPolygonFromPoints(p)
}

class line{
    constructor(p, v){
        this.a = v.y
        this.b = -v.x
        this.c = -p.x*v.y + p.y*v.x
    }
    f(p) {
        return this.a*p.x + this.b*p.y + this.c
    }
    dist(p) {
        return Math.abs(a*p.x+b*p.y+c)/Math.sqrt(a*a+b*b)
    }
}

function oneLine(a,b,c){
    let l = new line(a, sub2(b,a))
    return Math.abs(l.f(c)) < eps
}

function onCut(a,b,c, dist = 0){
    let l = new line(a, sub2(b,a))
    dist = dist * Math.sqrt(l.a*l.a + l.b*l.b)
    return Math.abs(l.f(c)) < eps + dist && (c.x-a.x)*(c.x-b.x) < eps + dist && (c.y-a.y)*(c.y-b.y) < eps + dist
}

function intersect(a, b, c, d){
    let v1 = sub2(b,a)
    let v2 = sub2(d,c)
    let l = new line(a, v1)
    if (v2.x * l.a + v2.y * l.b != 0) {
        let t = -l.f(c)/(v2.x * l.a + v2.y * l.b)
        let p = add2(c, smul2(v2, t))
        if ((p.x-a.x)*(p.x-b.x)>eps||
            (p.y-a.y)*(p.y-b.y)>eps||
            (p.x-c.x)*(p.x-d.x)>eps||
            (p.y-c.y)*(p.y-d.y)>eps)
            return null
        return p
    }
    return null
}

function intersectInArr(p1, p2, i1, i2){
    let p12 = p1[(i1 + 1)%p1.length]
    let p22 = p2[(i2 + 1)%p2.length]
    let p = intersect(p1[i1],p12,p2[i2],p22)
    if (p){
        if (p.eq(p1[i1]))
            p1[i1]=p
        if (p.eq(p2[i2]))
            p2[i2]=p
        if (p.eq(p12))
            p1[(i1 + 1)%p1.length]=p
        if (p.eq(p22))
            p2[(i2 + 1)%p2.length]=p
        if (p != p1[i1] && p != p1[(i1 + 1)%p1.length])
            p1.splice(i1+1, 0, p);
        if (p != p2[i2] && p != p2[(i2 + 1)%p2.length])
            p2.splice(i2+1, 0, p);
        return p
    }
    return null
}

function inside(points, p, dist = 0) {
    for (let i = 0; i < points.length; i++){
        if (onCut(points[i], points[(i+1)%points.length], p, dist))
            return 0
    }

    let maxy = p.y
    let t = 0
    for (let i = 0; i < points.length; i++)
        maxy = Math.max(maxy, points[i].y)
    let p2 = new point2(p.x, maxy+1)

    let b = true
    while (b){
        b = false
        for (let i = 0; i < points.length; i++){
            if (oneLine(p, p2, points[i]))
                p2.x+= 1
        }
    }

    t = 0 
    for (let i = 0; i < points.length; i++){
        if (intersect(p, p2, points[i], points[(i+1)%points.length])){
            t+=1
        }
    }
    return (t%2)*2-1
}

function spawnNewP(polygon, knifeP){
    console.log("spawn")
    if (area(polygon) < 100)
        return []
    for (let i = 0; i < polygon.length; i++){
        for (let j = 0; j < knifeP.length; j++){
            if (knifeP[j] == polygon[i]){
                //console.log(knifeP[j])
                if (inside(polygon,smul2(add2(knifeP[j], knifeP[(j+1)%knifeP.length]), 0.5))==1){
                    let t = 1
                    while (t < knifeP.length){
                        for (let k = 0; k < polygon.length; k++){
                            if (polygon[k] == knifeP[(j+t)%knifeP.length]){
                                let p1 = []
                                let p2 = []
                                for (let ind = 0; ind <= t; ind++){
                                    p1.push(knifeP[(j+ind)%knifeP.length])
                                    p2.push(knifeP[(j+ind)%knifeP.length])
                                }
                                for (let ind = k+1; ind%polygon.length != i; ind++)
                                    p1.push(polygon[ind%polygon.length])
                                for (let ind = k-1+polygon.length; ind%polygon.length != i; ind--)
                                    p2.push(polygon[ind%polygon.length])
                                //console.log("continue: ",p1,p2)
                                return spawnNewP(p1, knifeP).concat(spawnNewP(p2, knifeP))
                                return [p1,p2]
                            }
                        }
                        t+=1
                    }
                }
            }
        }
    }
    if (insideP(polygon, knifeP)){
        return []
    }
    else {
        return [polygon]
    }
}

function area(p){
    var s = 0
    for (let i = 0; i < p.length; i++){
        s += (p[i].x - p[(i+1)%p.length].x) * (p[i].y + p[(i+1)%p.length].y)/2
    }
    return Math.abs(s)
}

function insideP(p1, p2){
    for (let i = 0; i < p1.length; i++){
        if (inside(p2, p1[i]) < 0)
            return false
    }
    return true
}

function outsideP(p1, p2){
    for (let i = 0; i < p1.length; i++){
        if (inside(p2, p1[i]) > 0)
            return false
    }
    return true && !insideP(p1,p2)
}

function rebuild(knifeP, polygon){
    for (let i = 0; i < knifeP.length; i++)
        if (knifeP[i].eq(knifeP[(i+1)%knifeP.length])){
            knifeP.splice(i, 1);
            i--
        }
    
    for (let i = 0; i < polygon.length; i++)
        if (polygon[i].eq(polygon[(i+1)%polygon.length])){
            polygon.splice(i, 1);
            i--
        }
    
    for (let i = 0; i < knifeP.length; i++)
        for (let j = 0; j < polygon.length; j++)
            if (knifeP[i].eq(polygon[j], dist = 2))
                knifeP[i] = polygon[j]

    for (let i = 0; i < knifeP.length; i++){
        for (let j = 0; j < polygon.length; j++){
            a = knifeP[i]
            b = knifeP[(i+1)%knifeP.length]
            c = polygon[j]
            d = polygon[(j+1)%polygon.length]
            if (a==c || a == d || b == c || b == d)
                continue
            if (intersectInArr(polygon, knifeP, j, i)){
                i--
                break
            }
        }
    }
}

function overlap(pol, knf){
    let knifeP = knf.slice()
    let polygon = pol.slice()

    // console.log("p1")
    // for (var i = 0; i < knifeP.length; i++)
    //     console.log("new point2(",knifeP[i].x, ",", knifeP[i].y, "), ")
    // console.log("p2")
    // for (var i = 0; i < polygon.length; i++)
    //     console.log("new point2(",polygon[i].x, ",", polygon[i].y, "), ")
    rebuild(knifeP, polygon)
    let res = spawnNewP(polygon, knifeP)
    //console.log("res: ", res)
    return res
}

function ConcatNext(polygon1, polygon2){
    for (let i = 0; i < polygon1.length; i++){
        for (let j = 0; j < polygon2.length; j++){
            if (polygon2[j] == polygon1[i]){
                //console.log(knifeP[j])
                if (inside(polygon1,smul2(add2(polygon2[j], polygon2[(j+1)%polygon2.length]), 0.5))==-1){
                    let t = 1
                    while (t < polygon2.length){
                        for (let k = 0; k < polygon1.length; k++){
                            if (polygon1[k] == polygon2[(j+t)%polygon2.length]){
                                // if ((k == i-1 || k == i+1)&&t == 1)
                                //     break 
                                let p1 = []
                                let p2 = []
                                for (let ind = 0; ind <= t; ind++){
                                    p1.push(polygon2[(j+ind)%polygon2.length])
                                    p2.push(polygon2[(j+ind)%polygon2.length])
                                }
                                for (let ind = k+1; ind%polygon1.length != i; ind++)
                                    p1.push(polygon1[ind%polygon1.length])
                                for (let ind = k-1+polygon1.length; ind%polygon1.length != i; ind--)
                                    p2.push(polygon1[ind%polygon1.length])
                                //console.log("continue: ",p1,p2)
                                if (insideP(p1, p2))
                                    return ConcatNext(p2, polygon2)
                                else return ConcatNext(p1, polygon2)
                            }
                        }
                        t+=1
                    }
                }
            }
        }
    }
    
    if (insideP(polygon1, polygon2))
        return [polygon2]
    
    if (insideP(polygon2, polygon1))
        return [polygon1]
    return [polygon1,polygon2]
}

function concat(p1, p2){
    let polygon1 = []
    let polygon2 = []

    for (let i = 0; i < p1.length; i++)
        polygon1.push(copy2(p1[i]))
    for (let i = 0; i < p2.length; i++)
        polygon2.push(copy2(p2[i]))
    
    //console.log("concat: ",p1, p2)
    //console.log("concat2: ",polygon1, polygon2)
    rebuild(polygon1, polygon2)

    let res = ConcatNext(polygon1, polygon2)
    
    return res
}

function spawnNew(polygon, knife){
    for (let i = 0; i < polygon.length; i++){
        for (let j = 0; j < knife.length-1; j++){
            if (knife[j] == polygon[i]){
                //console.log(knifeP[j])
                if (inside(polygon,smul2(add2(knife[j], knife[(j+1)%knife.length]), 0.5))==1){
                    let t = 1
                    while (t + j < knife.length){
                        for (let k = 0; k < polygon.length; k++){
                            if (polygon[k] == knife[(j+t)%knife.length]){
                                let p1 = []
                                let p2 = []
                                for (let ind = 0; ind <= t; ind++){
                                    p1.push(knife[(j+ind)%knife.length])
                                    p2.push(knife[(j+ind)%knife.length])
                                }
                                for (let ind = k+1; ind%polygon.length != i; ind++)
                                    p1.push(polygon[ind%polygon.length])
                                for (let ind = k-1+polygon.length; ind%polygon.length != i; ind--)
                                    p2.push(polygon[ind%polygon.length])
                                return spawnNew(p1, knife).concat(spawnNew(p2, knife))
                                return [p1,p2]
                            }
                        }
                        t+=1
                    }
                }
            }
        }
    }
    return [polygon]
}

function cutWithKnife(pol, knf, r){
    r = Math.abs(r)
    let knife = []
    let polygon = []

    for (let i = 0; i < pol.length; i++)
        polygon.push(copy2(pol[i]))
    for (let i = 0; i < knf.length; i++)
        knife.push(copy2(knf[i]))
    //console.log("overlap",knifeP,polygon)
    
    for (let i = 0; i < knife.length; i++){
        var min = r + eps + 1
        var t = -1
        for (let j = 0; j < polygon.length; j++){
            // if (len2(sub2(knife[i],polygon[j])) < r + eps)
            //     knife[i] = polygon[j]
            if (len2(sub2(knife[i],polygon[j])) < min){
                t = j
                min = len2(sub2(knife[i],polygon[j]))
            }
        }
        if (min < r + eps && t != -1)
            knife[i] = polygon[t]
    }
                
    for (let i = 0; i < knife.length - 1; i++){
        for (let j = 0; j < polygon.length; j++){
            a = knife[i]
            b = knife[(i+1)%knife.length]
            c = polygon[j]
            d = polygon[(j+1)%polygon.length]
            if (a==c || a == d || b == c || b == d)
                continue
            if (intersectInArr(polygon, knife, j, i)){
                i--
                break
            }
        }
    }
    let res = spawnNew(polygon, knife)
    //console.log("res: ", res)
    return res
}