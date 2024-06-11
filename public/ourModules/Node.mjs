export default class Node {
    constructor(x, y, m, partido) {
        this.pos = createVector(x, y, 1);
        this.mass = m;
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


    }

    select() {
        for (const b of bodies) {
            b.isSelected = false
        }
        this.isSelected = true
    }

    isOver() {
        let worldMouse = screenToWorld(mouseX, mouseY);
        const distance = dist(worldMouse.x, worldMouse.y, this.pos.x, this.pos.y);
        return distance < (this.mass / 2);
    }


    isClicked() {
        return this.isOver() && mouseIsPressed;
    }

    update() {
        let dir = createVector(0, 0);
        let totalForce = createVector(0, 0);
        let acc = createVector(0, 0);
        let dist = 0;

        for (const body of bodies) {

            if (body !== this && this.partido === body.partido) {
                this.maxDist = maxDist[this.type][body.type];
                this.minDist = minDist[this.type][body.type]
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
                if (dist < minDist[this.type][body.type]) {
                    this.dispColor = this.color2
                    // don't mess with dir
                    const force = dir.copy();

                    // an arbitrary value - in the example we had a table with a unique
                    // value for each combination. Let's see what i'll need...
                    force.mult(forces[this.type][body.type] * -3); // negative => repel

                    //map dist to positive 0~1 and multiply
                    const mappedD = abs(map(dist, 0, this.minDist, 1, 0)); // <== note 1 e 0  not 0 e 1
                    force.mult(mappedD);

                    // a constant to scale down the forces 0.5 in the example
                    force.mult(K)

                    //accumulate all the forces of all other particles interacting with this one
                    totalForce.add(force);
                }
                if (dist < maxDist[this.type][body.type]) {
                    this.dispColor = this.color3;
                    // don't mess with dir
                    const force = dir.copy();

                    // an arbitrary value - in the example we had a table with a unique
                    // value for each combination. Let's see what i'll need...
                    force.mult(forces[this.type][body.type]);

                    //map dist to positive 0~1 and multiply
                    const mappedD = abs(map(dist, 0, maxDist[this.type][body.type], 1, 0)); // <== note 1 e 0  not 0 e 1
                    force.mult(mappedD);

                    // a constant to scale down the forces 0.5 in the example
                    force.mult(K)

                    //accumulate all the forces of all other particles interacting with this one
                    totalForce.add(force);
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
    }


display() {
        push();
        noStroke()
        fill(255, 30);
        circle(this.pos.x, this.pos.y, this.maxDist)
        stroke(255, 0, 0, 50);
        fill(255, 250, 250, 20);
        circle(this.pos.x, this.pos.y, this.minDist)
        fill(this.dispColor);
        circle(this.pos.x, this.pos.y, this.mass);

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
}//<=== EOF NODE