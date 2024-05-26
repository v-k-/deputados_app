//  ////    ////    ////    ////    ////    ////    ////    ////    ////    //
//  ////    ////    COPY!!  ////    COPY!!  ////    //
//  ////    ////    ////    ////    ////    ////    ////    ////    ////    //

//  THE ATOM
// 
export default class Gpoint extends p5.Vector {
    constructor(x, y) {
        // lets base it in p5Vector
        super(x, y);
        // several.. this is the original fixed point, not used yet                  
        this.fixedPoint = createVector(x, y);
        // the adjusting point coordinates   
        this.gpoint = createVector(x, y);
        // anchor point of the window at creation time - to calc proportions            
        this.origin = createVector(0, 0);
        // the size of window. passing 1 as I'm going to divide by it: https://github.com/processing/p5.js/issues/5821
        // WINDOW SIZING !!         
        this.size = createVector(windowWidth, windowHeight, 1);
        // the ratio of the point to window size
        this.ratio = Gpoint.sub(this.gpoint, this.origin).div(this.size);
        // those so we can use it just as p5Vector, but maybe they just should replace gpoint
        this.x = this.gpoint.x;
        this.y = this.gpoint.y;
        // workaround for the same bug https://github.com/processing/p5.js/issues/5821
        this.z = 1;

        return this;
    } // constructor

    // make from p5Vector
    static makeFromVector(v) {
        return new Gpoint(v.x, v.y);
    }

    //*************
    // UPDATE    // ************************************************************************ //
    //*************        

    update() {
        // update size 
        // WINDOW RESIZING !!!
        this.size.set(windowWidth, windowHeight, 1);
        // recalc gpoints: original ratio vs new sizes
        this.gpoint.set(this.ratio.mult(this.size));
        this.ratio = Gpoint.sub(this.gpoint, this.origin).div(this.size);
        this.x = this.gpoint.x;
        this.y = this.gpoint.y;
        this.z = 1;
    }

    //***********************************************************NOT UPDATED TO NEW GRID THINKING BROKEN
    // this is to be called if the point is intended 
    // to be animated in draw(). a new ratio is calculated so
    // if the window is resized the point will maintain the correct 
    // relative position you can pass null to track only one value
    track(x, y) {
        if (x !== null) {
            const rx = x / this.size.x;
            this.ratioX = rx;
            this.gpoint.x = this.x = x;
        }
        if (y !== null) {
            const ry = y / this.size.y;
            this.ratioY = ry;
            this.gpoint.y = this.y = y;
        }
        return createVector(this.gx, this.gy);
    }
    //****************************************************************************************************
    // is it in use?
    set(x, y) {
        this.gpoint.set(x, y);
        this.update();
    }

    //...
    offToString() {
        return `-Gpoint- 
             gx= ${this.gx}
             gy= ${this.gy}
             ratioX= ${this.ratioX}
             ratioY= ${this.ratioY}`;
    }
} // class
