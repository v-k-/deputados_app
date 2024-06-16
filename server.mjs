        // ++ ++ ++ NOTES:
        //////
        // - erro pra qd nao vem detalhes nao ficar tentendo pra sempre
        // - outros erros   pra não bloquear
        // - tem q rver também a fuçano retriever, pq acho q nao tá bem pensada pra 
        // - ser usada desincronizada - raciocinio de blocking code... acho






        //****************************************
        //----Strict
        "use strict";

        //****************************************
        //____Imports
        import axios from 'axios';
        import fs from 'fs';
        import path from 'path';
        // import date from 'date-and-time';
        import express from 'express';
        import sharp from 'sharp';
        import _ from 'lodash';
        // my modules
        import Deputado from './public/ourModules/Deputado.mjs';
        import Partido from './public/ourModules/Partido.mjs';
        import * as arrayIO from './public/ourModules/arrayIO.js';






        //****************************************
        // this is opal's port (deployment server's port)
        const port = 11208;

        // the main timer
        let mainTimer;
        let retries = 0;




        // === === API paths data
        const apiBase = 'https://dadosabertos.camara.leg.br/api/v2/';
        const apiDeputados = path.join(apiBase, 'deputados');
        const apiLegislatura = path.join(apiBase, 'legislaturas');

        let apiIsUp

        // === more paths
        // in ES modules, __dirname is not available by default.
        // This line creates a similar variable for ES modules.
        const __dirname = path.dirname(new URL(
            import.meta.url).pathname);

        //generic image 
        const missingPhotoPath = path.join(__dirname, 'public', 'images', 'appAssets', 'missingPhoto.png');
        // let missingPhotoBase64;

        //mask
        const maskImagePath = path.join(__dirname, 'public', 'images', 'appAssets', 'faceMask.png');
        // let maskImageBuffer; //Buffer to store the mask image


        // === ===  Legislatura

        // get Legislatura, a  single int (57 = 2024) starting count from first legislatura
        // so far i could just let API default to present one,
        // but it might be good in future to have that sorted

        // get and store it
        let legislatura = 57; // == == == == == == == == == == == CHANGE THIS TO SAVED DATA
        // console.log('+>', legislatura);

        async function testAPI() {
            try {
                console.log('testing api base url')
                const response = await axios.get(apiBase, {
                    timeout: 10000,
                });
                apiIsUp = true;
                console.log("API is up.")
            } catch (error) {
                if (error.status > 500) {
                    console.error("API is not responding:", error.toJSON())
                    apiIsUp = false;
                }
            }
            return apiIsUp;
        }
        async function fetchLegislatura() {
            const today = getFormattedToday(); // Get today's date in YYYY-MM-DD format
            try {
                const response = await axios.get(apiLegislatura, {
                    params: {
                        data: today

                    },
                    timeout: 10000,
                });
                const legislaturaId = response.data.dados[0].id; // Access the required field in the response
                console.log('Legislatura ==>', legislaturaId);
                return legislaturaId;
            } catch (error) {
                console.error('\n\nError fetching legislatura:\n', error.toJSON());
                return ''; // Ensure a value is returned in case of error
            }
        }


        // === === Partidos
        const apiPartidos = path.join(apiBase, 'partidos');
        let partidos = []



        // async function makePartidos() {
        //     const rawData = await fetchPartidos();
        //     for (const partido of rawData) {
        //         partidos.push(await Partido.create(partido));
        //     }
        // }

        async function makePartidos() {
            const rawData = await fetchPartidos();
            const partidosObject = {};
            for (const partido of rawData) {
                const partidoInstance = await Partido.create(partido);
                partidosObject[partidoInstance.sigla] = partidoInstance;
            }
            partidos = partidosObject;
        }

        async function fetchPartidos() {
            try {
                const rawPartidos = await getApiData(apiPartidos, {
                    params: {
                        idLegislatura: legislatura,
                        itens: 100
                    }
                });
                return rawPartidos;
            } catch (error) {
                console.error('Error fetching Partidos:', error);
                return {}; // Ensure an empty array is returned in case of error
            }
        }




        // === === Server data stuff

        // interval between default API query
        // write details of this herer later
        const interval = 2 * 60 * 60 * 1000; // 2hs em milliseconds; // 

        // data to be serverd
        let servingData = [];

        // loading data for later hot swap
        let loadingData = [];

        // storing data  in files  (db?)
        const fileName = `latestData.json`;
        let lastUpdateDate = new Date(); // Default value for lastUpdateDate















        // // /// // / // // // / /// / // ----- ----- ----- ----- ----- -----
        // // /// // / // // // / /// / // ----- ----- ----- ----- ----- -----


        //error and tests 
        let testMode = true; // Test mode flag
        let throwFetchError = false;



        // // /// // / // // // / /// / // ----- ----- ----- ----- ----- -----














        // a var to keep track of retriver time 
        let imageRetrieverTimer;

        // just for server logging
        let timesSaved = 1;



        // Load generic image
        const missingPhotoBuffer = fs.readFileSync(missingPhotoPath);
        console.log("missingPhoto loaded");

        // Load the mask image
        const maskImageBuffer = fs.readFileSync(maskImagePath);
        Deputado.maskImageBuffer = maskImageBuffer;
        console.log("Mask image loaded");







        //************************************************************************************************************************
        //____server client communication






        //the app
        const app = express();

        // as soon as a client connects
        app.get('/api/start', (req, res) => {

            // Check if lista has been populated with data
            if (servingData !== null) {
                // last data retrieved is available from file
                // unless something has gone really bad... 

                // If data exists, send it as the response
                // we made a sub set of info
                const initialData = servingData.map(dep => ({
                    "id": dep?.id || null,
                    "nome": dep?.nome || null,
                    "nomeEleitoral": dep.details?.ultimoStatus?.nomeEleitoral || null,
                    "siglaPartido": dep.siglaPartido || null,
                    "siglaUf": dep?.siglaUf || null,
                    "dataNascimento": dep.details?.dataNascimento || null,
                    "imagePath": dep?.imagePath || null,
                    "municipioNascimento": dep.details?.municipioNascimento || null,
                    "escolaridade": dep.details?.escolaridade || null
                }));
                res.json({
                    "deputados": initialData,
                    "lastUpdateDate": lastUpdateDate,
                    "partidos": partidos
                });
            } else {
                // If data does not exist, send an error response
                res.status(404).json({
                    error: 'Data not available yet'
                });
            }
        });

        app.listen(port, () => {
            console.log(`depuDados app listening on port ${port}`)
        })

        // public is made public
        app.use(express.static('public'));
        //as well as /ourModules
        app.use('/ourModules', express.static(path.join(__dirname, 'modules')));












        //**********************************************************************************************************************
        //____Server's data handling 













        async function updateData() {
            // Load locally saved data and serve it right away
            // This should be a complete Deputado with: 
            // Details, UltimoEstado and gabinete e b64 image 
            // Except for the very first time of the specific code 
            console.log(`==               -                 ==`);
            console.log(`_                                   _`);
            console.log(`_                                   _`);
            console.log(`_                                   _`);
            console.log(`_             |O _ O|               _`);
            console.log(`_        Lets get some data         _`);
            console.log(`_                                  ==`);
            console.log(`==               -                 ==`);
            retries = 0;
            try {
                // Load data from files
                const thereIsData = fs.existsSync(fileName);
                const thereIsDate = fs.existsSync('lastUpdateDate.json');
                const thereIsPartidos = fs.existsSync('partidosLastData.json');

                if (thereIsData && thereIsDate && thereIsPartidos) {
                    servingData = await arrayIO.stRead(fileName);
                    partidos = await objRead('partidosLastData.json');
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
                } else {
                    console.log(`Data File is missing? ${thereIsData}\nDate File is missing? ${thereIsDate}\nPartidos File is missing? ${thereIsPartidos} `)
                }
                // is API online?
                if (testAPI()) {
                    console.log('asking API for Legislatura.')
                    //some log tickling. .. ... . .. ...
                    const timer = setInterval(() => {
                        const f = ['...', '..', '.'];
                        const i = Math.floor(Math.random() * f.length); // Generate a random index within the array length
                        console.log(f[i]);
                    }, 5000);


                    legislatura = await fetchLegislatura();
                    console.log('Legislatura fetched:', legislatura);

                    await makePartidos();
                    console.log('Partidos fetched:', partidos);

                    //
                    console.log("Getting Deputado's API data... hold on");
                    // Query Deputado's API for a list of deputados first data
                    loadingData = await makeDeputados(apiDeputados, {
                        params: {
                            itens: 100,
                        }
                    });


                    console.log("Deputado's API data loaded");

                    console.log('Getting images, takes a while');

                    // Use acquired data to query API again for image
                    // We pass the whole array to be handled
                    await getImages(loadingData);
                    console.log('Images loaded');



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

                } else {
                    console.log('API is dow, serving saved data. Will retry in half an hour');
                    clearInterval(mainTimer)
                    mainTimer = setInterval(updateData, 30 * 60 * 60 * 1000); // half an hour

                }

            } catch (error) {
                console.error('Error:', error);
            }
            clearInterval(mainTimer)
            mainTimer = setInterval(updateData, interval); // half an hour
            console.log('API is up, serving new data. Will refresh in 12 hs');
        } //<=== eof updateData()





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

                    temp.push(...dados);


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
                    let url;
                    if (deputado.id) {
                        url = `${apiDeputados}/${deputado.id}`;
                    } else {
                        console.error(`Deputado ${deputado.nome || 'unknown'} has neither ID nor name.`);
                        continue;
                    }

                    const response = await axios.get(url);
                    let d;

                    if (deputado.id) {
                        d = response.data.dados;
                    } else {
                        const fetchedDeputado = response.data.dados.find(dep => dep.nome === deputado.nome);
                        if (fetchedDeputado) {
                            deputado.id = fetchedDeputado.id;
                            url = `${apiDeputados}/${deputado.id}`;
                            const detailsResponse = await axios.get(url);
                            d = detailsResponse.data.dados;
                        } else {
                            console.error(`Deputado ${deputado.nome} details could not be found.`);
                            continue;
                        }
                    }

                    deputado.setDetails(d);
                } catch (error) {
                    console.error(`Error populating details for deputado ${deputado.nome || deputado.id}:`);
                    if (error.response) {
                        console.log(error.response.data);
                        console.log(error.response.status);
                        console.log(error.response.headers);
                    } else if (error.request) {
                        console.log(error.request);
                    } else {
                        console.log('Error', error.message);
                    }
                }
            }
        }




        async function getImages(deputados) {
            // Attempt fetching images for all deputados
            for (const deputado of deputados) {
                // Check if imageUrl is null
                if (!deputado.urlFoto) {
                    console.log(`Image URL not available for ${deputado.nome}`);
                    deputado.setMissingImage();
                    continue; // Skip to the next deputado
                }

                let url = deputado.urlFoto;

                if (deputado.id === '220593' && throwFetchError) url = deputado.urlFoto + "Fake error -  numfa";
                throwFetchError = false;

                try {

                    // Fetch the image as array buffer
                    const response = await axios.get(url, {
                        responseType: 'arraybuffer'
                    });

                    // Convert response data to Buffer
                    const imageBuffer = Buffer.from(response.data, 'binary');

                    await deputado.setImage(imageBuffer);
                } catch (error) {
                    if (error.response) {
                        // The request was made and the server responded with a status code
                        // that falls out of the range of 2xx
                        deputado.setMissingImage();
                        console.log(`Error fetching image of ${deputado.id}`);
                        console.log(error.response.status);
                        console.log(error.response.headers);
                        // console.log(error.response.statusText);
                        // console.log(error.response.config);
                    } else if (error.request) {
                        // The request was made but no response was received
                        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
                        // http.ClientRequest in node.js
                        console.log(error.request);
                    } else {
                        // Something happened in setting up the request that triggered an Error
                        console.log('Error', error.message);
                    }
                }
            }
        }


        async function retriever() {
            console.log(`|o _ o| will look for missing images or details...`);
            const missingImagesDeputados = _.filter(servingData, { 'imageB64': null });
            const missingDetailsDeputados = _.filter(servingData, dep => !dep.details);
            const missingImagesIds = missingImagesDeputados.map(item => item.id);
            const missingDetailsIds = missingDetailsDeputados.map(item => item.id);

            if (missingImagesDeputados.length > 0 || missingDetailsDeputados.length > 0 && retries < 5) {
                console.log(`there are ${missingImagesDeputados.length} missing images and ${missingDetailsDeputados.length} missing details to retrieve.`);
                console.log(`attempting to retrieve image for ids`, missingImagesIds);
                console.log(`attempting to retrieve details for ids`, missingDetailsIds);
                retries++;
                console.log(`this is retry number ${retries} of 5`)
                try {
                    await Promise.all([
                        getImages(missingImagesDeputados),
                        getDetails(missingDetailsDeputados)
                    ]);
                } catch (error) {
                    console.error('Error in retriever:', error.message);
                }
            } else if (missingImagesDeputados.length > 0 || missingDetailsDeputados.length > 0) {
                console.log(`there are ${missingImagesDeputados.length} missing images and ${missingDetailsDeputados.length} missing details to retrieve.`);
                console.log(`But the data is not available, will retry in next dataUpdate`)
                clearInterval(imageRetrieverTimer);
                console.log(lastUpdateDate.toLocaleString());
                console.log("Server walker is now resting. |- _ -|");
                const singplural = timesSaved === 1 ? 'vez' : 'vezes';
                console.log(`Dados baixados ${timesSaved++} ${singplural} desde que o servidor iniciou.`);
                return

            } else {

                console.log(`there is no missing images or details to retrieve.`);
                clearInterval(imageRetrieverTimer);
                console.log(lastUpdateDate.toLocaleString());
                console.log("Server walker is now resting. |- _ -|");
                const singplural = timesSaved === 1 ? 'vez' : 'vezes';
                console.log(`Dados baixados ${timesSaved++} ${singplural} desde que o servidor iniciou.`);
            }
            saveData();
        }



        async function saveData() {
            // Save new data to file both the array and the date
            await arrayIO.stWrite(servingData, fileName); // Write updated data to file
            await objWrite(partidos, 'partidosLastData.json'); // Write updated data to file
            lastUpdateDate = new Date(); // Update last retrieved time
            const timestamp = lastUpdateDate.getTime(); // Convert to Unix timestamp
            await fs.promises.writeFile('lastUpdateDate.json', JSON.stringify({
                timestamp
            }));
            console.log(`\ndados salvos \n`)
        }






        function getFormattedToday() {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');

            return `${year}-${month}-${day}`;
        }



        async function objWrite(data, filename) {
            const writeStream = fs.createWriteStream(filename);

            writeStream.write(JSON.stringify(data, null, 2));

            writeStream.on('finish', () => {
                console.log(`\nData as OBJ successfully written to file: ${filename}\n\n`);
            });

            writeStream.on('error', (err) => {
                console.error('Error objWriting to file:', err);
            });

            writeStream.end();
        }

        async function objRead(filename) {
            const readStream = fs.createReadStream(filename, {
                encoding: 'utf8'
            });
            let input = '';

            readStream.on('data', (chunk) => {
                input += chunk;
            });

            return new Promise((resolve, reject) => {
                readStream.on('end', () => {
                    const data = JSON.parse(input);
                    console.log(`Data has been read from OBJ ${filename}`);
                    resolve(data);
                });

                readStream.on('error', (err) => {
                    console.error('Error objReading file:', err);
                    reject(err);
                });
            });
        }



        async function main() {
            console.log('server___|- _ o|___ starting___|o _ O|___')
            try {
                await updateData();
            } catch (error) {
                console.error('Error in main:', error.toJSON());
            }
        }

        main();