        //****************************************
        //----Strict
        "use strict";

        //****************************************
        //____Imports
        import axios from 'axios';
        import fs from 'fs';
        import path from 'path';
        import date from 'date-and-time';
        import express from 'express';
        import sharp from 'sharp';
        import _ from 'lodash';
        // my modules
        import Deputado from './public/ourModules/Deputado.mjs';
        import * as arrayIO from './public/ourModules/arrayIO.js';

        //****************************************
        //____variables

        const port = 11208;
        const apiBase = 'https://dadosabertos.camara.leg.br/api/v2/';
        const apiDeputados = path.join(apiBase, 'deputados');
        let servingData = [];
        let loadingData = [];
        const fileName = `lastestData.json`;
        let lastUpdateDate = new Date(); // Default value for lastUpdateDate
        const normalizedImageHeight = 470;
        const __dirname = path.dirname(new URL(
            import.meta.url).pathname);
        const placeholderImage = path.join(__dirname, 'public', 'images', 'fotoPlaceHolder.jpg');
        const interval = 2 * 60 * 60 * 1000; // 2hs em milliseconds;

        //error and tests 
        let testMode = true; // Test mode flag
        let throwFetchError = false;

        let imageRetrieverTimer;
        let timesSaved = 1;


        //****************************************
        //____server client communication

        const app = express();
        app.get('/api/start', (req, res) => {
            // Check if lista has been populated with data
            if (servingData !== null) {
                // If data exists, send it as the response
                const initialData = servingData.map(dep => ({
                    "id": dep.id,
                    "nomeEleitoral": dep.details.ultimoStatus.nomeEleitoral || null,
                    "siglaPartido": dep.siglaPartido || null,
                    "siglaUf": dep.siglaUf || null,
                    "dataNascimento": dep.details.dataNascimento || null,
                    "imageB64": dep.imageB64 || null,
                }));
                res.json({
                    "deputados": initialData,
                    "lastUpdateDate": lastUpdateDate
                });
            } else {
                // If data does not exist, send an error response
                res.status(404).json({
                    error: 'Data not available yet'
                });
            }
        });

        app.listen(port, () => {
            console.log(`Example app listening on port ${port}`)
        })

        app.use(express.static('public'));
        app.use('/ourModules', express.static(path.join(__dirname, 'modules')));



        //****************************************
        //____Server's data handling 

        async function updateData() {
            // Load locally saved data and serve it right away
            // This should be a complete Deputado with: 
            // Details, UltimoEstado and gabinete e b64 image 
            // Except for the very first time of the specific code 
            console.log(`==          -           ==`);
            console.log(`_                        _`);
            console.log(`_                        _`);
            console.log(`                         _`);
            console.log(`|O _ O| Lets get some data`);
            console.log(`                        ==`);
            console.log(`==          -           ==`);
            try {
                // Load data from files
                const thereIsData = fs.existsSync(fileName);
                const thereisDate = fs.existsSync('lastUpdateDate.json');

                if (thereIsData && thereisDate) {
                    servingData = await arrayIO.stRead(fileName);
                    const lastUpdateDateData = await fs.promises.readFile('lastUpdateDate.json');
                    const { timestamp } = JSON.parse(lastUpdateDateData);
                    lastUpdateDate = new Date(timestamp); // Convert back to Date object
                    console.log(`Serving file data from ${lastUpdateDate}`);
                    // In test mode never query the API, use saved data
                    if (testMode) {
                        // servingData.map(dep => {
                        //     if (dep.imageB64 === null) {
                        //         console.log(dep.id);
                        //     }
                        // });
                        console.log(`TESTMODE_ON: Serving file data from ${lastUpdateDate}`);

                        return; // Exit function if in test mode
                    }
                }


                const timer = setInterval(() => {
                    const f = ['...', '..', '.'];
                    const i = Math.floor(Math.random() * f.length); // Generate a random index within the array length
                    console.log(f[i]);
                }, 5000);


                console.log('Getting API data... hold on');
                // Query API for a list of deputados first data
                loadingData = await makeDeputados(apiDeputados, {
                    params: {
                        itens: 100,
                    }
                });
                console.log('API data loaded');

                console.log('Getting images, takes a while');

                // Use acquired data to query API again for b64image
                // We pass the whole array to be handled
                await getImages(loadingData);
                console.log('ImagesB64 loaded');



                console.log('Getting details... hold tight');
                // Use acquired data to query API again for details
                // We pass the whole array to be handled
                await getDetails(loadingData);
                console.log('details loaded');
                // Update data being served
                servingData = [...loadingData];


                imageRetrieverTimer = setInterval(retriever, 5000);
                saveData();
                console.log(`Serving new data updated at ${lastUpdateDate}`);
                clearTimeout(timer);



            } catch (error) {
                console.error('Error:', error);
            }
        }





        //utility for get all pages of data dealing with pagination
        async function getApiData(url, params) {
            //an array to be filled with all pages data
            let temp = [];
            let page = 1;
            // this pattern is a new for me, but efficient
            // we define a function inside a function that's going to be called recursively
            const fetchAllPages = async (url, params) => {
                try {
                    const response = await axios.get(url, params);
                    const dados = response.data.dados;
                    const links = response.data.links;

                    // instantiate Deputados and keep adding to array
                    const objects = dados.map(dep => new Deputado(dep));
                    temp.push(...objects);


                    //get next link, if there's one
                    const hasNext = links.find(item => item.rel === 'next');
                    const lastLInk = links.find(item => item.rel === 'last');
                    const lastPageUrl = lastLInk.href;
                    const paginaIndex = lastPageUrl.indexOf('pagina=') + 7; // Adding 7 to skip 'pagina='
                    const lastPage = parseInt(lastPageUrl.substring(paginaIndex));
                    console.log(`got page ${page++} of ${lastPage} `)
                    // call it with next link loop up until no next
                    if (hasNext) {
                        await fetchAllPages(hasNext.href, {});
                    }

                } catch (error) {
                    console.error('Error fetching data:', error.message);
                    throw error;
                }
            };
            await fetchAllPages(url, params);
            return temp;
        }


        async function makeDeputados(url, params) {
            const rawData = await getApiData(url, params);
            return rawData.map(dep => (new Deputado(dep)));
        }


        async function getDetails(deputados) {
            for (const deputado of deputados) {
                try {
                    const url = `${apiDeputados}/${deputado.id}`;
                    const response = await axios.get(url);
                    const d = response.data.dados;
                    deputado.setDetails(d);
                } catch (error) {
                    console.error("Error populating details for deputado:");
                    console.log(error.response.data);
                    console.log(error.response.status);
                    console.log(error.response.headers);
                }
            }

        }



        async function getImages(deputados) {

            // Attempt fetching images for all deputados
            for (const deputado of deputados) {
                let url = deputado.urlFoto;
                if (deputado.id === '220593' && throwFetchError)  url = deputado.urlFoto + "numfa"; 
                throwFetchError = false;
                await axios.get(url, {
                        responseType: 'arraybuffer'
                    })
                    .then(response => {
                        const base64Image = Buffer.from(response.data, 'binary').toString('base64');
                        deputado.setB64Image(base64Image);
                    })
                    .catch(error => {
                        if (error.response) {
                            // The request was made and the server responded with a status code
                            // that falls out of the range of 2xx
                            // console.log(error.response.data);
                            console.log(`Error fetching image of ${deputado.id}`)
                            console.log(error.response.status);
                            console.log(error.response.headers);
                            console.log(error.response.statusText);
                            console.log(error.response.config);
                        } else if (error.request) {
                            // The request was made but no response was received
                            // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
                            // http.ClientRequest in node.js
                            console.log(error.request);
                        } else {
                            // Something happened in setting up the request that triggered an Error
                            console.log('Error', error. smessage);
                        }
                    });
            }
        }

        async function retriever() {
            console.log(`|o _ o| will look for missing images or details...`);
            const missingImagesDeputados = _.filter(servingData, { 'imageB64': null });
            const missingDetailsDeputados = _.filter(servingData, dep => !dep.details);
            const missingImagesIds = missingImagesDeputados.map(item => item.id);
            const missingDetailsIds = missingDetailsDeputados.map(item => item.id);

            if (missingImagesDeputados.length > 0 || missingDetailsDeputados.length > 0) {
                console.log(`there are ${missingImagesDeputados.length} missing images and ${missingDetailsDeputados.length} missing details to retrieve.`);
                console.log(`attempting to retrieve b64image for ids`, missingImagesIds);
                console.log(`attempting to retrieve details for ids`, missingDetailsIds);

                await Promise.all([
                    getImages(missingImagesDeputados),
                    getDetails(missingDetailsDeputados)
                ]);

                saveData();
            } else {
                console.log(`there is no missing images or details to retrieve.`);
                clearInterval(imageRetrieverTimer);
                console.log(lastUpdateDate);
                console.log(lastUpdateDate.toLocaleString())
                console.log("Server walker is now resting. |- _ -|");
                const singplural = timesSaved === 1 ? 'vez' : 'timesSaved';
                console.log(`Dados baixados ${timesSaved++} ${singplural} desde que o servidor iniciou.`)
            }
        }


        async function saveData() {
            // Save new data to file both the array and the date
            await arrayIO.stWrite(servingData, fileName); // Write updated data to file
            lastUpdateDate = new Date(); // Update last retrieved time
            const timestamp = lastUpdateDate.getTime(); // Convert to Unix timestamp
            await fs.promises.writeFile('lastUpdateDate.json', JSON.stringify({
                timestamp
            }));
            console.log(`\ndados salvos \n`)
        }



        async function main() {
            await updateData();
            setInterval(updateData, interval); // Twice a day
        }

        main();
