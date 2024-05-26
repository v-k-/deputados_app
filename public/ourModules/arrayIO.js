 const fs = require('fs');


 // stringfying by obj to be light on memory
 // stupid early otimization...

 async function stWrite(array, filename) {
    // Create a writable stream to write data to the file
    const writeStream = fs.createWriteStream(filename);

    writeStream.write('[');

    // Iterate over each object in the array and write it to the file
    array.forEach((deputy, index) => {
        // Add comma for all but the first object
        const comma = index === 0 ? '' : ',';
        // write it with deputy
        writeStream.write(`${comma}${JSON.stringify(deputy)}`);
    }); //eof forEach

    // Write the closing bracket of the JSON array
    writeStream.write(']');

    // Event listener for when writing is completed
    writeStream.on('finish', () => {
        console.log(`\nData successfully written to file: ${filename}\n\n`);
    });

    // Event listener for any errors during writing
    writeStream.on('error', (err) => {
        console.error('Error writing to file:', err);
    });

    // Close the stream
    writeStream.end();
}


 async function stRead(filename) { // Create a readable stream to read data from the file
     const readStream = fs.createReadStream(filename, {
         encoding: 'utf8'
     });
     let input = '';

     // Event handlers for stream events
     readStream.on('data', (chunk) => {
         input += chunk;
     });

     return new Promise((resolve, reject) => {
         readStream.on('end', () => {
             // Parse the JSON data
             const newArray = JSON.parse(input);
             console.log(`Data has been read from ${filename}`);
             // console.log(input);
             resolve(newArray);
         });

         readStream.on('error', (err) => {
             console.error('Error reading file:', err);
             reject(err);
         });
     });
 }


 module.exports = {
     stWrite,
     stRead

 };