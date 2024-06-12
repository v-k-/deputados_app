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


//new stuff for nodes
export let nodes = []
let nodesNumber = 520;



let zoom = 0.1;
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

export let forces = [
    [-7, 8],
    [7, -12 ]
]

export let minDist = [
    [500, -1],
    [300,0]
]
export let maxDist = [
    [2700, 0],
    [19000, 800]
]



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


    imageMode(CENTER)
    dragPos = createVector(0, 0);
    makePartidosNodes();
    console.log(partidosAtivos)


    // for (var i = 0; i < nodesNumber; i++) {
    //     // nodes.push(new Body(random(180,220), random(180,220), 30, c));
    //     nodes.push(new Node(random(-800, 800), random(-800, 800), 60, 'PARTIDO1'));
    //     if (random(1) > 0.7) {
    //         nodes[i].partido = "PARTIDO2"
    //     }
    //     if (random(1) > 0.9) {
    //         nodes[i].partido = "PARTIDO3"
    //     }
    //     if (random(1) > 0.8) {
    //         nodes[i].partido = "PARTIDO4"
    //     }
    // }

    // nodes[0].mass = 120;
    // nodes[0].type = 0;
    // nodes[0].partido = 'PARTIDO2';
    // nodes[1].mass = 120;
    // nodes[1].type = 0;
    // nodes[1].partido = 'PARTIDO1';
    // nodes[2].mass = 120;
    // nodes[2].type = 0;
    // nodes[2].partido = 'PARTIDO3';
    // nodes[3].mass = 120;
    // nodes[3].type = 0;
    // nodes[3].partido = 'PARTIDO4';
console.log(deputados);
}; // === === === --- -> eof setup


// draw
function draw() {
    background(255);
    translate(width/2, height/2);
    scale(zoom);
    translate(dragPos.x , dragPos.y);

    
    for (const b of nodes) {
        b.display();
        b.update();
    }
    // clear(140);
    // // orbitControl(); 
    // textSize(40);
    // for (var i = 0; i < deputados.length; i++) {
    //     const dep = deputados[i];
    //     const x = dep.badgeWidth * 0.7;
    //     const y = scrollOff + (dep.badgeWidth * 1.6) * i;
    //     dep.showImage(x, y);
    //     text(dep.nome, x + 30 + dep.badgeWidth / 2, y - 160);
    //     text(dep.siglaPartido, x + 30 + dep.badgeWidth / 2, y - 100);
    //     text(dep.municipioNascimento + " - " + dep.siglaUf, x + 30 + dep.badgeWidth / 2, y - 40);
    //     const t = dep.escolaridade ? dep.escolaridade : "sem dados";
    //     text("escolaridade: " + t, x + 30 + dep.badgeWidth / 2, y + 20);
    // }
}; // === === === --- -> eof draw


function windowResized() {
    clearTimeout(resizeTimeout); // Clear previous timeout if any
    resizeTimeout = setTimeout(resetCnv, 400); // Set a new timeout
    redraw();
};


function mousePressed() {
    initialMousePos = createVector(mouseX, mouseY);
    // bodySelected = false;

    for (let i = nodes.length -1; i >=0; i--) {
        if (nodes[i].isOver()) {
            nodes[i].select();
            // bodySelected = true;
            isDraggingCanvas = false;
            return;
        }else{isDraggingCanvas = true;}
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
    zoom = constrain(zoom, 0.1, 20);
    maxDist[1][0] /= zoom * zoom * 0.2;
    return false;
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



function makePartidosNodes(){
    makeGrid();
    const partidosAtivos = getUniqueSiglasPartido(deputados);
    // for (const  p of partidosAtivos){
    //     const n = Node.makeFromPartido(p);
    //     n.type = 0;
    //    nodes.push(n);
    // }

    for (var i = 0; i < partidosAtivos.length; i++) {
        const p = partidosAtivos[i];
       const n = Node.makeFromPartido(p, grid[i]);
        n.type = 0;
       nodes.push(n);
    }
}

function makeGrid() {
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 3; j++) {``
      grid.push(createVector(-2800 + i * 800, -1000+j * 900));
    }
  }
}


