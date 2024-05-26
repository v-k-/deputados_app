import Deputado from '/ourModules/Deputado.mjs';

let listaDeputados = [];
let ultimoUpdate = '';


console.log("0");
console.log("1");

function calcCanvasSize() {

}
axios.get('/api/start')
    .then(response => {
        console.log("3");
        // Handle success
        console.log('Data received from server:');
        listaDeputados = response.data.deputados.map(deputadoData => {
            return Deputado.fromJSON(deputadoData);
        });
        const ultimoUpdate = new Date(response.data.ultimoUpdate);
        const formattedDate = ultimoUpdate.toLocaleDateString(undefined, {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        });
        const formattedTime = ultimoUpdate.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        const formattedDateTime = `${formattedDate} as ${formattedTime}`;
        document.getElementById('ultima').textContent = `dados atualizados em: ${formattedDateTime}`
        console.log(`${listaDeputados.length+1} deputados`);
        console.log(response.data);
        runP5();

    })
    .catch(error => {
        // Handle error
        console.error('There was a problem with the fetch operation:', error);
    });



// == == == == == 
function runP5() {

    const s = (p) => {
        //p5 global vars
        let cnvHeight;
        let sortBy = 'siglaPartido';
        let navLinks;


        p.preload = function() {
            cnvHeight = calcCnvHeight();
            console.log('cnvHeight:', cnvHeight);
        }

        p.setup = function() {
            //canvas
            let cnv = p.createCanvas(p.windowWidth, cnvHeight);
            cnv.parent('p5');

            // Get the navbar links
            navLinks = p.selectAll('.topnav a');
            navLinks.forEach(link => {
                link.mouseClicked(() => {
                    const value = link.elt.getAttribute('data-value');
                    sortBy = value;
                    p.redraw();
                });
            });

            p.imageMode(p.CENTER)
            Deputado.setP5Instance(p);
        }; // === === === --- -> eof setup


        //draw
        p.draw = function() {
            p.background(40);
            displaySorted(sortBy);
            p.noLoop();
        }; //eof draw



        p.windowResized = function() {
            resetCnv();
        };


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

        function OFFdisplaySorted(field) {
            const sortedDeputados = _.sortBy(listaDeputados, [field]);
            console.log(`sorted by ${field}`);

            for (let i = 0; i < sortedDeputados.length; i++) {
                const dep = sortedDeputados[i];
                console.log(dep[field]);
                const badgeWidth = dep.badgeWidth * 0.14;
                const padding = 0; // Padding between badges
                const badgesPerRow = Math.floor(window.innerWidth / (badgeWidth + padding)); // Calculate how many badges can fit in a row
                const x = (i % badgesPerRow - 1) * (badgeWidth + padding); // Calculate x coordinate
                const y = Math.floor(i / badgesPerRow) * (badgeWidth + padding); // Calculate y coordinate
                dep.showBadge(65 + x, 30 + y); // Call the showBadge method with calculated x and y
            }

        }

        function displaySorted(field) {
            const sortedDeputados = listaDeputados.slice().sort((a, b) => {
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