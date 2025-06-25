const fs = require('fs');

// Region mappings - same as before but in a simpler class
class RegionAssigner {
    constructor() {
        this.regions = {
            // US Regions
            'US': {
                'NE': ['CT', 'DC', 'DE', 'MA', 'MD', 'ME', 'NH', 'NJ', 'NY', 'PA', 'RI', 'VA', 'VT', 'WV'],
                'SE': ['AL', 'FL', 'GA', 'KY', 'MS', 'NC', 'PR', 'SC', 'TN'],
                'MW': ['IA', 'IL', 'IN', 'KS', 'MI', 'MN', 'MO', 'ND', 'NE', 'OH', 'SD', 'WI'],
                'NW': ['AK', 'ID', 'MT', 'OR', 'WA'],
                'TE': ['AR', 'LA', 'OK', 'TX'],
                'SW': ['AZ', 'CO', 'NM', 'NV', 'UT', 'WY']
            },
            // Canada
            'CA': {
                'EC': ['NB', 'NL', 'NS', 'PE', 'QC'],
                'WC': ['BC'],
                'CB': ['AB', 'SK', 'MB'],
                'ON': ['ON', 'NU', 'NT', 'YT']
            },
            // Mexico
            'MX': {
                'MX-NO': ['Baja California Norte', 'Baja California Sur', 'Chihuahua', 'Sonora', 'Sinaloa'],
                'MX-CE': ['Aguascalientes', 'Coahuila', 'Distrito Federal', 'Durango', 'Guanajuato', 'Hidalgo', 'Jalisco', 'Mexico', 'Michoacan', 'Morelos', 'Nayarit', 'Nuevo Leon', 'Puebla', 'Queretaro', 'San Luis Potosi', 'Tamaulipas', 'Tlaxcala', 'Zacatecas'],
                'MX-SU': ['Campeche', 'Chiapas', 'Guerrero', 'Oaxaca', 'Quintana Roo', 'Tabasco', 'Veracruz', 'Yucatan']
            },
            // Japan
            'JP': {
                'JP-KA': ['Tokyo', 'Kanagawa', 'Chiba', 'Saitama', 'Gunma', 'Tochigi', 'Ibaraki'],
                'JP-KI': ['Osaka', 'Kyoto', 'Hyogo', 'Nara', 'Wakayama', 'Shiga', 'Mie'],
                'JP-CH': ['Aichi', 'Gifu', 'Shizuoka', 'Nagano', 'Yamanashi'],
                'JP-KY': ['Fukuoka', 'Kumamoto', 'Kagoshima', 'Saga', 'Nagasaki', 'Oita', 'Miyazaki'],
                'JP-TO': ['Hiroshima', 'Okayama', 'Yamaguchi', 'Shimane', 'Tottori'],
                'JP-HO': ['Hokkaido'],
                'JP-OT': ['Hitachinaka']
            },
            // South Korea
            'KO': {
                'KO-SE': ['Seoul', 'Gyeonggi Province', 'Incheon'],
                'KO-BS': ['Busan', 'Ulsan', 'Gyeongsangnam-do', 'Gyeongsangbuk-do'],
                'KO-CE': ['Daejeon', 'Daegu', 'Chungcheongnam-do', 'Chungcheongbuk-do'],
                'KO-OT': []
            },
            // Taiwan
            'TW': {
                'TW-NO': ['Taipei', 'New Taipei', 'Taoyuan', 'Hsinchu'],
                'TW-CE': ['Taichung', 'Changhua', 'Nantou'],
                'TW-SO': ['Kaohsiung', 'Tainan', 'Pingtung', 'Chiayi'],
                'TW-EA': ['Hualien', 'Taitung', 'Yilan']
            },
            // Australia
            'AU': {
                'AU-EA': ['New South Wales', 'ACT', 'Queensland'],
                'AU-SO': ['Victoria', 'Tasmania', 'South Australia'],
                'AU-WE': ['Western Australia', 'Northern Territory']
            },
            // Single region countries
            'GB': { 'UK': [] },
            'ES': { 'ES': [] },
            'FR': { 'FR': [] },
            'CH': { 'CH': [] },
            'IS': { 'IS': [] },
            'NZ': { 'NZ': [] }
        };
    }

    getRegion(country, state, city) {
        const countryRegions = this.regions[country];
        if (!countryRegions) {
            return `${country}-GE`; // Generic
        }

        // Special handling for California
        if (country === 'US' && state === 'CA') {
            return this.getCaliforniaRegion(city);
        }

        // Find region for this state
        for (const [region, states] of Object.entries(countryRegions)) {
            if (states.includes(state)) {
                return region;
            }
        }

        // Default to first region
        return Object.keys(countryRegions)[0] || `${country}-GE`;
    }

