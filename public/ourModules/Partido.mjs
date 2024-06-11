import { colors } from './colors.mjs';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in an ES6 module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default class Partido {
    constructor(obj) {
        this.id = obj.id;
        this.sigla = obj.sigla;
        this.nome = obj.nome;
        this.url = obj.uri;
        this.colors = null;
        this.status = null;
        this.numeroEleitoral = null;
        this.urlLogo = null;
        this.urlWebSite = null;
        this.urlFacebook = null;
        this.getColors();
    }

    getColors() {
        if (colors.hasOwnProperty(this.sigla)) {
            this.colors = colors[this.sigla];
        } else {
            this.colors = colors['MISSING'];
        }
    }

    async getDetails() {
        try {
            const response = await axios.get(`https://dadosabertos.camara.leg.br/api/v2/partidos/${this.id}`);
            const data = response.data.dados;
            this.sigla = data.sigla;
            this.nome = data.nome;
            this.url = data.uri;
            this.status = data.status;
            this.numeroEleitoral = data.numeroEleitoral;
            this.urlLogo = data.urlLogo;
            this.urlWebSite = data.urlWebSite;
            this.urlFacebook = data.urlFacebook;

            // Fetch and handle the logo after getting the details
            if (this.urlLogo) {
                await this.fetchLogo(this.urlLogo);
            }
        } catch (error) {
            console.error(`Failed to fetch details for partido with id ${this.id}:`, error);
        }
    }

    async fetchLogo(url) {
        try {
            const response = await axios({
                url,
                responseType: 'stream',
            });
            
            const extension = path.extname(url);
            const logoPath = path.resolve(__dirname,'../', 'images', 'appAssets'
            	,'partidoChips', `${this.sigla.toLowerCase()}Logo${extension}`);
            
            await new Promise((resolve, reject) => {
                response.data.pipe(fs.createWriteStream(logoPath))
                    .on('finish', () => resolve())
                    .on('error', (e) => reject(e));
            });
            console.log(`Logo saved to ${logoPath}`);
        } catch (error) {
            console.error(`Failed to download logo from ${url}:`, error.message);
        }
    }

    static async create(obj) {
        const instance = new Partido(obj);
        await instance.getDetails();
        return instance;
    }
}
