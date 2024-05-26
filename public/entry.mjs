import runP5 from './globalP5.mjs';


export let deputados = [];
export let lastUpdate = '';
export let initialData = []



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
            console.error('There was a problem initializinfg the client:', error);
        });

}
//call it
getInitialData();