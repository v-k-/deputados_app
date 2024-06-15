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
    globalThis.mousePressed = mousePressed;
    globalThis.mouseReleased = mouseReleased;
    globalThis.mouseDragged = mouseDragged;
    globalThis.keyPressed = keyPressed;
    globalThis.mocha = 'Hack to block p5.js auto global instantiation.';
    p5.instance || new p5; // Globally instantiate p5.js if it hasn't already.
    globalThis._setupDone = void 0; // Suppress duplicate imported warning.
}



// The singleton instance
let grid = []
import { partidos, formattedDateTime, initialDepData } from './entry.mjs';
// import Deputado from './ourModules/Deputado.mjs';
import CsDeputado from './ourModules/CsDeputado.mjs';
import Node from './ourModules/Node.mjs';
import { colors } from './ourModules/colors.mjs'
import Grid from './ourModules/Grid.mjs'


// p5 scope vars
let cnvHeight;
let deputados = [];
let partidosAtivos = []
let sorter = 'siglaPartido';
let navLinks;
let cnv;
let resizeTimeout;
let scrollOff = 0.0;
let totalHeight = 0.0;

let forceSlider, minDistSlider, maxDistSlider;
let forceValue, minDistValue, maxDistValue;
let a = 0,
    b = 0;


//new stuff for nodes
export let nodes = []
let nodesNumber = 520;



export let zoom = 1;
let dragPos;

let isDraggingCanvas = false;
let initialMousePos;

// caracteristicas são: minDist, maxDist, strength
//   force
//       part   depu
//  part  0       1 
//
//  depu  0       -5
//
//////// 
//
//     minDist
//       part    depu
//  part  0       diameter
//   
//  depu  diam     diam
//
////////
//      maxDist
//       0-part     1-depu
//  0 part  0        width
//
//  1 depu  0        10050
//      0        0          0       1
//  [partido][partido] | [partido][deputado]
// 
//      1        0          1       1
//  [deputado][partido] | [deputado][deputado]
// let initialForces = {
//     '00': -3.2,
//     '01': 6.6,
//     '10': -0.5,
//     '11': -1.1
// }

// let initialMin = {
//     '00': 0,
//     '01': 95,
//     '10': 0,
//     '11': 0
// }

// let initialMax = {
//     '00': 250,
//     '01': 3300,
//     '10': 66,
//     '11': 135
// }

let initialForces = {
    '00': 0,
    '01': 1.9,
    '10': 0,
    '11': 0.5
}

let initialMin = {
    '00': 0,
    '01': 250,
    '10': 0,
    '11': 99
}

let initialMax = {
    '00': 0,
    '01': 3500,
    '10': 0,
    '11': 90
}

export let forces = [
    [initialForces['00'], initialForces['01']],
    [initialForces['10'], initialForces['11']]
]

export let minDist = [
    [initialMin["00"], initialMin["01"]],
    [initialMin["10"], initialMin["11"]]
]
export let maxDist = [
    [initialMax['00'], initialMax['01']],
    [initialMax['10'], initialMax['11']]
]

// == === == == == == == == == == == == === == == == === =






// == === == == == == == == == == == == === == == == === =

