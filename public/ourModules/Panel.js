import Grid from './Grid.mjs';

export default class Panel {
    // takes 2 Gpoints
    constructor(gp0, gp3, label, grid) {
        // pass those Gpoints that are already in parent Grid array
        // Note that p3 has the w/h already offseted for window coordinates
        this.p0 = gp0;
        this.p3 = gp3;
        // splitting for better formatting
        this.label = label.split(" ");
        // a ref
        this.parentGrid = grid;
        // calc and make p1 and p2. makeGpoint stores them in Grid array
        this.p1 = this.parentGrid.makeGpoint(this.p3.x, this.p0.y);
        this.p2 = this.parentGrid.makeGpoint(this.p0.x, this.p3.y);
        // calc panel size. Note this is the dimension relative to p0,
        // so its coordinates do not match window coordinates
        this.panelSize = this.parentGrid.makeGpoint(this.p3.x - this.p0.x, this.p3.y - this.p0.y);
        // calc and store center for commodity
        this.center = this.parentGrid.makeGpoint(this.p0.x / 2 + this.p3.x / 2, this.p0.y / 2 + this.p3.y / 2);
        // local array with base points for easy access
        this.panelPoints = [this.p0, this.p1, this.p2, this.p3];
        // to store a possible grid in this panel
        this.panelGrid;
        // sugar
        this.random = random(0, 1);
        this.props = new Map();
    }

    makeProperty(prop, val) {
        this.props.set(prop, val);
        return this.props.get(this.props.length - 1);
    }

    //*************
    //PANEL GRID    // ************************************************************************ //
    //*************

    makePanelGrid(cols, rows) {
        // 1-  anchor_x,
        // 2-  anchor_y,
        // 3-  window_w,
        // 4-  window_h,
        // 5-  margin_w,
        // 6-  margin_h,
        // 7-  col_numb,
        // 8-  row_numb,
        // 9-  gutt_w,
        // 10- gutt_h 
        const pg = new Grid(
            this.p0.x, // panel anchor
            this.p0.y,
            this.p3.x, // panel width/height already offseted
            this.p3.y,
            0, // margin w
            0, // margin h
            cols,
            rows,
            0, // col < ---------**************** To be implemented !!!
            0, //
        );
        this.panelGrid = pg;
        // set the grid to panels size
        pg.windowSize.set(this.panelSize.x, this.panelSize.x)
        // and recalc stuff
        pg.update();
        return pg;
    }

    //*************
    //UPDATE    // ************************************************************************ //
    //*************

    // only calls the panel grid update if there is one
    // Grids do all update actually
    update() {
        if (this.panelGrid) {
            this.panelGrid.update();
        }
    }

    //*************
    //DRAWING   // ************************************************************************ //
    //*************

    doodlePanel() {
        push();
        stroke(0);
        fill(0, 20);
        rectMode(CORNERS);
        rect(this.p0.x, this.p0.y, this.p3.x, this.p3.y);
        rectMode(CORNER);
        ellipse(this.p0.x, this.p0.y, 20, 20);
        ellipse(this.p1.x, this.p1.y, 12, 12);
        ellipse(this.p2.x, this.p2.y, 20, 20);
        ellipse(this.p3.x, this.p3.y, 12, 12);
        pop();

        this.drawLinesFromArrays([this.panelPoints]);
        push();
        strokeWeight(1);
        stroke(250, 95, 230, 80);
        noFill();
        this.parentGrid.pvline(this.p0, this.p2);
        this.parentGrid.pvline(this.p0, this.p3);
        this.parentGrid.pvline(this.p0, this.p1);
        this.parentGrid.pvline(this.p1, this.p2);
        this.parentGrid.pvline(this.p1, this.p3);
        this.parentGrid.pvline(this.p2, this.p3);
        pop();

        // text(this.label, this.p0.x, this.p3.x);
        push();
        noStroke();
        fill(40, 50, 100);
        textSize(14);
        text(this.label[0], this.center.x - textWidth(this.label[0]) / 2, this.center.y + 25);
        text(this.label[1], this.center.x - textWidth(this.label[1]) / 2, this.center.y + 45);
        const w = nf(this.p1.x - this.p0.x, 3, 2);
        text(w.toString(), this.center.x - textWidth(w) / 2, this.center.y + 65)

        // call panel's grid draw
        if (this.panelGrid) {
            this.panelGrid.doodle();
        }
        pop();
    }

    // draw dashed lines from an array of gpoints
    drawLinesFromArrays(a) {
        const v = a.flat(1);
        const num = v.length;
        for (let i = 0; i < num; i++) {
            for (let j = i + 1; j < num; j++) {
                // console.log(i,j);
                this.dashLine(v[i], v[j]);
            }
        }
    }

    // draw dashed line of 2 p5Vectors
    dashLine(pv1, pv2) {
        let d = dist(pv1.x, pv1.y, pv2.x, pv2.y);
        let f1 = 0.05 - d / 100000;
        let f2 = f1 + d / 100000;
        let x1, y1, x2, y2;
        for (let i = 0; i <= 1; i += f1) {
            x1 = lerp(pv1.x, pv2.x, i);
            y1 = lerp(pv1.y, pv2.y, i);
            x2 = lerp(pv1.x, pv2.x, i + f2);
            y2 = lerp(pv1.y, pv2.y, i + f2);
            // console.log(`${i} [${x1}, ${y1}]`)
            line(x1, y1, x2, y2);
            i += f2 * 1.2;
        }
    }

} // class