    getCaliforniaRegion(city) {
        const cityUpper = city.toUpperCase();
        
        const bayArea = ['SAN FRANCISCO', 'SAN JOSE', 'OAKLAND', 'FREMONT', 'HAYWARD', 'MOUNTAIN VIEW', 'SUNNYVALE', 'SANTA CLARA', 'FOSTER CITY', 'REDWOOD CITY', 'NOVATO', 'DANVILLE', 'LIVERMORE', 'ANTIOCH', 'CONCORD', 'FAIRFIELD', 'VACAVILLE', 'VALLEJO', 'RICHMOND', 'SAN LEANDRO', 'NEWARK', 'ROHNERT PARK'];
        
        const laArea = ['LOS ANGELES', 'BURBANK', 'NORTH HOLLYWOOD', 'HOLLYWOOD', 'ALHAMBRA', 'HAWTHORNE', 'INGLEWOOD', 'CULVER CITY', 'MARINA DEL REY', 'PACOIMA', 'NORTHRIDGE', 'VAN NUYS', 'WOODLAND HILLS', 'WESTLAKE VILLAGE', 'SANTA CLARITA', 'LANCASTER', 'PALMDALE', 'SIMI VALLEY', 'OXNARD', 'VENTURA', 'THOUSAND OAKS', 'TORRANCE', 'LAKEWOOD', 'SIGNAL HILL', 'NORWALK', 'LA HABRA', 'FULLERTON', 'GARDEN GROVE', 'CYPRESS', 'FOUNTAIN VALLEY', 'HUNTINGTON BEACH', 'SANTA ANA', 'IRVINE', 'TUSTIN', 'WESTMINSTER'];
        
        const sdArea = ['SAN DIEGO', 'CHULA VISTA', 'LA MESA', 'SANTEE', 'CARLSBAD', 'VISTA', 'SAN MARCOS', 'POWAY', 'EL CAJON', 'ESCONDIDO'];

        if (bayArea.some(city => cityUpper.includes(city))) return 'BA';
        if (laArea.some(city => cityUpper.includes(city))) return 'LA';
        if (sdArea.some(city => cityUpper.includes(city))) return 'SD';
        return 'CC'; // Central California
    }
}

function addRegionsToCSV() {
    console.log('🏪 Adding Regions to Costco Locations');
    console.log('=====================================\n');

    const assigner = new RegionAssigner();

    // Read the CSV file
    const csvContent = fs.readFileSync('costco_locations.csv', 'utf8');
    const lines = csvContent.trim().split('\n');

    console.log(`📁 Processing ${lines.length - 1} locations...`);

    // Parse header and add new columns
    const header = lines[0];
    const newHeader = header + ',Country,Region';

    console.log(`📋 Original header: ${header}`);
    console.log(`📋 New header: ${newHeader}`);

    const newLines = [newHeader];
    let processed = 0;

    // Process each data line
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines

        const parts = line.split(',');
        
        // Extract the data we need (based on your CSV structure)
        const storeName = parts[0] || '';
        const address = parts[1] || '';
        const city = parts[2] || '';
        const state = parts[3] || '';
        const zipcode = parts[4] || '';
        const phone = parts[5] || '';
        const url = parts[6] || '';

        // Determine country (default to US for existing data)
        const country = 'US';
        
        // Determine region
        const region = assigner.getRegion(country, state, city);

        // Create new line with country and region
        const newLine = line + `,${country},${region}`;
        newLines.push(newLine);

        processed++;
        
        // Show progress for first few and every 50th
        if (processed <= 5 || processed % 50 === 0) {
            console.log(`  ✅ ${processed}: ${storeName} (${city}, ${state}) → ${region}`);
        }
    }

    // Write the new file
    fs.writeFileSync('costco_locations_with_regions.csv', newLines.join('\n'));

    console.log(`\n✅ Successfully processed ${processed} locations!`);
    console.log(`📁 Output saved to: costco_locations_with_regions.csv`);

    // Generate a quick report
    generateReport(newLines);

    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Check the output file: costco_locations_with_regions.csv');
    console.log('2. If it looks good, replace your original:');
    console.log('   mv costco_locations_with_regions.csv costco_locations.csv');
    console.log('3. Then you can update your web app to use the new columns!');
}

function generateReport(dataLines) {
    console.log('\n📊 REGIONAL DISTRIBUTION REPORT');
    console.log('===============================');

    const regionCount = {};
    const countryCount = {};

    // Skip header (index 0)
    for (let i = 1; i < dataLines.length; i++) {
        const parts = dataLines[i].split(',');
        const country = parts[7]; // Country column
        const region = parts[8];  // Region column

        countryCount[country] = (countryCount[country] || 0) + 1;
        regionCount[region] = (regionCount[region] || 0) + 1;
    }

    console.log('\nBy Country:');
    Object.entries(countryCount).sort((a, b) => b[1] - a[1]).forEach(([country, count]) => {
        console.log(`  ${country}: ${count} locations`);
    });

    console.log('\nBy Region:');
    Object.entries(regionCount).sort((a, b) => b[1] - a[1]).forEach(([region, count]) => {
        console.log(`  ${region}: ${count} locations`);
    });

    console.log(`\nTotal: ${dataLines.length - 1} locations processed`);
}

// Run the script
if (require.main === module) {
    try {
        addRegionsToCSV();
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    }
}