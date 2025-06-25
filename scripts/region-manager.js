const fs = require('fs');

class CostcoRegionalManager {
    constructor() {
        this.regionMappings = this.initializeRegionMappings();
    }

    // Initialize comprehensive region mappings for all countries
    initializeRegionMappings() {
        return {
            // United States - Based on existing data + geographic logic
            'US': {
                // Northeast Region
                'NE': ['CT', 'DC', 'DE', 'MA', 'MD', 'ME', 'NH', 'NJ', 'NY', 'PA', 'RI', 'VA', 'VT', 'WV'],
                
                // Southeast Region  
                'SE': ['AL', 'FL', 'GA', 'KY', 'MS', 'NC', 'PR', 'SC', 'TN'],
                
                // Midwest Region
                'MW': ['IA', 'IL', 'IN', 'KS', 'MI', 'MN', 'MO', 'ND', 'NE', 'OH', 'SD', 'WI'],
                
                // Northwest Region
                'NW': ['AK', 'ID', 'MT', 'OR', 'WA'],
                
                // Texas Region (large state gets its own)
                'TE': ['AR', 'LA', 'OK', 'TX'],
                
                // California Bay Area
                'BA': ['CA-BAY'], // Special handling for Bay Area cities
                
                // California Los Angeles
                'LA': ['CA-LA', 'HI'], // LA area + Hawaii (Pacific)
                
                // California San Diego  
                'SD': ['CA-SD'], // San Diego area
                
                // Southwest Region
                'SW': ['AZ', 'CO', 'NM', 'NV', 'UT', 'WY'], // Added WY, consolidated Southwest
                
                // California Central (new for remaining CA)
                'CC': ['CA-OTHER'] // Other California locations
            },

            // Canada - By geographic regions
            'CA': {
                'EC': ['NB', 'NL', 'NS', 'PE', 'QC'], // Eastern Canada (existing)
                'WC': ['BC'], // Western Canada (existing) 
                'CB': ['AB', 'SK', 'MB'], // Central Canada (existing + expanded)
                'ON': ['ON', 'NU', 'NT', 'YT'] // Ontario + territories
            },

            // Mexico - By geographic regions
            'MX': {
                'MX-NO': ['Baja California Norte', 'Baja California Sur', 'Chihuahua', 'Sonora', 'Sinaloa'], // North
                'MX-CE': ['Aguascalientes', 'Coahuila', 'Distrito Federal', 'Durango', 'Guanajuato', 'Hidalgo', 
                         'Jalisco', 'Mexico', 'Michoacan', 'Morelos', 'Nayarit', 'Nuevo Leon', 'Puebla', 
                         'Queretaro', 'San Luis Potosi', 'Tamaulipas', 'Tlaxcala', 'Zacatecas'], // Central
                'MX-SU': ['Campeche', 'Chiapas', 'Guerrero', 'Oaxaca', 'Quintana Roo', 'Tabasco', 
                         'Veracruz', 'Yucatan'] // South
            },

            // Japan - By regions (traditional Japanese regions)
            'JP': {
                'JP-KA': ['Tokyo', 'Kanagawa', 'Chiba', 'Saitama', 'Gunma', 'Tochigi', 'Ibaraki'], // Kanto
                'JP-KI': ['Osaka', 'Kyoto', 'Hyogo', 'Nara', 'Wakayama', 'Shiga', 'Mie'], // Kansai
                'JP-CH': ['Aichi', 'Gifu', 'Shizuoka', 'Nagano', 'Yamanashi'], // Chubu
                'JP-KY': ['Fukuoka', 'Kumamoto', 'Kagoshima', 'Saga', 'Nagasaki', 'Oita', 'Miyazaki'], // Kyushu
                'JP-TO': ['Hiroshima', 'Okayama', 'Yamaguchi', 'Shimane', 'Tottori'], // Tohoku/Chugoku
                'JP-HO': ['Hokkaido'], // Hokkaido
                'JP-OT': [] // Other/Hitachinaka etc.
            },

            // South Korea - By regions
            'KO': {
                'KO-SE': ['Seoul', 'Gyeonggi Province', 'Incheon'], // Seoul Metro
                'KO-BS': ['Busan', 'Ulsan', 'Gyeongsangnam-do', 'Gyeongsangbuk-do'], // Busan/Southeast
                'KO-CE': ['Daejeon', 'Daegu', 'Chungcheongnam-do', 'Chungcheongbuk-do'], // Central
                'KO-OT': [] // Other regions
            },

            // Taiwan - By regions
            'TW': {
                'TW-NO': ['Taipei', 'New Taipei', 'Taoyuan', 'Hsinchu'], // North
                'TW-CE': ['Taichung', 'Changhua', 'Nantou'], // Central  
                'TW-SO': ['Kaohsiung', 'Tainan', 'Pingtung', 'Chiayi'], // South
                'TW-EA': ['Hualien', 'Taitung', 'Yilan'] // East
            },

            // Australia - By states/territories
            'AU': {
                'AU-EA': ['New South Wales', 'ACT', 'Queensland'], // East
                'AU-SO': ['Victoria', 'Tasmania', 'South Australia'], // South  
                'AU-WE': ['Western Australia', 'Northern Territory'] // West
            },

            // United Kingdom
            'GB': {
                'UK': ['England', 'Scotland', 'Wales', 'Northern Ireland'] // All UK
            },

            // Spain
            'ES': {
                'ES': ['Madrid', 'Barcelona', 'Sevilla', 'Valencia'] // All Spain
            },

            // France  
            'FR': {
                'FR': ['Paris', 'Lyon', 'Marseille'] // All France
            },

            // Switzerland
            'CH': {
                'CH': ['Zurich', 'Geneva', 'Basel'] // All Switzerland
            },

            // Iceland
            'IS': {
                'IS': ['Kauptun', 'Reykjavik'] // All Iceland
            },

            // New Zealand
            'NZ': {
                'NZ': ['Auckland', 'Wellington', 'Christchurch'] // All New Zealand
            }
        };
    }

