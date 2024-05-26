import {colors} from './colors.mjs';
import Detalhes from './Detalhes.mjs';

export default class Deputado {
    static p5 = null; // Static property to hold p5 instance reference

    constructor(firstData = {}) {
        this.id = firstData.id ? firstData.id.toString() : null;
        this.uri = firstData.uri || null;
        this.nome = firstData.nome || null;
        this.siglaPartido = firstData.siglaPartido || null;
        this.uriPartido = firstData.uriPartido || null;
        this.siglaUf = firstData.siglaUf || null;
        this.idLegislatura = firstData.idLegislatura || null;
        this.urlFoto = firstData.urlFoto || null;
        this.email = firstData.email || null;
        this.details = null;
        this.imageB64 = null;

    }


    async setDetails(detailData) {

        this.details = new Detalhes (detailData);
        this.details.set
        return Promise.resolve();
    }
    async setB64Image(base64) {
        this.imageB64 = `data:image/jpeg;base64,${base64}`;
        // Return a promise to indicate when image setting is complete
        return Promise.resolve();
    }

    showBadge(x, y) {
        // Access p5 instance through static property
        if (Deputado.p5) {
            // set p5Image.
            if (this.imageB64) {

                let img;
                let raw = new Image();
                raw.src = `data:image/jpeg;base64,${this.imageB64}`; // base64 data here
                img = p.createImage(raw.width, raw.height);
                img.drawingContext.drawImage(raw, 0, 0);

                // Create p5.Image from Base64-encoded string
                const face = img; //Deputado.p5.createImg(this.imageB64);
                console.log("face");
                // Create mask
                const w = face.width;
                const h = face.height;

                const mask = Deputado.p5.createGraphics(w, h);
                mask.fill(255);
                mask.noStroke();
                mask.ellipse(mask.width / 2, mask.height / 2, this.badgeWidth);

                face.mask(mask);

                Deputado.p5.push();
                Deputado.p5.translate(x, y);
                Deputado.p5.scale(0.091);
                try {
                    const colorsValue = colors[this.siglaPartido]; // Get the RGB values for a particular color

                    // Deputado.p5.fill(partyColor);
                    Deputado.p5.noStroke();
                    // Deputado.p5.ellipse(0, 0, this.badgeWidth * 1.3);
                    this.makeChip(0, 0, this.badgeWidth * 1.4, colorsValue);
                    Deputado.p5.image(face, 0, 0, this.badgeWidth);
                    Deputado.p5.pop();
                } catch (error) {
                    console.error(`Error getting color for deputado ${this.nome} do partido ${this.siglaPartido}:`, error);
                }
            } else { ///handle no image
            }
        } else {
            console.error('p5 instance is not provided.');
        }
    }

    makeChip(x, y, w, colors) {
        let startAngle = 0;
        for (let i = 0; i <= 580; i += 20) {
            let colorIndex = Math.floor(i / 20) % 3;
            let colorKey = colorIndex == 0 ? 'a' : colorIndex == 1 ? 'c' : 'b';
            const colorArray = colors[colorKey];
            const fillColor = Deputado.p5.color(...colorArray);
            let endAngle = startAngle + Deputado.p5.radians(colorIndex == 1 ? 7 : 15);
            Deputado.p5.fill(fillColor);
            Deputado.p5.arc(x, y, w, w, startAngle, endAngle);
            startAngle = endAngle;
        }

    }

    static setP5Instance(p5Instance) {
        Deputado.p5 = p5Instance;
    }

    static fromJSON(json) {
        const d = new Deputado();

        d.id = json.id;
        d.uri = json.uri;
        d.nome = json.nome;
        d.siglaPartido = json.siglaPartido;
        d.uriPartido = json.uriPartido;
        d.siglaUf = json.siglaUf;
        d.idLegislatura = json.idLegislatura;
        d.urlFoto = json.urlFoto;
        d.email = json.email;
        d.ultimoStatus = json.ultimoStatus;
        d.cpf = json.cpf;
        d.sexo = json.sexo;
        d.urlWebsite = json.urlWebsite;
        d.redeSocial = json.redeSocial;
        d.dataNascimento = json.dataNascimento;
        d.dataFalecimento = json.dataFalecimento;
        d.ufNascimento = json.ufNascimento;
        d.municipioNascimento = json.municipioNascimento;
        d.escolaridade = json.escolaridade;
        d.imageB64 = json.imageB64;

        return d;
    }
}

class UltimoStatus {
    constructor(ultimoStatus) {
        this.id = ultimoStatus.id;
        this.uri = ultimoStatus.uri;
        this.nome = ultimoStatus.nome;
        this.siglaPartido = ultimoStatus.siglaPartido;
        this.uriPartido = ultimoStatus.uriPartido;
        this.siglaUf = ultimoStatus.siglaUf;
        this.idLegislatura = ultimoStatus.idLegislatura;
        this.urlFoto = ultimoStatus.urlFoto;
        this.email = ultimoStatus.email;
        this.data = ultimoStatus.data;
        this.nomeEleitoral = ultimoStatus.nomeEleitoral;
        this.gabinete = new Gabinete(ultimoStatus.gabinete);
        this.situacao = ultimoStatus.situacao;
        this.condicaoEleitoral = ultimoStatus.condicaoEleitoral;
        this.descricaoStatus = ultimoStatus.descricaoStatus;
    }
}

class Gabinete {
    constructor(gabinete) {
        this.nome = gabinete.nome;
        this.predio = gabinete.predio;
        this.sala = gabinete.sala;
        this.andar = gabinete.andar;
        this.telefone = gabinete.telefone;
        this.email = gabinete.email;
    }
}