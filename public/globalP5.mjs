// This runP5 is a great contribution from @goToLoop in processing discourse
// controlling when to instantiate P5
// from https://discourse.processing.org/t/help-extending-p5-and-dependencies-in-web-dev/44421
//
// it's based on this 
// == == == == == == == == == 
//  if (!window.mocha) {
//     // If there is a setup or draw function on the window
//     // then instantiate p5 in "global" mode
//     if (
//       ((window.setup && typeof window.setup === 'function') ||
//         (window.draw && typeof window.draw === 'function')) &&
//       !p5.instance
//     ) {
//       new p5();
//     }
//   }
// };

// As you can notice, if we assign anything “truthy” to mocha, p5.js library will never auto-instantiate p5!
// Well, unless we do it ourselves later. :wink:
// Same for _setupDone, but for suppressing the annoying warn() message:

// github.com
// processing/p5.js/blob/v1.9.3/src/core/init.js#L16-L25
// const _globalInit = () => {
//   // Could have been any property defined within the p5 constructor.
//   // If that property is already a part of the global object,
//   // this code has already run before, likely due to a duplicate import
//   if (typeof window._setupDone !== 'undefined') {
//     console.warn(
//       'p5.js seems to have been imported multiple times. Please remove the duplicate import'
//     );
//     return;
//   }
// == == == == == == == == 



// == == == == == == == == // == == == == == == == == // == == == == == == == == // == == == == == == == == // == == == == == == == == 





// == == == == == == == ==  ||||||||||||| E Vamos... |||||||||||||||  == == == == == 
//                          ........................................

export default function runP5() {
    // Make p5.js callbacks globally visible:
    globalThis.preload = preload;
    globalThis.setup = setup;
    globalThis.draw = draw;
    globalThis.windowResized = windowResized;
    globalThis.keyPressed = keyPressed;
    globalThis.mocha = 'Hack to block p5.js auto global instantiation.';
    p5.instance || new p5; // Globally instantiate p5.js if it hasn't already.
    globalThis._setupDone = void 0; // Suppress duplicate imported warning.
}


// The singleton instance
let grid, panels;
import { deputados, lastUpdate, initialData } from './entry.mjs';
import Deputado from './ourModules/Deputado.mjs';
import CsDeputado from './ourModules/CsDeputado.mjs';
import { colors } from './ourModules/colors.mjs'
import Grid from './ourModules/Grid.mjs'


// p5 scope vars
let cnvHeight;
let sorter = 'siglaPartido';
let navLinks;
let cnv;
let resizeTimeout;
let scroll = 0.0;

function preload() {
    cnvHeight = calcCnvHeight();
    // console.log('cnvHeight:', cnvHeight);
    if (initialData.length > 0) {
        initialData.map(dep => {
            deputados.push(new CsDeputado(dep));
        });
    }
}

function setup() {
    // canvas fit into page html
    cnv = createCanvas(windowWidth, cnvHeight);
    cnv.parent('p5');
    // Get the navbar links
    navLinks = selectAll('.topnav a');
    navLinks.forEach(link => {
        link.mouseClicked(() => {
            const value = link.elt.getAttribute('data-value');
            sorter = value;
            redraw();
        });
    });

    cnv.mouseWheel(trackScroll)

    const c = 10; // floor(random(1, 10));
    const r = 5; // floor(random(1, 6));
    grid = new Grid(0, 0, windowWidth, cnvHeight, 30, 30, 1, 1, 0, 0);
    grid.setPanelLimits(190, 220);
    grid.setPanelNumber(deputados.length)
    console.log(`grid =`);
    console.log(grid);
    panels = grid.panels;
    console.log(panels);
    const point = grid.makeGpoint(width / 2, height / 2);
    grid.doodle(true);
    imageMode(CENTER)
    background(140, 130, 40);
    deputados[13].showImage(100, 50);
    deputados[13].showBadge(100, 50);
}; // === === === --- -> eof setup


