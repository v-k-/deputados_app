'use strict';
import Gpoint from './Gpoint.js'
import Panel from './Panel.js'

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

export default class Grid {
    // to keep track of the base grid
    // for now used to avoid redrawing th background gray grid
    static id = 0;
    //in TEST to turn on of the grid drawing
    static graph = true;

    constructor(

        // default to window dimensions
        anchorX = 0,
        anchorY = 0,
        windowW = windowWidth,
        windowH = windowHeight,
        marginW = 0,
        marginH = 0,

        colNumber = 1,
        rowNumber = 1,
        guttW = 0,
        guttH = 0,
    ) {
        // ensure unique ids 
        this.id = Grid.id;
        Grid.id++;
        //Just passing cols and rows and gutt from inputted data
        this.colNumber = colNumber;
        this.rowNumber = rowNumber;
        this.guttW = guttW;
        this.guttH = guttH;
        this.remakePanels = false;;


        //Make gPoints for inputed base points 
        //these don't update, except explicitly
        this.anchor = new Gpoint(anchorX, anchorY);
        this.margins = new Gpoint(marginW, marginH); //add check for stupid numbers!! 

        //an offset for scrollig
        this.offset = createVector(0,0,1);

        //updated, this is useful for grids inside panels.
        this.windowSize = new Gpoint(windowW, windowH);

        //calc p0,p3 from the inputed data. Temp vectors.
        const p0v = createVector(this.anchor.x, this.anchor.y).add(this.margins);
        const p3v = createVector(this.windowSize.x, this.windowSize.y).sub(this.margins);

        // Store them as Gpoints
        // p1 e p2 are infered from p0 e p3, but included for easy access
        this.p0 = new Gpoint(p0v.x, p0v.y)
        this.p3 = new Gpoint(p3v.x, p3v.y);
        this.p1 = new Gpoint(this.p3.x, this.p0.y);
        this.p2 = new Gpoint(this.p0.x, this.p3.y);

        // Some arrays to store Gpoints of this grid.
        // organized by kind, so I can draw by kind later

        //Base grid Gpoints
        this.basePoints = [this.p0, this.p1, this.p2, this.p3];

        //Some sugar, center and width/height for easy access
        this.coolPoints = [];

        //madePoints hold Gpoints created in main sketch and panels, 
        this.madePoints = []

        //Not points anymore, grid's Panels instead.
        this.panels = [];

        //Calc instances cool vars
        // p3 sub p0  - using static Gpoint method... not sure if this is ideal
        this.gridSize = Gpoint.makeFromVector(p5.Vector.sub(this.p3, this.p0));
        this.basePoints.push(this.gridSize);
        // temp for adjust for canvas coordinates from grid cordinates
        const withMarg = p5.Vector.add(this.gridSize, p5.Vector.mult(this.margins, 2));
        // half width/height
        this.center = Gpoint.makeFromVector(p5.Vector.div(withMarg, 2)); //!!!!!!!???
        //store them 
        // this.coolPoints.push(this.gridSize);
        // this.coolPoints.push(this.center);

        // panels max and min so i can be responsive
        this.minPanelWidth = 150;
        this.maxPanelWidth = 251;
        this.initialPanelWidth = ( this.minPanelWidth + this.maxPanelWidth ) / 2;
        this.initialRowHeight = this.initialPanelWidth;
        this.initialPanelNumber = 1;

        this.colWidth = this.gridSize.x / this.colNumber;
        this.rowHeight = this.gridSize.y / this.rowNumber;

        //Make thios grid panels if any 
        //panels are abstract to hold data for 
        //columns and rows
        this.update();
        console.log(`colunas:`, colNumber);
        this.makePanels();

        // this.canvas.addEventListener('resize', (e) => { this.on_resize(e)});
    }


    setPanelLimits(min, max){
        this.minPanelWidth = min;
        this.maxPanelWidth = max;
        this.initialPanelWidth = ( this.minPanelWidth + this.maxPanelWidth ) / 2;
        this.initialRowHeight = this.initialPanelWidth;
        this.update();
    }

    setPanelNumber(numb){
        this.initialPanelNumber = numb;
        this.colNumber = Math.floor( this.gridSize.x / (this.initialPanelWidth) );
        this.rowNumber = Math.ceil( numb/this.colNumber )
        this.rowHeight = this.initialRowHeight;
        this.remakePanels = true;
        this.update();

    }

    setOffset(x, y){
        this.offset.x = x;
        this.offset.y = y;
        this.remakePanels = true;
        this.update();
    }

    //*************
    //UPDATE    // ************************************************************************ //
    //*************

