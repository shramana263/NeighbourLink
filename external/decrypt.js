import fs from 'node:fs/promises';

function unpack(splash) {
    var n = 65;
    var a = splash.substring(0, 2*n);
    var b = splash.substring(2*n);
    var m = [];
    for(var i = 0; i < n; i++)
        m[a[2*i+1]] = a[2*i];
    var s = '';
    for (var i = 0; i < b.length; i++)
        s += m[b[i]];
    return JSON.parse(atob(s));
}

async function decryptPandalData() {
    try {
        // Read the encrypted data
        const data = await fs.readFile('./pandalData.json', 'utf8');
        const jsonData = JSON.parse(data);
        
        if (!jsonData.raw) {
            console.error('No raw data found in the file');
            return;
        }
        
        // Decrypt the data
        const decryptedData = unpack(jsonData.raw);
        
        // Save the decrypted data
        await fs.writeFile('./pandalData_decrypted.json', JSON.stringify(decryptedData, null, 2), 'utf8');
        
        console.log('Successfully decrypted data and saved to pandalData_decrypted.json');
        console.log('Preview of decrypted data:');
        console.log(JSON.stringify(decryptedData, null, 2).substring(0, 500) + '...');
        
    } catch (error) {
        console.error('Error decrypting data:', error);
    }
}

// Run the decryption
decryptPandalData();