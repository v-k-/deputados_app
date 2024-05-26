'use strict';
//*************
// The grid base is  like this:

//anchor
//                        //
//  P0                 P1
//                        //
//         center
//                        //
//  P2                 P3
//                        // grid_size
//*************

class Grid {
    // to keep track of the base grid
    // for now used to avoid redrawing th background gray grid
    static id = 0;
    //in TEST to turn on of the grid drawing
    static graph = true;
    
    constructor(
        // default to window dimensions
        anchor_x = 0,
        anchor_y = 0,
        window_w = windowWidth,
        window_h = windowHeight,
        margin_w = 0,
        margin_h = 0,

        col_numb = 1,
        row_numb = 1,
        gutt_w = 0,
        gutt_h = 0,
    ) {
        // ensure unique ids 
        this.id = Grid.id;
        Grid.id++;
        //Just passing cols and rows and gutt from inputted data
        this.col_numb = col_numb;
        this.row_numb = row_numb;
        this.gutt_w = gutt_w;
        this.gutt_h = gutt_h;
        // this.canvas = window.p5.instance.canvas;


        //Make gPoints for inputed base points 
        //these don't update, except explicitly
        this.anchor = new Gpoint(anchor_x, anchor_y);
        this.margins = new Gpoint(margin_w, margin_h); //add check for stupid numbers!! 

        //updated, this is useful for grids inside panels.
        this.window_size = new Gpoint(window_w, window_h);

        //calc p0,p3 from the inputed data. Temp vectors.
        const p0v = p5.Vector.add(this.anchor, this.margins);
        const p3v = p5.Vector.sub(this.window_size, this.margins);

        // Store them as Gpoints
        // p1 e p2 are infered from p0 e p3, but included for easy access
        this.p0 = new Gpoint(p0v.x, p0v.y)
        this.p3 = new Gpoint(p3v.x, p3v.y);
        this.p1 = new Gpoint(this.p3.x, this.p0.y);
        this.p2 = new Gpoint(this.p0.x, this.p3.y);

        // Some arrays to store Gpoints of this grid.
        // organized by kind, so I can draw by kind later

        //Base grid Gpoints
        this.base_points = [this.p0, this.p1, this.p2, this.p3];

        //Some sugar, center and width/height for easy access
        this.cool_points = [];

        //made_points hold Gpoints created in main sketch and panels, 
        this.made_points = []

        //Not points anymore, grid's Panels instead.
        this.panels = [];

        //Calc instances cool vars
        // p3 sub p0  - using static Gpoint method... not sure if this is ideal
        this.grid_size = Gpoint.make_from_vector(p5.Vector.sub(this.p3, this.p0));
        // temp for adjust for canvas coordinates from grid cordinates
        const with_marg = p5.Vector.add(this.grid_size, p5.Vector.mult(this.margins, 2));
        // half width/height
        this.center = Gpoint.make_from_vector(p5.Vector.div(with_marg, 2)); //!!!!!!!???
        //store them 
        this.cool_points.push(this.grid_size);
        this.cool_points.push(this.center);

        //Make thios grid panels if any 
        //panels are abstract to hold data for 
        //columns and rows
        this.make_panels();

        // this.canvas.addEventListener('resize', (e) => { this.on_resize(e)});
    }






    //*************
    //UPDATE    // ************************************************************************ //
    //*************


    update() {
        this.window_size.gpoint.x = windowWidth
        this.window_size.gpoint.y = windowHeight;
        
        for (const gp of this.base_points) {
            // console.log(gp);
            gp.update();
        }

        for (const gp of this.cool_points) {
            // console.log(gp);
            gp.update();
        }

        if (this.made_points) {
            for (const gp of this.made_points) {
                gp.update();
            }
        }

        for (const pn of this.panels) {
            pn.update();
        }

    }



    //*************
    //GPOINTS  // ************************************************************************ //
    //*************

    // well... yet to be seen what design I should build
    // for now, this is to be called from Panel and sketch
    // creates and store. 
    make_Gpoint(x, y) {
        const gp = new Gpoint(x, y);
        this.made_points.push(gp)
        return gp;
    }