    update() {
        this.windowSize.gpoint.x = windowWidth > this.maxPanelWidth ? windowWidth:this.maxPanelWidth;
        this.windowSize.gpoint.y = windowHeight;


        for (const gp of this.basePoints) {
            // console.log(gp);
            gp.update();
        }

        for (const gp of this.coolPoints) {
            // console.log(gp);
            gp.update();
        }

        if (this.madePoints) {
            for (const gp of this.madePoints) {
                gp.update();
            }
        }

        //check row_number
       this.calcCols();

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
    makeGpoint(x, y) {
        const gp = new Gpoint(x, y);
        this.madePoints.push(gp)
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

    makePanels() {
        // a map to associate labels
        let tempPoints = new Map();

        // 2d loop 1d array
        for (let i = 0; i <= this.rowNumber; i++) {
            // console.log(`===> ${i} rnumb = ${this.rowNumber}`)
            for (let j = 0; j <= this.colNumber; j++) {

                //guuters ?? 

                const x = j * this.colWidth + this.p0.x + this.offset.x;
                const y = i * this.initialRowHeight + this.p0.y + this.offset.y;

                //insert for every intersection Gpoints and label
                tempPoints.set(`${i}${j}`, new Gpoint(x, y));
            }
        }

        //clear the array
        this.panels = [];

        // number of panels to create
        // const numb = this.colNumber * this.rowNumber;
        // again 2d loop 1d array
        for (let i = 0; i < this.rowNumber; i++) {
            for (let j = 0; j < this.colNumber; j++) {

                // make a label [panel number in array] [2d address] like [0][1]...
                const label = `[${this.panels.length.toString()}] [${i},${j}] [${i+1},${j+1}]`;
                // use label to pick points
                const diag1 = tempPoints.get(`${i}${j}`);
                const diag2 = tempPoints.get(`${i+1}${j+1}`)
                // only insert choosen points to be updated by Grid
                this.madePoints.push(diag1);
                this.madePoints.push(diag2);

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


    calcCols() {
        const rn = this.colNumber;
        // w and h calc
        this.colWidth = this.gridSize.x / this.colNumber;
        this.rowHeight = this.gridSize.y / this.rowNumber;

        //if first run
        if (this.panels.length === 0) {
            this.initialPanelNumber = this.colNumber * this.rowNumber;
            this.initialRowHeight = this.rowHeight;
        }


        while (this.colWidth < this.minPanelWidth && this.colNumber > 1) {
            // console.log(`menor`, this.colNumber);
            // console.log('this.colWidth:', this.colWidth);
            this.colNumber--;
            this.colWidth = this.gridSize.x / this.colNumber
            // console.log('this.colWidthmenor==>:', this.colWidth);
        }
        while (this.colWidth > this.maxPanelWidth) {
            // console.log(`maior`, this.colNumber);
            // console.log('this.colWidth:', this.colWidth);
            this.colNumber++
            this.colWidth = this.gridSize.x / this.colNumber
            if(this.colWidth < this.minPanelWidth){ 
            this.colNumber--;
                break;
            }
            // console.log('this.colWidtmaiorh==>:', this.colWidth);
            // console.log(`maior`, this.colNumber);
        }


        // console.log('this.colWidthby the  whiles:', this.colWidth);
        this.colWidth = Math.max(this.gridSize.x/this.colNumber, this.minPanelWidth); 

        // console.log('initialPanelNumber:', this.initialPanelNumber);
        // console.log('Final colNumber:', this.colNumber);
        // console.log('initialPanelNumber / this.colNumber:', Math.ceil(this.initialPanelNumber / this.colNumber));
        // console.log('this.colWidth:', this.colWidth);
        // console.log('this.gridSize.x:', this.gridSize.x);
        // console.log('this.colWidth * colNumber:', this.colWidth * this.colNumber, '\n\n');
        this.rowNumber = Math.ceil(this.initialPanelNumber / this.colNumber);
        if (this.colNumber !== rn || this.panels.length === 0 || this.remakePanels) {
            this.makePanels();
            this.remakePanels = false;
        }
    }



    //*************
    //DRAWING    // **************************   ******************************************** //
    //*************

    doodle() {
        if (true) {
            //draw bg grid, only one
            if (this.id === 0) {
                this.drawBgGrid(10);
            }
            //draw grid
            this.drawGrid();

            // draw panels
            for (const p of this.panels) {
                p.doodlePanel();
            }
        }

    }

    drawBgGrid(interval) {
        //draw bg grid
        //the only stuff using width/height from p5

        strokeWeight(1);
        stroke(0, 50);
        for (let i = 0; i < this.windowSize.gpoint.x; i += interval) {
            line(i, 0, i, this.windowSize.gpoint.y);
        }

        for (let i = 0; i < this.windowSize.gpoint.y; i += interval) {
            line(0, i, this.windowSize.gpoint.x, i);
        }

    }

    drawGrid() {
        //grid boundingbox
        push();
        fill(255, 0, 255, 20);
        noStroke();
        rect(this.p0.x, this.p0.y, this.gridSize.x, this.gridSize.y);
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
        for (const p of this.basePoints) {
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