// draw
function draw() {
    background(140);
    grid.doodle();
    // console.log(panels);

    //     const panels = grid.panels;
    // for (var i = 0; i < panels.length; i++) {
    //     fill(i*8, 30,100);
    //     const p = createVector(panels[i].center.x, panels[i].center.y);
    //     rect(panels[i].p0.x , panels[i].p0.y, panels[i].panelSize.x, panels[i].panelSize.y )
    //     fill(255,30)
    //     ellipse(p.x, p.y +, 50, 50);
    //     fill(20)
    //     textSize(50);
    //     text(i.toString(),p.x-20, p.y+25 );
    // }


    for (var i = 0; i < deputados.length; i++) {
        const dep = deputados[i];
        const panel = grid.panels[i]
        const x = grid.panels[i].center.x;
        const y = grid.panels[i].center.y;
        if (true) {
            deputados[i].showBadge(x, y)
        }
    }
    noLoop();
    // ellipse(grid.panels[23].center.x, grid.panels[23].center.y, 30,30)
    // ellipse(grid.p3.x, grid.p3.y, 30, 30)
    // ellipse(grid.center.x, grid.center.y, 30,30)
    // console.log('=== === >', deputados.length)
    // console.log(deputados[13])
    // // image(deputados[13].image, 120,110)
    // displaySorted(sorter);
    // noLoop();
}; // === === === --- -> eof draw


function windowResized() {
    clearTimeout(resizeTimeout); // Clear previous timeout if any
    resizeTimeout = setTimeout(resetCnv, 400); // Set a new timeout
    grid.update();
    for (const panel of panels) {}
        redraw();
};


function keyPressed() {

}



function trackScroll() {
    scroll += event.deltaY;
    grid.setOffset(0, scroll);
    // grid.update();
    redraw()
}

//   EOF P5 default functions
// === === == === === == === === ==


// === === == === === == === === ==
// other functions and objects using p5 
//     vvvv ====== ==== vvvv ==== ====== vvvv


function calcCnvHeight() {
    // Get header element
    const header = select('.header');
    // Get topnav element
    const topnav = select('.topnav');
    // Get footer element
    const footer = select('.footer');
    // Get computed styles
    const headerStyles = getComputedStyle(header.elt);
    const topnavStyles = getComputedStyle(topnav.elt);
    const footerStyles = getComputedStyle(footer.elt);
    // Extract height
    const headerHeight = float(headerStyles.height);
    const topnavHeight = float(topnavStyles.height);
    const footerHeight = float(footerStyles.height);
    // console.log('windowHeight:', windowHeight);
    // console.log('Header height:', headerHeight);
    // console.log('topnav height:', topnavHeight);
    // console.log('Footer height:', footerHeight);
    // console.log(self.innerHeight);
    // will log the height of the frame viewport within the frameset
    // console.log(parent.innerHeight);
    // remaining space filled with a canvas. Parentheses for clarity.
    return windowHeight - headerHeight - topnavHeight - footerHeight;
}


function resetCnv() {
    cnvHeight = calcCnvHeight();
    resizeCanvas(windowWidth, cnvHeight);
}

function displaySorted(field) {
    const sortedDeputados = deputados.slice().sort((a, b) => {
        const valueA = a[field];
        const valueB = b[field];
        return valueA.localeCompare(valueB, 'pt', { sensitivity: 'base' });
    });

    console.log(`sorted by ${field}`);
    for (let i = 0; i < sortedDeputados.length; i++) {
        const dep = sortedDeputados[i];
        // console.log(dep[field]);
        const badgeWidth = debadgeWidth * 0.14;
        const padding = 0; // Padding between badges
        const badgesPerRow = Math.floor(window.innerWidth / (badgeWidth + padding)); // Calculate how many badges can fit in a row
        const x = (i % badgesPerRow - 1) * (badgeWidth + padding); // Calculate x coordinate
        const y = Math.floor(i / badgesPerRow) * (badgeWidth + padding); // Calculate y coordinate
        depshowBadge(65 + x, 30 + y); // Call the showBadge method with calculated x and y
    }
}