function preload() {
    cnvHeight = calcCnvHeight();
    // console.log('cnvHeight:', cnvHeight);
    if (initialDepData.length > 0) {
        initialDepData.map(dep => {
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

    cnv.mouseWheel(handleWheel)

    createTestSliders();

    imageMode(CENTER)
    ellipseMode(CENTER)
    dragPos = createVector(0, 0);
    makePartidosNodes();
    console.log(partidosAtivos)
    console.log(deputados);
}; // === === === --- -> eof setup


// draw
function draw() {
    background(255);
    translate(width / 2, height / 2);
    scale(zoom);
    translate(dragPos.x, dragPos.y);

    // Update forces with slider values
    forces[a][b] = forceSlider.value();
    minDist[a][b] = minDistSlider.value();
    maxDist[a][b] = maxDistSlider.value();

    for (const b of nodes) {
        b.display();
        b.update();
    }

    // Call the function to update displayed values
    updateDisplayedValues();
} // === === === --- -> eof draw


function windowResized() {
    clearTimeout(resizeTimeout); // Clear previous timeout if any
    resizeTimeout = setTimeout(resetCnv, 400); // Set a new timeout
    redraw();
};

function keyPressed() {
    if (key === 'a' || key === 'A') {
        a = (a + 1) % 2; // Toggle between 0 and 1
    } else if (key === 'b' || key === 'B') {
        b = (b + 1) % 2; // Toggle between 0 and 1
    }


    // Update the sliders with the new values
    updateSlidersWithCurrentValues();

    // Update the displayed values to include `a` and `b`
    updateDisplayedValues();
}

function mousePressed() {
    initialMousePos = createVector(mouseX, mouseY);
    // bodySelected = false;

    for (let i = nodes.length - 1; i >= 0; i--) {
        if (nodes[i].isOver()) {
            nodes[i].select();
            // bodySelected = true;
            isDraggingCanvas = false;
            return;
        } else { isDraggingCanvas = true; }
    }

    // if (!bodySelected) {
    //     isDraggingCanvas = true;
    // }
}

function mouseReleased() {
    for (let i = 0; i < nodes.length; i++) {
        nodes[i].isSelected = false;
    }
    isDraggingCanvas = false;
    // bodySelected = false;
}


function mouseDragged() {
    if (isDraggingCanvas) {
        let dx = mouseX - initialMousePos.x;
        let dy = mouseY - initialMousePos.y;
        dragPos.x += dx;
        dragPos.y += dy;
        initialMousePos.set(mouseX, mouseY);
    }
}



function handleWheel() {
    const d = event.deltaY / 500;
    zoom += d
    zoom = constrain(zoom, 0.2, 10);

    // balanceProperty(forces, 0, 1, 3.8, initialForces['01'], 3.5)
    // balanceProperty(minDist, 0, 1, 266, initialMin["01"], 88)
    // balanceProperty(maxDist, 0, 1, 15000, initialMax['01'], 1500)

    // balanceProperty(forces, 1, 1, -0.8, initialForces['11'], -3.5)
    // balanceProperty(maxDist, 1, 1, 140, initialMax['11'], 195)

    // balanceProperty(maxDist, 0, 0, 760, initialMax['00'], 700)


    // balanceProperty(minDist, 0, 1, 1500 , 3100, 15000)
    return false;
}























//   EOF P5 default functions
// === === == === === == === === ==


// === === == === === == === === ==
// other functions and objects using p5 
//     vvvv ====== ==== vvvv ==== ====== vvvv

function balanceProperty(array, a, b, min, one, max) {
    let adjusted;
    if (zoom <= 1) {
        adjusted = map(zoom, 0.2, 1, min, one);
    } else {
        adjusted = map(zoom, 1.1, 10, one, max);
    }
    array[a][b] = adjusted;
}

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



export function screenToWorld(x, y) {
    let worldX = (x - width / 2) / zoom - dragPos.x
    let worldY = (y - height / 2) / zoom - dragPos.y;
    return createVector(worldX, worldY);
}

function worldToScreen(x, y) {
    let screenX = (x * zoom) + dragPos.x + width / 2;
    let screenY = (y * zoom) + dragPos.y + height / 2;
    return createVector(screenX, screenY);
}


function getUniqueSiglasPartido(data) {
    const uniqueSiglas = new Set(); // Using a Set to automatically handle uniqueness
    data.forEach(item => {
        uniqueSiglas.add(item.siglaPartido);
    });
    return Array.from(uniqueSiglas); // Convert the Set back to an array
}



function makePartidosNodes() {
    makeGrid();
    const partidosAtivos = getUniqueSiglasPartido(deputados);
    console.log("SSS", partidosAtivos);

    // for (const  p of partidosAtivos){
    //     const n = Node.makeFromPartido(p);
    //     n.type = 0;
    //    nodes.push(n);
    // }
    const partidosRandom = _.shuffle(partidosAtivos);

    for (var i = 0; i < partidosRandom.length; i++) {
        const p = partidosRandom[i];
        const n = Node.makeFromPartido(p, grid[i]);
        // const n = Node.makeFromPartido(p, createVector(10, 10));
        n.type = 0;
        nodes.push(n);
    }
}

function makeGrid() {
    for (let i = 0; i < 360; i += Math.floor(360/21))     {

        grid.push(createVector(cos(radians(-140 + i)) * 800, sin(radians(-140 + i)) *380));

    }
}

// Create the sliders and text elements
function createTestSliders() {
    forceSlider = createSlider(-20, 20, forces[a][b], 0.1);
    forceSlider.position(10, height - 110);
    forceSlider.style('width', '400px');

    minDistSlider = createSlider(0, 1000, minDist[a][b], 0.5);
    minDistSlider.position(10, height - 60);
    minDistSlider.style('width', '400px');

    maxDistSlider = createSlider(0, 9000, maxDist[a][b], 0.5);
    maxDistSlider.position(10, height - 10);
    maxDistSlider.style('width', '1800px');

    forceValue = createP();
    forceValue.position(220, height - 110);

    minDistValue = createP();
    minDistValue.position(220, height - 60);

    maxDistValue = createP();
    maxDistValue.position(220, height - 10);

    // Initialize the displayed values
    updateDisplayedValues();
}


// Update the sliders with the current values of forces, minDist, and maxDist
function updateSlidersWithCurrentValues() {
    forceSlider.value(forces[a][b]);
    minDistSlider.value(minDist[a][b]);
    maxDistSlider.value(maxDist[a][b]);
}

// Update the displayed values
function updateDisplayedValues() {
    forceValue.html(`Force (a=${a}, b=${b}): ${forceSlider.value()} -- -- ZOOM= ${zoom}`);
    minDistValue.html(`Min Distance (a=${a}, b=${b}): ${minDistSlider.value()}`);
    maxDistValue.html(`Max Distance (a=${a}, b=${b}): ${maxDistSlider.value()}`);
}