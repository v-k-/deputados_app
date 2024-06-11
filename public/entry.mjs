import runP5 from './globalP5.mjs';


export let partidos  = [];
export let formattedDateTime= '';
export let initialDepData = []



// == == == == == 
function getInitialData() {
    axios.get('/api/start')
        .then(response => {
            // Handle success
            console.log('Data received from server:');
            initialDepData = response.data.deputados
            partidos = response.data.deputados

            console.log("Hereby", initialDepData);
            const lastUpdateDate = new Date(response.data.lastUpdateDate);
            console.log(lastUpdateDate)
            const formattedDate = lastUpdateDate.toLocaleDateString(undefined, {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit'
            });
            const formattedTime = lastUpdateDate.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            formattedDateTime = `${formattedDate} as ${formattedTime}`;
            console.log(formattedDateTime)
            document.getElementById('ultima').textContent = `dados atualizados em: ${formattedDateTime}`
            runP5();

        })
        .catch(error => {
            // Handle error
            console.error('There was a problem initializinfg the client:', error);
        });

}
//call it
getInitialData();