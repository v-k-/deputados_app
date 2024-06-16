import { nodes, zoom } from '../globalP5.mjs'
import { screenToWorld, minDist, maxDist, forces } from '../globalP5.mjs'
import { partidos} from '../entry.mjs'

const K = 2.0;
const friction = 0.8;

export default class Node {
    constructor(x, y, m, partido) {
        this.pos = createVector(x, y, 1);
        this.mass = m;
        this.diam = this.mass;
        this.vel = createVector(0, 0);
        this.isSelected = false;


        this.type = 1;
        this.partido = partido;

        // assigned from table used only for log data 
        this.minDist = 0;
        this.maxDist = 0;

        // just for debugging
        this.color1 = color(110, 50, 60, 50)
        this.color2 = color(210, 150, 160, 50)
        this.color3 = color(11, 5, 6, 50)
        this.dispColor = this.color1;

        this.deputado = null;


    }

    static makeFromCsDeputado(dep) {
        const n = new Node(random(-1300, 1300), random(-900, 900), 20, dep.siglaPartido);
        n.deputado = dep;
        return n;
    }

    static makeFromPartido(sigla, pos) {
        const n = new Node(pos.x, pos.y, 80, sigla);
        n.type = 0;
        // n.deputado = dep;
        console.log(n)
        return n;
    }

    select() {
        for (const b of nodes) {
            b.isSelected = false
        }
        this.isSelected = true
    }

    isOver() {
        let worldMouse = screenToWorld(mouseX, mouseY);
        const distance = dist(worldMouse.x, worldMouse.y, this.pos.x, this.pos.y);
        return distance < (this.diam / 2);
    }


    isClicked() {
        return this.isOver() && mouseIsPressed;
    }

    update() {
        let dir = createVector(0, 0);
        let totalForce = createVector(0, 0);
        let acc = createVector(0, 0);
        let dist = 0;

        for (const body of nodes) {

            if (body !== this) {
                if (this.partido === body.partido || this.type === 0) {
                    this.maxDist = maxDist[body.type][this.type];
                    this.minDist = minDist[body.type][this.type]
                    // console.log(body)
                    //clear for this particle
                    dir.mult(0);

                    //copy to keep from messing origina value
                    dir = body.pos.copy();

                    // get dir to other
                    dir.sub(this.pos);

                    //store distance before normalizing
                    dist = dir.mag();

                    //normalize
                    dir.normalize();


                    //repel based on dist
                    if (dist < minDist[body.type][this.type]) {
                        this.dispColor = this.color2
                        // don't mess with dir
                        const force = dir.copy();

                        // an arbitrary value - in the example we had a table with a unique
                        // value for each combination. Let's see what i'll need...
                        force.mult(forces[body.type][this.type] * -2); // negative => repel

                        //map dist to positive 0~1 and multiply
                        const mappedD = abs(map(dist, 0, minDist[body.type][this.type], 1, 0)); // <== note 1 e 0  not 0 e 1
                        //era assim, funcionava, mas eu achei que deveriua ser como acima, mas guardei o q funcionava
                        // const mappedD = abs(map(dist, 0, this.minDist, 1, 0)); // <== note 1 e 0  not 0 e 1
                        force.mult(mappedD);

                        // a constant to scale down the forces 0.5 in the example
                        force.mult(K)

                        //accumulate all the forces of all other particles interacting with this one
                        totalForce.add(force);
                    }
                    if (dist < maxDist[body.type][this.type]) {
                        this.dispColor = this.color3;
                        // don't mess with dir
                        const force = dir.copy();

                        const partyForce = partidos[this.partido]?.status?.totalMembros;
                        //get from 2d array each force related to other
                        // console.log(forces[body.type][this.type]+partyForce)
                       
                            
                        if(this.type===0){
                        force.mult(forces[body.type][this.type]-partyForce);
                            console.log(this.partido, this.type, "<===");
                        }else{

                        force.mult(forces[body.type][this.type]);
                        }

                        //map dist to positive 0~1 and multiply
                        const mappedD = abs(map(dist, 0, maxDist[body.type][this.type], 1, 0)); // <== note 1 e 0  not 0 e 1
                        force.mult(mappedD);

                        // a constant to scale down the forces 0.5 in the example
                        force.mult(K)

                        //accumulate all the forces of all other particles interacting with this one
                        totalForce.add(force);
                    }
                }
            }
        }

        acc.add(totalForce); // if mass totalForce/this.mass
        this.vel.add(acc);
        this.pos.add(
            this.vel);
        this.vel.mult(friction);

        if (this.isSelected) {
            let worldMouse = screenToWorld(mouseX, mouseY);
            this.pos.x = worldMouse.x;
            this.pos.y = worldMouse.y;
        }
        if (this.type === 0) {
            let offset = 0;
            if (zoom <= 0.3) {
                offset = map(zoom, 0.2, 0.3, this.mass*3.5, this.mass * 3);
            } else if (zoom <= 1) {
                offset = map(zoom, 0.3, 1, this.mass * 3, this.mass);
            } else  {
                offset = map(zoom, 1, 10, this.mass, this.mass*0.8);
            }


            this.diam = offset;
        }
    }

display() {
    push();
    noStroke()
    // fill(255, 30);
    // circle(this.pos.x, this.pos.y, this.maxDist)
    // stroke(255, 0, 0, 50);
    // fill(255, 250, 250, 20);
    // circle(this.pos.x, this.pos.y, this.minDist)

    if (this.deputado) {
        fill(60, 60, 60);
        circle(this.pos.x, this.pos.y, this.mass * 1.8);

        image(this.deputado.image, this.pos.x, this.pos.y + 3, this.mass, this.mass * 1.33);
    } else {
        fill(190);
        circle(this.pos.x, this.pos.y, this.diam);
    }

    if (this.type === 0) {
        fill(0)
        textSize(30)
        text(this.partido, this.pos.x - (textWidth(this.partido) / 2), this.pos.y + 6);
    }

    // if (this.type === 1) {
    //     image(img, this.pos.x, this.pos.y);
    //     textSize(7)
    //     text('Nome Filhadaputa', this.pos.x -25, this.pos.y +30);
    // } else {
    //     fill(this.dispColor);
    //     noStroke()
    //     circle(this.pos.x, this.pos.y, this.mass);
    // }

    if (this.isOver()) { rect(this.pos.x, this.pos.y, 20, 20) }
    pop();
}
} //<=== EOF NODE