    // Determine region for a location
    determineRegion(country, state, city = '') {
        const countryMappings = this.regionMappings[country];
        if (!countryMappings) {
            return `${country}-GE`; // Generic region for unmapped countries
        }

        // Special handling for California (US)
        if (country === 'US' && state === 'CA') {
            return this.determineCalifornia Region(city);
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
    determineCaliforniaRegion(city) {
        const bayAreaCities = [
            'SAN FRANCISCO', 'SAN JOSE', 'OAKLAND', 'FREMONT', 'HAYWARD', 'MOUNTAIN VIEW',
            'SUNNYVALE', 'SANTA CLARA', 'FOSTER CITY', 'REDWOOD CITY', 'NOVATO',
            'DANVILLE', 'LIVERMORE', 'ANTIOCH', 'CONCORD', 'FAIRFIELD', 'VACAVILLE',
            'VALLEJO', 'RICHMOND', 'SAN LEANDRO', 'NEWARK', 'ROHNERT PARK'
        ];

        const laAreaCities = [
            'LOS ANGELES', 'BURBANK', 'NORTH HOLLYWOOD', 'HOLLYWOOD', 'ALHAMBRA',
            'HAWTHORNE', 'INGLEWOOD', 'CULVER CITY', 'MARINA DEL REY', 'PACOIMA',
            'NORTHRIDGE', 'VAN NUYS', 'WOODLAND HILLS', 'WESTLAKE VILLAGE',
            'SANTA CLARITA', 'LANCASTER', 'PALMDALE', 'SIMI VALLEY', 'OXNARD',
            'VENTURA', 'THOUSAND OAKS', 'TORRANCE', 'LAKEWOOD', 'SIGNAL HILL',
            'NORWALK', 'LA HABRA', 'FULLERTON', 'GARDEN GROVE', 'CYPRESS',
            'FOUNTAIN VALLEY', 'HUNTINGTON BEACH', 'SANTA ANA', 'IRVINE',
            'TUSTIN', 'WESTMINSTER'
        ];

        const sdAreaCities = [
            'SAN DIEGO', 'CHULA VISTA', 'LA MESA', 'SANTEE', 'CARLSBAD',
            'VISTA', 'SAN MARCOS', 'POWAY', 'EL CAJON', 'ESCONDIDO'
        ];

        const cityUpper = city.toUpperCase();

        if (bayAreaCities.some(baCity => cityUpper.includes(baCity))) {
            return 'BA';
        } else if (laAreaCities.some(laCity => cityUpper.includes(laCity))) {
            return 'LA';
        } else if (sdAreaCities.some(sdCity => cityUpper.includes(sdCity))) {
            return 'SD';
        } else {
            return 'CC'; // Central California for other locations
        }
    }

    // Process a CSV file and add regions
    async processCSVWithRegions(inputFile = 'costco_store.csv', outputFile = 'costco_store_with_regions.csv') {
        console.log('🏪 Processing Costco locations to add regional assignments...');
        
        // Read and parse CSV
        const csvContent = fs.readFileSync(inputFile, 'utf8');
        const lines = csvContent.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

        // Find indices
        const countryIdx = headers.indexOf('country');
        const stateIdx = headers.indexOf('state');
        const cityIdx = headers.indexOf('city');
        const regionIdx = headers.indexOf('region_code');

        if (countryIdx === -1 || stateIdx === -1 || regionIdx === -1) {
            throw new Error('Required columns (country, state, region_code) not found');
        }

        const processedLines = [lines[0]]; // Keep header
        let updated = 0;
        let alreadyHadRegion = 0;

        // Process each data line
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            const fields = this.parseCSVLine(line);
            
            const country = fields[countryIdx]?.replace(/"/g, '') || '';
            const state = fields[stateIdx]?.replace(/"/g, '') || '';
            const city = fields[cityIdx]?.replace(/"/g, '') || '';
            const currentRegion = fields[regionIdx]?.replace(/"/g, '') || '';

            // Only update if region is NULL or empty
            if (!currentRegion || currentRegion === 'NULL' || currentRegion.trim() === '') {
                const newRegion = this.determineRegion(country, state, city);
                fields[regionIdx] = `"${newRegion}"`;
                updated++;
            } else {
                alreadyHadRegion++;
            }

            // Reconstruct line
            processedLines.push(fields.join(','));
        }

        // Write output file
        fs.writeFileSync(outputFile, processedLines.join('\n'));

        console.log(`✅ Processing complete!`);
        console.log(`   Updated: ${updated} locations`);
        console.log(`   Already had regions: ${alreadyHadRegion} locations`);
        console.log(`   Output file: ${outputFile}`);

        return { updated, alreadyHadRegion };
    }

    // Simple CSV line parser
    parseCSVLine(line) {
        const fields = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
                current += char;
            } else if (char === ',' && !inQuotes) {
                fields.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        fields.push(current);

        return fields;
    }

    // Generate region report
    generateRegionReport(inputFile = 'costco_store.csv') {
        console.log('📊 COSTCO REGIONAL DISTRIBUTION REPORT');
        console.log('======================================');

        const csvContent = fs.readFileSync(inputFile, 'utf8');
        const lines = csvContent.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

        const countryIdx = headers.indexOf('country');
        const stateIdx = headers.indexOf('state');
        const regionIdx = headers.indexOf('region_code');
        const cityIdx = headers.indexOf('city');

        const regionStats = {};
        const countryStats = {};

        for (let i = 1; i < lines.length; i++) {
            const fields = this.parseCSVLine(lines[i]);
            const country = fields[countryIdx]?.replace(/"/g, '') || 'Unknown';
            const state = fields[stateIdx]?.replace(/"/g, '') || 'Unknown';
            const region = fields[regionIdx]?.replace(/"/g, '') || 'NULL';
            const city = fields[cityIdx]?.replace(/"/g, '') || 'Unknown';

            // Count by country
            countryStats[country] = (countryStats[country] || 0) + 1;

            // Count by region
            if (!regionStats[country]) {
                regionStats[country] = {};
            }
            regionStats[country][region] = (regionStats[country][region] || 0) + 1;
        }

        // Display results
        console.log('\nLOCATIONS BY COUNTRY:');
        Object.entries(countryStats).sort((a, b) => b[1] - a[1]).forEach(([country, count]) => {
            console.log(`  ${country}: ${count} locations`);
        });

        console.log('\nREGIONAL BREAKDOWN:');
        Object.entries(regionStats).forEach(([country, regions]) => {
            console.log(`\n${country}:`);
            Object.entries(regions).sort((a, b) => b[1] - a[1]).forEach(([region, count]) => {
                const regionName = this.getRegionName(country, region);
                console.log(`  ${region} (${regionName}): ${count} locations`);
            });
        });

        return { countryStats, regionStats };
    }

    // Get human-readable region name
    getRegionName(country, regionCode) {
        const regionNames = {
            'US': {
                'NE': 'Northeast',
                'SE': 'Southeast', 
                'MW': 'Midwest',
                'NW': 'Northwest',
                'TE': 'Texas',
                'BA': 'Bay Area',
                'LA': 'Los Angeles',
                'SD': 'San Diego',
                'SW': 'Southwest',
                'CC': 'Central California',
                'BD': 'Business Development'
            },
            'CA': {
                'EC': 'Eastern Canada',
                'WC': 'Western Canada',
                'CB': 'Central Canada',
                'ON': 'Ontario & Territories'
            },
            'MX': {
                'MX-NO': 'Northern Mexico',
                'MX-CE': 'Central Mexico',
                'MX-SU': 'Southern Mexico'
            },
            'JP': {
                'JP-KA': 'Kanto Region',
                'JP-KI': 'Kansai Region',
                'JP-CH': 'Chubu Region',
                'JP-KY': 'Kyushu Region',
                'JP-TO': 'Tohoku/Chugoku',
                'JP-HO': 'Hokkaido',
                'JP-OT': 'Other Regions'
            },
            'KO': {
                'KO-SE': 'Seoul Metro',
                'KO-BS': 'Busan/Southeast',
                'KO-CE': 'Central Korea',
                'KO-OT': 'Other Regions'
            },
            'TW': {
                'TW-NO': 'Northern Taiwan',
                'TW-CE': 'Central Taiwan',
                'TW-SO': 'Southern Taiwan',
                'TW-EA': 'Eastern Taiwan'
            },
            'AU': {
                'AU-EA': 'Eastern Australia',
                'AU-SO': 'Southern Australia',
                'AU-WE': 'Western Australia'
            }
        };

        return regionNames[country]?.[regionCode] || regionCode;
    }

    // Validate region assignments
    validateRegions(inputFile = 'costco_store.csv') {
        console.log('🔍 VALIDATING REGIONAL ASSIGNMENTS');
        console.log('==================================');

        const csvContent = fs.readFileSync(inputFile, 'utf8');
        const lines = csvContent.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

        const countryIdx = headers.indexOf('country');
        const stateIdx = headers.indexOf('state');
        const regionIdx = headers.indexOf('region_code');
        const cityIdx = headers.indexOf('city');
        const nameIdx = headers.indexOf('loc_name');

        const issues = [];
        let validated = 0;

        for (let i = 1; i < lines.length; i++) {
            const fields = this.parseCSVLine(lines[i]);
            const country = fields[countryIdx]?.replace(/"/g, '') || '';
            const state = fields[stateIdx]?.replace(/"/g, '') || '';
            const region = fields[regionIdx]?.replace(/"/g, '') || '';
            const city = fields[cityIdx]?.replace(/"/g, '') || '';
            const name = fields[nameIdx]?.replace(/"/g, '') || '';

            // Check if region is still NULL
            if (!region || region === 'NULL' || region.trim() === '') {
                issues.push({
                    type: 'NULL_REGION',
                    location: name,
                    country: country,
                    state: state,
                    city: city,
                    line: i + 1
                });
                continue;
            }

            // Validate region exists for this country
            const expectedRegion = this.determineRegion(country, state, city);
            if (region !== expectedRegion) {
                issues.push({
                    type: 'REGION_MISMATCH',
                    location: name,
                    country: country,
                    state: state,
                    city: city,
                    currentRegion: region,
                    expectedRegion: expectedRegion,
                    line: i + 1
                });
            } else {
                validated++;
            }
        }

        console.log(`✅ Validated: ${validated} locations`);
        console.log(`⚠️  Issues found: ${issues.length}`);

        if (issues.length > 0) {
            console.log('\nISSUES DETECTED:');
            issues.forEach((issue, index) => {
                if (index < 10) { // Show first 10 issues
                    if (issue.type === 'NULL_REGION') {
                        console.log(`  ${issue.line}: ${issue.location} (${issue.city}, ${issue.state}, ${issue.country}) - Missing region`);
                    } else {
                        console.log(`  ${issue.line}: ${issue.location} - Region "${issue.currentRegion}" should be "${issue.expectedRegion}"`);
                    }
                }
            });
            if (issues.length > 10) {
                console.log(`  ... and ${issues.length - 10} more issues`);
            }
        }

        return issues;
    }

    // Create region mapping reference
    createRegionReference() {
        console.log('📋 COSTCO REGIONAL REFERENCE GUIDE');
        console.log('===================================');

        Object.entries(this.regionMappings).forEach(([country, regions]) => {
            console.log(`\n${country}:`);
            Object.entries(regions).forEach(([regionCode, states]) => {
                const regionName = this.getRegionName(country, regionCode);
                console.log(`  ${regionCode} - ${regionName}`);
                if (states.length > 0) {
                    console.log(`    States/Provinces: ${states.join(', ')}`);
                }
            });
        });
    }
}

// Usage examples and main function
async function main() {
    const manager = new CostcoRegionalManager();

    try {
        console.log('🏪 Costco Regional Management System');
        console.log('====================================\n');

        // Show current region mappings
        manager.createRegionReference();

        // Generate current report
        console.log('\n' + '='.repeat(50));
        manager.generateRegionReport();

        // Validate current assignments
        console.log('\n' + '='.repeat(50));
        const issues = manager.validateRegions();

        // Process file to add missing regions
        if (issues.some(issue => issue.type === 'NULL_REGION')) {
            console.log('\n' + '='.repeat(50));
            console.log('🔧 FIXING NULL REGIONS');
            console.log('======================');
            
            await manager.processCSVWithRegions();
            
            console.log('\n✅ Region assignment complete!');
            console.log('📝 Next steps:');
            console.log('1. Review costco_store_with_regions.csv');
            console.log('2. Replace original file if satisfied');
            console.log('3. Update your location management scripts');
        } else {
            console.log('\n✅ All regions properly assigned!');
        }

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

// Export for use as module
module.exports = CostcoRegionalManager;

// Run if called directly
if (require.main === module) {
    main();
}