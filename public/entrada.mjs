import Deputado from './ourModules/Deputado.mjs';
import CsDeputado from './ourModules/CsDeputado.mjs';
import { colors } from './ourModules/colors.mjs'
import { p5Singleton } from './ourModules/p5Singleton.mjs';
import Grid from './ourModules/Grid.mjs'

let deputados = [];
let lastUpdate = '';
let initialData = []

//The singleton instance
let grid;

// == == == == == 
function getInitialData() {
    axios.get('/api/start')
        .then(response => {
            // Handle success
            console.log('Data received from server:');
            initialData = response.data.deputados
            console.log("Hereby", initialData);
            const lastUpdate = new Date(response.data.lastUpdate);
            const formattedDate = lastUpdate.toLocaleDateString(undefined, {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit'
            });
            const formattedTime = lastUpdate.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            const formattedDateTime = `${formattedDate} as ${formattedTime}`;
            document.getElementById('ultima').textContent = `dados atualizados em: ${formattedDateTime}`
            runP5();
        })
        .catch(error => {
            // Handle error
            console.error('There was a problem with the fetch operation:', error);
        });

}
//call it
getInitialData();

function runP5() {
    console.log("Im in!")
    const s = (p) => {
        //asap set the p5 Singleton
        p5Singleton.setInstance(p);
        //p5 scope vars
        let cnvHeight;
        let sorter = 'siglaPartido';
        let navLinks;
        let cnv;


        p.preload = function() {
            console.log("preload", initialData);
            cnvHeight = calcCnvHeight();
            console.log('cnvHeight:', cnvHeight);
            if (initialData.length > 0) {
                initialData.map(dep => {
                    deputados.push(new CsDeputado(dep));
                });
            }
            console.log()
        }

        p.setup = function() {
            //canvas
            cnv = p.createCanvas(p.windowWidth, cnvHeight);
            cnv.parent('p5');
            // Get the navbar links
            navLinks = p.selectAll('.topnav a');
            navLinks.forEach(link => {
                link.mouseClicked(() => {
                    const value = link.elt.getAttribute('data-value');
                    sorter = value;
                    p.redraw();
                });
            });


            const c = p.floor(p.random(1, 10));
            const r = p.floor(p.random(1, 6));
            grid = new Grid(0, 0, p.windowWidth, p.windowHeight, 30, 30, c, r, 0, 0, this);
            const point = grid.make_Gpoint(p.width / 2, p.height / 2);
            grid.doodle(true);
            p.imageMode(p.CENTER)
            p.background(140, 130, 40);
            deputados[13].showImage(100, 50);
            deputados[13].showBadge(100, 50);
        }; // === === === --- -> eof setup



        //draw
        p.draw = function() {
            // p.background(40);
            // console.log('=== === >', deputados.length)
            // console.log(deputados[13])
            // // p.image(deputados[13].image, 120,110)
            // displaySorted(sorter);
            p.noLoop();
        }; // === === === --- ->  eof draw



        p.windowResized = function() {
            resetCnv();
        };


        //   EOF P5 default functions
        // === === == === === == === === ==











        // === === == === === == === === ==
        // other functions and objects using p5 
        //     vvvv ====== ==== vvvv ==== ====== vvvv


        function calcCnvHeight() {
            // Get header element
            const header = p.select('.header');
            // Get topnav element
            const topnav = p.select('.topnav');
            // Get footer element
            const footer = p.select('.footer');
            // Get computed styles
            const headerStyles = getComputedStyle(header.elt);
            const topnavStyles = getComputedStyle(topnav.elt);
            const footerStyles = getComputedStyle(footer.elt);
            // Extract height
            const headerHeight = p.float(headerStyles.height);
            const topnavHeight = p.float(topnavStyles.height);
            const footerHeight = p.float(footerStyles.height);
            console.log('p.windowHeight:', p.windowHeight);
            console.log('Header height:', headerHeight);
            console.log('topnav height:', topnavHeight);
            console.log('Footer height:', footerHeight);
            console.log(self.innerHeight);
            // will log the height of the frame viewport within the frameset
            console.log(parent.innerHeight);
            // will log the height of the viewport of the closest frameset
            console.log(top.innerHeight);
            //remaining space fille with a canvas. Parenthesis for clarity.
            return p.windowHeight - headerHeight - topnavHeight - footerHeight;
        }


        function resetCnv() {
            cnvHeight = calcCnvHeight();
            p.resizeCanvas(p.windowWidth, cnvHeight);
            // p.setup();
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
                const badgeWidth = dep.badgeWidth * 0.14;
                const padding = 0; // Padding between badges
                const badgesPerRow = Math.floor(window.innerWidth / (badgeWidth + padding)); // Calculate how many badges can fit in a row
                const x = (i % badgesPerRow - 1) * (badgeWidth + padding); // Calculate x coordinate
                const y = Math.floor(i / badgesPerRow) * (badgeWidth + padding); // Calculate y coordinate
                dep.showBadge(65 + x, 30 + y); // Call the showBadge method with calculated x and y
            }
        }



    }; //  === === === === === === ===    ---- -> end of 's' (instance of p5)

    let myp5 = new p5(s);
}