import {colors} from './colors.mjs';


export default class CsDeputado {
            constructor(obj) {
                this.id = obj.id;
                this.nome = obj.nomeEleitoral;
                this.siglaPartido = obj.siglaPartido;
                this.siglaUf = obj.siglaUf;
                this.imageB64 = obj.imageB64;
                this.image = null; // Initialize as null
                // Load the image
                this.makeP5Image();
                this.dataNascimento = obj.dataNascimento;
                this.badgeWidth = 357;
            }

            makeP5Image() {
                // Using a callback to handle asynchronous loading
                loadImage(this.imageB64, (img) => {
                    this.image = img; // Set the image when it's loaded
                });
            }

            showImage(x, y) {
                image(this.image, x, y)
            }

            showBadge(x, y) {

                // Create p5.Image from Base64-encoded string
                const face = this.image ? this.image : photoPlaceholder; //createImg(this.imageB64);
                // Create mask
                const w = face.width;
                const h = face.height;
                const mask = createGraphics(w, h);
                mask.fill(255);
                mask.noStroke();
                mask.ellipse(mask.width / 2, mask.height / 2, this.badgeWidth);

                face.mask(mask);

                push();
                translate(x, y);
                scale(0.091);
                try {
                    const colorsValue = colors[this.siglaPartido]; // Get the RGB values for a particular color

                    // fill(partyColor);
                    noStroke();
                    // ellipse(0, 0, this.badgeWidth * 1.3);
                    this.makeChip(0, 0, this.badgeWidth * 1.4, colorsValue);
                    image(face, 0, 0, this.badgeWidth);
                    pop();
                } catch (error) {
                    console.error(`Error getting color for deputado ${this.nome} do partido ${this.siglaPartido}:`, error);
                }
            }

            makeChip(x, y, w, colors) {
                let startAngle = 0;
                for (let i = 0; i <= 580; i += 20) {
                    let colorIndex = Math.floor(i / 20) % 3;
                    let colorKey = colorIndex == 0 ? 'a' : colorIndex == 1 ? 'c' : 'b';
                    const colorArray = colors[colorKey];
                    const fillColor = color(...colorArray);
                    let endAngle = startAngle + radians(colorIndex == 1 ? 7 : 15);
                    fill(fillColor);
                    arc(x, y, w, w, startAngle, endAngle);
                    startAngle = endAngle;
                }



            }
        }// eof class Csdeputados