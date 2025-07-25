/**
 * Costco CSV Merger Script with Regions - ES Module Version
 * Takes costco_locations_with_regions.csv format as the base and adds international locations 
 * from costco_store.csv in the same format with regions added
 * Format: Store Name, Address, City, State, Zipcode, Phone, URL, Country, Region
 */

import Papa from 'papaparse';
import _ from 'lodash';
import fs from 'fs';

// Region mappings for all countries
const regionMappings = {
    // United States
    'US': {
        // Northeast Region
        'NE': ['CT', 'DC', 'DE', 'MA', 'MD', 'ME', 'NH', 'NJ', 'NY', 'PA', 'RI', 'VA', 'VT', 'WV'],
        // Southeast Region  
        'SE': ['AL', 'FL', 'GA', 'KY', 'MS', 'NC', 'PR', 'SC', 'TN'],
        // Midwest Region
        'MW': ['IA', 'IL', 'IN', 'KS', 'MI', 'MN', 'MO', 'ND', 'NE', 'OH', 'SD', 'WI'],
        // Northwest Region
        'NW': ['AK', 'ID', 'MT', 'OR', 'WA'],
        // Texas Region
        'TE': ['AR', 'LA', 'OK', 'TX'],
        // California Bay Area
        'BA': ['CA-BAY'],
        // California Los Angeles
        'LA': ['CA-LA', 'HI'],
        // California San Diego  
        'SD': ['CA-SD'],
        // Southwest Region
        'SW': ['AZ', 'CO', 'NM', 'NV', 'UT', 'WY'],
        // California Central
        'CC': ['CA-OTHER']
    },
    // Canada
    'CA': {
        'EC': ['NB', 'NL', 'NS', 'PE', 'QC'], // Eastern Canada
        'WC': ['BC'], // Western Canada
        'CB': ['AB', 'SK', 'MB'], // Central Canada
        'ON': ['ON', 'NU', 'NT', 'YT'] // Ontario + territories
    },
    // Mexico
    'MX': {
        'MX-NO': ['Baja California Norte', 'Baja California Sur', 'Chihuahua', 'Sonora', 'Sinaloa'],
        'MX-CE': ['Aguascalientes', 'Coahuila', 'Distrito Federal', 'Durango', 'Guanajuato', 'Hidalgo', 
                 'Jalisco', 'Mexico', 'Michoacan', 'Morelos', 'Nayarit', 'Nuevo Leon', 'Puebla', 
                 'Queretaro', 'San Luis Potosi', 'Tamaulipas', 'Tlaxcala', 'Zacatecas'],
        'MX-SU': ['Campeche', 'Chiapas', 'Guerrero', 'Oaxaca', 'Quintana Roo', 'Tabasco', 
                 'Veracruz', 'Yucatan']
    },
    // Japan
    'JP': {
        'JP-KA': ['Tokyo', 'Kanagawa', 'Chiba', 'Saitama', 'Gunma', 'Tochigi', 'Ibaraki'],
        'JP-KI': ['Osaka', 'Kyoto', 'Hyogo', 'Nara', 'Wakayama', 'Shiga', 'Mie'],
        'JP-CH': ['Aichi', 'Gifu', 'Shizuoka', 'Nagano', 'Yamanashi'],
        'JP-KY': ['Fukuoka', 'Kumamoto', 'Kagoshima', 'Saga', 'Nagasaki', 'Oita', 'Miyazaki'],
        'JP-TO': ['Hiroshima', 'Okayama', 'Yamaguchi', 'Shimane', 'Tottori'],
        'JP-HO': ['Hokkaido']
    },
    // South Korea
    'KO': {
        'KO-SE': ['Seoul', 'Gyeonggi Province', 'Incheon'],
        'KO-BS': ['Busan', 'Ulsan', 'Gyeongsangnam-do', 'Gyeongsangbuk-do'],
        'KO-CE': ['Daejeon', 'Daegu', 'Chungcheongnam-do', 'Chungcheongbuk-do']
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
    // United Kingdom
    'GB': {
        'UK': ['England', 'Scotland', 'Wales', 'Northern Ireland']
    },
    // Spain
    'ES': {
        'ES': ['Madrid', 'Barcelona', 'Sevilla', 'Valencia']
    },
    // France  
    'FR': {
        'FR': ['Paris', 'Lyon', 'Marseille']
    },
    // Switzerland
    'CH': {
        'CH': ['Zurich', 'Geneva', 'Basel']
    },
    // Iceland
    'IS': {
        'IS': ['Kauptun', 'Reykjavik']
    },
    // New Zealand
    'NZ': {
        'NZ': ['Auckland', 'Wellington', 'Christchurch']
    }
};

// California city mappings for regions
const californiaCities = {
    'BA': [ // Bay Area
        'SAN FRANCISCO', 'SAN JOSE', 'OAKLAND', 'FREMONT', 'HAYWARD', 'MOUNTAIN VIEW',
        'SUNNYVALE', 'SANTA CLARA', 'FOSTER CITY', 'REDWOOD CITY', 'NOVATO',
        'DANVILLE', 'LIVERMORE', 'ANTIOCH', 'CONCORD', 'FAIRFIELD', 'VACAVILLE',
        'VALLEJO', 'RICHMOND', 'SAN LEANDRO', 'NEWARK', 'ROHNERT PARK'
    ],
    'LA': [ // Los Angeles Area
        'LOS ANGELES', 'BURBANK', 'NORTH HOLLYWOOD', 'HOLLYWOOD', 'ALHAMBRA',
        'HAWTHORNE', 'INGLEWOOD', 'CULVER CITY', 'MARINA DEL REY', 'PACOIMA',
        'NORTHRIDGE', 'VAN NUYS', 'WOODLAND HILLS', 'WESTLAKE VILLAGE',
        'SANTA CLARITA', 'LANCASTER', 'PALMDALE', 'SIMI VALLEY', 'OXNARD',
        'VENTURA', 'THOUSAND OAKS', 'TORRANCE', 'LAKEWOOD', 'SIGNAL HILL',
        'NORWALK', 'LA HABRA', 'FULLERTON', 'GARDEN GROVE', 'CYPRESS',
        'FOUNTAIN VALLEY', 'HUNTINGTON BEACH', 'SANTA ANA', 'IRVINE',
        'TUSTIN', 'WESTMINSTER'
    ],
    'SD': [ // San Diego Area
        'SAN DIEGO', 'CHULA VISTA', 'LA MESA', 'SANTEE', 'CARLSBAD',
        'VISTA', 'SAN MARCOS', 'POWAY', 'EL CAJON', 'ESCONDIDO'
    ]
};

// Determine region for a location
function determineRegion(country, state, city = '') {
    const countryMappings = regionMappings[country];
    if (!countryMappings) {
        return `${country}-GE`; // Generic region for unmapped countries
    }

    // Special handling for California (US)
    if (country === 'US' && state === 'CA') {
        return determineCaliforniaRegion(city);
    }

    // Find region for this state/province
    for (const [region, states] of Object.entries(countryMappings)) {
        if (states.includes(state)) {
            return region;
        }
    }

    // Default to first region if state not found
    const regions = Object.keys(countryMappings);
    return regions[0] || `${country}-GE`;
}

// Special handling for California regions
function determineCaliforniaRegion(city) {
    const cityUpper = city.toUpperCase();

    for (const [region, cities] of Object.entries(californiaCities)) {
        if (cities.some(c => cityUpper.includes(c))) {
            return region;
        }
    }

    return 'CC'; // Central California for other locations
}

async function mergeCostcoData() {
    try {
        console.log('=== Costco Location Merger with Regions ===\n');
        console.log('Starting Costco data merge...');

        // ===== FILE CONFIGURATION =====
        const STORE_FILE = 'costco_store.csv';           // International store data file
        const LOCATIONS_FILE = 'costco_locations_with_regions.csv';   // US locations data file with regions
        const OUTPUT_FILE = 'merged_costco_locations.csv'; // Output filename
        // ==============================
        
        // Read both CSV files
        console.log(`\nReading ${STORE_FILE}...`);
        const storeData = fs.readFileSync(STORE_FILE, 'utf8');
        const parsedStoreData = Papa.parse(storeData, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            delimitersToGuess: [',', '\t', '|', ';']
        });

        console.log(`Reading ${LOCATIONS_FILE}...`);
        const locationsData = fs.readFileSync(LOCATIONS_FILE, 'utf8');
        const parsedLocationsData = Papa.parse(locationsData, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            delimitersToGuess: [',', '\t', '|', ';']
        });

        console.log(`\nLoaded ${parsedStoreData.data.length} records from ${STORE_FILE}`);
        console.log(`Loaded ${parsedLocationsData.data.length} records from ${LOCATIONS_FILE}`);

        // Keep costco_locations_with_regions.csv data as-is (this will be our base format)
        const baseLocations = parsedLocationsData.data.map(row => ({
            'Store Name': String(row['Store Name'] || '').trim(),
            'Address': String(row['Address'] || '').trim(),
            'City': String(row['City'] || '').trim(),
            'State': String(row['State'] || '').trim(),
            'Zipcode': String(row['Zipcode'] || '').trim(),
            'Phone': String(row['Phone'] || '').trim(),
            'URL': String(row['URL'] || '').trim(),
            'Country': String(row['Country'] || 'US').trim(),
            'Region': String(row['Region'] || '').trim()
        }));

        // Transform costco_store.csv data to match the format
        const transformedStores = parsedStoreData.data.map(row => {
            const country = String(row.country || '').trim();
            const state = String(row.state || '').trim();
            const city = String(row.city || '').trim();
            
            // Determine region based on country, state, and city
            let region = String(row.region_code || '').trim();
            if (!region || region === 'NULL') {
                region = determineRegion(country, state, city);
            }

            return {
                'Store Name': String(row.loc_name || row.city || '').trim(),
                'Address': String(row.address_1 || '').trim(),
                'City': city,
                'State': country === 'US' ? state : country, // Use country as "state" for international
                'Zipcode': String(row.postal_code || '').trim(),
                'Phone': String(row.phone || '').trim(),
                'URL': '', // Original store data doesn't have URLs
                'Country': country,
                'Region': region
            };
        });

        // Create a deduplication key for matching locations
        function createLocationKey(row) {
            const address = (row['Address'] || '').toString().trim().toUpperCase().replace(/\s+/g, ' ');
            const city = (row['City'] || '').toString().trim().toUpperCase();
            
            // Use address + city as the unique key since addresses match exactly
            return `${address}|${city}`;
        }

        // Find duplicates between the datasets
        console.log('\nChecking for duplicates...');
        const locationKeys = new Set(baseLocations.map(createLocationKey));
        
        // Debug: Show some example keys
        console.log('Sample existing location keys:');
        [...locationKeys].slice(0, 3).forEach(key => console.log(`  ${key}`));
        
        const duplicates = [];
        const uniqueStores = transformedStores.filter(store => {
            const key = createLocationKey(store);
            if (locationKeys.has(key)) {
                duplicates.push({
                    name: store['Store Name'],
                    city: store['City'],
                    country: store['Country'],
                    key: key
                });
                return false;
            }
            return true;
        });
        
        if (duplicates.length > 0) {
            console.log(`\nFound ${duplicates.length} duplicate locations:`);
            duplicates.slice(0, 5).forEach(dup => {
                console.log(`  - ${dup.name} in ${dup.city}, ${dup.country}`);
            });
            if (duplicates.length > 5) {
                console.log(`  ... and ${duplicates.length - 5} more`);
            }
        }

        console.log(`\nFound ${duplicates.length} duplicate locations`);
        console.log(`Will add ${uniqueStores.length} new locations`);

        // Filter to only non-US locations from costco_store.csv
        const internationalStores = uniqueStores.filter(store => store['Country'] !== 'US');
        console.log(`Filtering to ${internationalStores.length} international locations only`);

        // IMPORTANT: Append new locations to the END of the existing locations
        const combinedData = [...baseLocations, ...internationalStores];

        // Generate CSV output
        console.log('\nGenerating CSV output...');
        const csvOutput = Papa.unparse(combinedData, {
            header: true,
            delimiter: ',',
            newline: '\n'
        });

        // Display summary statistics
        const countryStats = _.countBy(combinedData, 'Country');
        const regionStats = _.countBy(combinedData, 'Region');
        
        console.log('\n=== MERGE SUMMARY ===');
        console.log(`Total locations: ${combinedData.length}`);
        console.log(`  - Original locations: ${baseLocations.length}`);
        console.log(`  - Total stores from ${STORE_FILE}: ${transformedStores.length}`);
        console.log(`  - Duplicates found: ${duplicates.length}`);
        console.log(`  - US locations filtered out: ${uniqueStores.length - internationalStores.length}`);
        console.log(`  - New international locations added: ${internationalStores.length}`);
        
        console.log('\nLocations by country:');
        Object.entries(countryStats)
            .sort(([,a], [,b]) => b - a)
            .forEach(([country, count]) => {
                console.log(`  ${country}: ${count}`);
            });

        console.log('\nLocations by region (top 15):');
        Object.entries(regionStats)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 15)
            .forEach(([region, count]) => {
                console.log(`  ${region}: ${count}`);
            });

        // Save the merged data
        console.log(`\nSaving merged data to ${OUTPUT_FILE}...`);
        fs.writeFileSync(OUTPUT_FILE, csvOutput, 'utf8');
        console.log(`✅ File saved successfully!`);
        console.log(`📝 New locations have been appended to the end of the file.`);
        console.log(`📊 All locations include Country and Region fields.`);

        return {
            success: true,
            totalLocations: combinedData.length,
            originalLocations: baseLocations.length,
            newLocationsAdded: uniqueStores.length,
            duplicatesRemoved: transformedStores.length - uniqueStores.length,
            outputFilename: OUTPUT_FILE
        };

    } catch (error) {
        console.error('\n❌ Error merging Costco data:', error.message);
        if (error.code === 'ENOENT') {
            console.error('File not found! Make sure both CSV files exist in the current directory.');
            console.error('Required files:');
            console.error('  - costco_locations_with_regions.csv');
            console.error('  - costco_store.csv');
        }
        console.error('Stack trace:', error.stack);
        return { success: false, error: error.message };
    }
}

// Run the merge function immediately
mergeCostcoData().then(result => {
    if (result.success) {
        console.log('\n✅ Merge completed successfully!');
        console.log(`📁 Check ${result.outputFilename} for the merged data.`);
    } else {
        console.log('\n❌ Merge failed:', result.error);
    }
}).catch(error => {
    console.error('\n❌ Unexpected error:', error);
    console.error('Stack trace:', error.stack);
});