    //*************
    //PANELS
    //*************
    // calc intersections and choose diagonals  p0 and p1 of each panel
    // save them to a temp array so they can be accesse in a different order
    // then make gpoints and pass to make panels. Also make labels      
    //  *p0 **********************  //
    //  **      *        *       *  //
    //  *  0    *    1   *   2   *  //
    //  *     * *        *       *  //
    //  ***** p1* **** p0* *******  //
    //  *       *        * *     *  //
    //  *   3   *    4   *   5   *  //
    //  *       *        *     * *  //
    //  ********************** p0*  //
    // panels are stored in a 1d array, so we can use this order (ocd. reading)later to stack them up like:
    //  *p0 *****  //
    //  **      *  //
    //  *   0   *  //
    //  *     * *  //
    //  ***** p1*  //
    //  *       *  //
    //  *   1   *  //
    //  *       *  //
    //  *p0 *****  //
    //  **      *  //
    //  *   2   *  //
    //  *     * *  //
    //  ***** p1*  //
    //  *       *  //
    //  *   3   *  //
    //  *       *  //
    //  *********  //

    make_panels() {
        //clear the array
        this.panels = [];

        // a map to associate labels
        let temp_points = new Map();

        // w and h calc
        const col_width = this.grid_size.x / this.col_numb;
        const row_height = this.grid_size.y / this.row_numb;

        // 2d loop 1d array
        for (let i = 0; i <= this.row_numb; i++) {
            for (let j = 0; j <= this.col_numb; j++) {

                //guuters ?? 
                const x = j * col_width + this.p0.x;
                const y = i * row_height + this.p0.y;

                //insert for every intersection Gpoints and label
                temp_points.set(`${i}${j}`, new Gpoint(x, y));
            }
        }

        // number of panels to create
        const numb = this.col_numb * this.row_numb;
        // again 2d loop 1d array
        for (let i = 0; i < this.row_numb; i++) {
            for (let j = 0; j < this.col_numb; j++) {

                // make a label [panel number in array] [2d address] like [0][1]...
                const label = `[${this.panels.length.toString()}] [${i},${j}] [${i+1},${j+1}]`;
                // use label to pick points
                const diag1 = temp_points.get(`${i}${j}`);
                const diag2 = temp_points.get(`${i+1}${j+1}`)
                // only insert choosen points to be updated by Grid
                this.made_points.push(diag1);
                this.made_points.push(diag2);

                //make a new panel using diag points:
                const panel = new Panel(
                    diag1, //get the diagonal point |p0    |
                    diag2, //and oposite point      |    p2|
                    label, this); //pass the grid instance label id address[0] and a 2d address [0,0] [1,1];

                //push into grid's array;
                this.panels.push(panel);
            }
        }
    }




    //*************
    //DRAWING    // **************************   ******************************************** //
    //*************




    doodle() {
        if (view) {
            //draw bg grid, only one
            if (this.id === 0) {
                this.draw_bg_grid(10);
            }
            //draw grid
            this.draw_grid();

            // draw panels
            for (const p of this.panels) {
                p.doodle_panel();
            }
        }

    }




    draw_bg_grid(interval) {
        //draw bg grid
        //the only stuff using width/height from p5
 
        strokeWeight(1);
        stroke(0, 50);
        for (let i = 0; i < this.window_size.gpoint.x; i += interval) {
            line(i, 0, i, this.window_size.gpoint.y);
        }

        for (let i = 0; i < this.window_size.gpoint.y; i += interval) {
            line(0, i, this.window_size.gpoint.x, i);
        }

    }

    draw_grid() {
        //grid boundingbox
        push();
        fill(255, 0, 255, 20);
        noStroke();
        rect(this.p0.x, this.p0.y, this.grid_size.x, this.grid_size.y);
        pop()


        //aiming cross
        push()
        stroke(30);
        strokeWeight(1);
        line(this.center.x - 30, this.center.y, this.center.x + 30, this.center.y);
        line(this.center.x, this.center.y - 30, this.center.x, this.center.y + 30);
        pop();


        //grid lines
        push()
        strokeWeight(1);
        stroke(250, 95, 230, 80);
        noFill();
        this.pvline(this.p0, this.p1);
        this.pvline(this.p0, this.p2);
        this.pvline(this.p0, this.p3);

        this.pvline(this.p1, this.p2);
        this.pvline(this.p1, this.p3);
        this.pvline(this.p2, this.p3);
        pop();

        // draw base base_points at corners
        push();
        noFill();
        stroke("white")
        for (const p of this.base_points) {
            ellipse(p.x, p.y, 7, 7);
        }
        pop();
    }






    //*************
    //UTILITIES   // **************************   ******************************************** //
    //*************


    //silly utilities
    //utility to unpack a p5Vector or a Gpoint
    pvline(pv1, pv2) {
        line(pv1.x, pv1.y, pv2.x, pv2.y);

    }

} //class