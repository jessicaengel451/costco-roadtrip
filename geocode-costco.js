const fs = require('fs');

async function geocodeAddress(address) {
    try {
        const encodedAddress = encodeURIComponent(address);
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`;
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'CostcoTracker/1.0'
            }
        });
        
        const data = await response.json();
        
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };
        }
        return { lat: 39.8283, lng: -98.5795 };
    } catch (error) {
        console.error(`Error: ${error.message}`);
        return { lat: 39.8283, lng: -98.5795 };
    }
}

async function geocodeAll() {
    const csvData = fs.readFileSync('costco_locations.csv', 'utf8');
    const lines = csvData.trim().split('\n');
    const results = {};
    
    for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',');
        if (parts.length >= 5) {
            const fullAddress = `${parts[1]}, ${parts[2]}, ${parts[3]} ${parts[4]}`;
            console.log(`${i}/${lines.length-1}: ${parts[0]}`);
            
            results[fullAddress] = await geocodeAddress(fullAddress);
            await new Promise(r => setTimeout(r, 1000)); // 1 second delay
        }
    }
    
    fs.writeFileSync('costco_coordinates.json', JSON.stringify(results, null, 2));
    console.log('✅ Done! Created costco_coordinates.json');
}

geocodeAll();