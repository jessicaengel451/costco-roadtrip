import fs from 'fs';
import readline from 'readline';
import { exec } from 'child_process';

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Constants
const FALLBACK_LAT = 39.8283;
const FALLBACK_LNG = -98.5795;
const PROGRESS_FILE = 'coordinate_fix_progress.json';

// Function to create Google Maps URL
function createGoogleMapsUrl(address) {
    const encodedAddress = encodeURIComponent(address);
    return `https://www.google.com/maps/search/${encodedAddress}`;
}

// Function to open URL in default browser
function openBrowser(url) {
    const platform = process.platform;
    let command;
    
    if (platform === 'darwin') {
        command = `open "${url}"`;
    } else if (platform === 'win32') {
        command = `start "" "${url}"`;
    } else {
        command = `xdg-open "${url}"`;
    }
    
    exec(command, (error) => {
        if (error) {
            console.log(`❌ Could not open browser. Please manually visit: ${url}`);
        }
    });
}

// Function to validate coordinates
function validateCoordinates(lat, lng) {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    
    if (isNaN(latNum) || isNaN(lngNum)) {
        return { valid: false, error: "Invalid numbers" };
    }
    
    if (latNum < -90 || latNum > 90) {
        return { valid: false, error: "Latitude must be between -90 and 90" };
    }
    
    if (lngNum < -180 || lngNum > 180) {
        return { valid: false, error: "Longitude must be between -180 and 180" };
    }
    
    if (latNum === FALLBACK_LAT && lngNum === FALLBACK_LNG) {
        return { valid: false, error: "These are the fallback coordinates - please find the real ones" };
    }
    
    return { valid: true, lat: latNum, lng: lngNum };
}

// Function to parse coordinate input
function parseCoordinateInput(input) {
    input = input.trim();
    input = input.replace(/^(lat:|latitude:|lng:|longitude:|lon:)/gi, '').trim();
    
    const parts = input.split(/[,\s]+/).filter(part => part.length > 0);
    
    if (parts.length >= 2) {
        return {
            lat: parts[0],
            lng: parts[1]
        };
    }
    
    return null;
}

// Function to find most recent backup files
function findBackupFiles() {
    try {
        const files = fs.readdirSync('.');
        const backupFiles = files.filter(file => 
            file.startsWith('costco_coordinates_progress_') && 
            file.endsWith('.json')
        ).sort().reverse();

        return backupFiles;
    } catch (error) {
        return [];
    }
}

// Function to count fixed coordinates
function countFixedCoordinates(coordinatesData) {
    let fixedCount = 0;
    for (const [address, coords] of Object.entries(coordinatesData)) {
        if (coords.lat !== FALLBACK_LAT || coords.lng !== FALLBACK_LNG) {
            fixedCount++;
        }
    }
    return fixedCount;
}

// Function to load progress
function loadProgress() {
    try {
        if (fs.existsSync(PROGRESS_FILE)) {
            return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
        }
    } catch (error) {
        console.log('⚠️  Could not load progress file');
    }
    return null;
}

// Function to save progress
function saveProgress(progress) {
    try {
        fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
    } catch (error) {
        console.log('⚠️  Could not save progress file');
    }
}

// Function to ask about loading backup files
function askAboutBackupFiles(backupFiles) {
    return new Promise((resolve) => {
        if (backupFiles.length === 0) {
            resolve({ action: 'load_original' });
            return;
        }

        console.log('\n💾 BACKUP FILES FOUND');
        console.log('=====================');
        console.log(`Found ${backupFiles.length} backup file(s) from previous sessions:`);
        console.log('');

        backupFiles.forEach((file, index) => {
            try {
                const backupData = JSON.parse(fs.readFileSync(file, 'utf8'));
                const fixedCount = countFixedCoordinates(backupData);
                const totalCount = Object.keys(backupData).length;
                const timestamp = file.replace('costco_coordinates_progress_', '').replace('.json', '').replace(/-/g, ':').replace('T', ' ');
                
                console.log(`  ${index + 1}. ${file}`);
                console.log(`     Created: ${timestamp}`);
                console.log(`     Progress: ${fixedCount}/${totalCount} fixed (${((fixedCount/totalCount)*100).toFixed(1)}%)`);
                console.log('');
            } catch (e) {
                console.log(`  ${index + 1}. ${file} (could not read)`);
            }
        });

        console.log(`  ${backupFiles.length + 1}. Load original costco_coordinates.json (start fresh)`);
        console.log('');

        function promptForChoice() {
            rl.question(`🎯 Choose file to load (1-${backupFiles.length + 1}): `, (input) => {
                const choice = parseInt(input);
                
                if (choice >= 1 && choice <= backupFiles.length) {
                    const selectedFile = backupFiles[choice - 1];
                    console.log(`✅ Loading backup: ${selectedFile}`);
                    resolve({ action: 'load_backup', filename: selectedFile });
                } else if (choice === backupFiles.length + 1) {
                    console.log('✅ Loading original costco_coordinates.json');
                    resolve({ action: 'load_original' });
                } else {
                    console.log('❌ Invalid choice. Please try again.');
                    promptForChoice();
                }
            });
        }

        promptForChoice();
    });
}

// Function to ask about resuming progress
function askAboutProgress(existingProgress, remainingCount) {
    return new Promise((resolve) => {
        console.log('\n🔄 RESUME PREVIOUS SESSION?');
        console.log('===========================');
        console.log(`Found previous session progress:`);
        console.log(`  Completed: ${existingProgress.completed_count} locations`);
        console.log(`  Last session: ${new Date(existingProgress.last_updated).toLocaleString()}`);
        console.log(`  Remaining: ${remainingCount} locations`);
        console.log('');
        console.log('Options:');
        console.log('  1️⃣  Resume - Continue from where you left off');
        console.log('  2️⃣  Restart - Start over from the beginning');
        
        function promptForChoice() {
            rl.question('\n🎯 Choose option (1-2): ', (input) => {
                if (input.trim() === '1') {
                    console.log('✅ Resuming from previous session...');
                    resolve({ action: 'resume' });
                } else if (input.trim() === '2') {
                    console.log('✅ Starting fresh...');
                    try {
                        fs.unlinkSync(PROGRESS_FILE);
                    } catch (e) {}
                    resolve({ action: 'restart' });
                } else {
                    console.log('❌ Invalid option. Please choose 1 or 2');
                    promptForChoice();
                }
            });
        }
        
        promptForChoice();
    });
}

// Function to ask for coordinates
function askForCoordinates(address, index, total) {
    return new Promise((resolve) => {
        console.log('\n' + '='.repeat(80));
        console.log(`🏪 LOCATION ${index}/${total}`);
        console.log(`📍 Address: ${address}`);
        console.log('='.repeat(80));
        
        // Open Google Maps
        const mapsUrl = createGoogleMapsUrl(address);
        console.log(`🔍 Opening Google Maps...`);
        openBrowser(mapsUrl);
        
        console.log('\n📋 INSTRUCTIONS:');
        console.log('1. Find the Costco location on the map that just opened');
        console.log('2. Right-click on the Costco building/parking lot');
        console.log('3. Copy the coordinates from the context menu');
        console.log('4. Paste them below and press Enter');
        console.log('\n💡 Commands: "skip" (or "s") | "quit" (or "q") | "maps" (or "m" to reopen)');
        console.log('🗂️  Manual mode: Please close tabs manually when done with each location');
        
        function promptForInput() {
            rl.question('\n🎯 Enter coordinates (lat, lng): ', (input) => {
                input = input.trim().toLowerCase();
                
                if (input === 'quit' || input === 'q') {
                    resolve({ action: 'quit' });
                    return;
                }
                
                if (input === 'skip' || input === 's') {
                    console.log('⏭️  Skipping this location...');
                    resolve({ action: 'skip' });
                    return;
                }
                
                if (input === 'maps' || input === 'm') {
                    console.log('🔍 Re-opening Google Maps...');
                    openBrowser(mapsUrl);
                    promptForInput();
                    return;
                }
                
                const parsed = parseCoordinateInput(input);
                if (!parsed) {
                    console.log('❌ Could not parse coordinates. Please try again.');
                    console.log('   Examples: "40.7128, -74.0060" or "40.7128 -74.0060"');
                    promptForInput();
                    return;
                }
                
                const validation = validateCoordinates(parsed.lat, parsed.lng);
                if (!validation.valid) {
                    console.log(`❌ ${validation.error}. Please try again.`);
                    promptForInput();
                    return;
                }
                
                console.log(`✅ Coordinates accepted: ${validation.lat}, ${validation.lng}`);
                console.log('🗂️  Remember to close the Google Maps tab manually!');
                
                resolve({ 
                    action: 'update', 
                    lat: validation.lat, 
                    lng: validation.lng 
                });
            });
        }
        
        promptForInput();
    });
}

// Main function
async function main() {
    try {
        console.log('🏪 Simple Costco Coordinate Fixer');
        console.log('=================================\n');
        
        // Check for backup files
        const backupFiles = findBackupFiles();
        const backupChoice = await askAboutBackupFiles(backupFiles);
        
        // Load coordinates based on choice
        let coordinatesData;
        let loadedFromBackup = false;
        
        if (backupChoice.action === 'load_backup') {
            coordinatesData = JSON.parse(fs.readFileSync(backupChoice.filename, 'utf8'));
            loadedFromBackup = true;
        } else {
            coordinatesData = JSON.parse(fs.readFileSync('costco_coordinates.json', 'utf8'));
        }
        
        // Find failed coordinates
        const failedAddresses = [];
        const alreadyFixedCount = countFixedCoordinates(coordinatesData);
        
        for (const [address, coords] of Object.entries(coordinatesData)) {
            if (coords.lat === FALLBACK_LAT && coords.lng === FALLBACK_LNG) {
                failedAddresses.push(address);
            }
        }
        
        if (failedAddresses.length === 0) {
            console.log('🎉 No coordinates need fixing! All locations are properly geocoded.');
            if (loadedFromBackup) {
                console.log('💡 Consider renaming your backup file to costco_coordinates.json');
            }
            rl.close();
            return;
        }

        console.log(`\n📊 COORDINATE STATUS:`);
        console.log(`   ✅ Already fixed: ${alreadyFixedCount} locations`);
        console.log(`   ❌ Still need fixing: ${failedAddresses.length} locations`);
        console.log(`   📈 Progress: ${((alreadyFixedCount / (alreadyFixedCount + failedAddresses.length)) * 100).toFixed(1)}%`);
        
        // Handle existing progress (only for original file)
        let startIndex = 0;
        let currentProgress = null;
        
        if (!loadedFromBackup) {
            const existingProgress = loadProgress();
            if (existingProgress && existingProgress.completed_count > 0) {
                const progressChoice = await askAboutProgress(existingProgress, failedAddresses.length);
                
                if (progressChoice.action === 'resume') {
                    startIndex = existingProgress.completed_count;
                    currentProgress = existingProgress;
                }
            }
        }
        
        // Initialize progress tracking
        if (!currentProgress) {
            currentProgress = {
                session_start: new Date().toISOString(),
                last_updated: new Date().toISOString(),
                completed_count: 0,
                total_count: failedAddresses.length,
                last_completed_address: null,
                loaded_from_backup: loadedFromBackup,
                backup_file_used: loadedFromBackup ? backupChoice.filename : null
            };
        }

        console.log('\n📚 QUICK REFERENCE:');
        console.log('   • "skip" or "s" - Skip current location');
        console.log('   • "quit" or "q" - Save progress and exit');
        console.log('   • "maps" or "m" - Re-open Google Maps');
        console.log('   • 🗂️  Manual mode: Close tabs yourself when done');
        
        // Create working copy
        const workingCoordinates = { ...coordinatesData };
        let fixedThisSession = 0;
        let skippedThisSession = 0;
        
        // Process each failed address
        for (let i = startIndex; i < failedAddresses.length; i++) {
            const address = failedAddresses[i];
            const result = await askForCoordinates(address, i + 1, failedAddresses.length);
            
            if (result.action === 'quit') {
                console.log('\n💾 Saving progress and exiting...');
                break;
            } else if (result.action === 'skip') {
                skippedThisSession++;
                currentProgress.completed_count = i + 1;
                currentProgress.last_updated = new Date().toISOString();
                currentProgress.last_completed_address = address + ' (SKIPPED)';
                saveProgress(currentProgress);
                continue;
            } else if (result.action === 'update') {
                workingCoordinates[address] = {
                    lat: result.lat,
                    lng: result.lng
                };
                fixedThisSession++;
                
                // Update progress
                currentProgress.completed_count = i + 1;
                currentProgress.last_updated = new Date().toISOString();
                currentProgress.last_completed_address = address;
                saveProgress(currentProgress);
                
                // Auto-save backup every 5 fixes
                if (fixedThisSession % 5 === 0) {
                    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
                    const backupFile = `costco_coordinates_progress_${timestamp}.json`;
                    fs.writeFileSync(backupFile, JSON.stringify(workingCoordinates, null, 2));
                    console.log(`💾 Progress auto-saved to ${backupFile}`);
                }
            }
        }
        
        // Save final results
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
        const outputFile = `costco_coordinates_fixed_${timestamp}.json`;
        fs.writeFileSync(outputFile, JSON.stringify(workingCoordinates, null, 2));
        
        // Final summary
        const remainingFailed = Object.entries(workingCoordinates)
            .filter(([addr, coords]) => coords.lat === FALLBACK_LAT && coords.lng === FALLBACK_LNG)
            .map(([addr]) => addr);

        console.log('\n🎉 SESSION COMPLETE!');
        console.log('==================');
        console.log(`✅ Fixed this session: ${fixedThisSession} locations`);
        console.log(`⏭️  Skipped this session: ${skippedThisSession} locations`);
        console.log(`❌ Still need fixing: ${remainingFailed.length} locations`);
        console.log(`📁 Output file: ${outputFile}`);
        
        if (remainingFailed.length > 0) {
            console.log('\n🔄 To continue, run this script again!');
            console.log('💡 Your progress is saved - you can resume anytime');
        } else {
            console.log('\n🏆 ALL COORDINATES FIXED! 🎉');
            try {
                fs.unlinkSync(PROGRESS_FILE);
                console.log('🧹 Progress file cleaned up');
            } catch (e) {}
        }
        
        rl.close();
        
    } catch (error) {
        console.error('💥 Error:', error.message);
        if (error.code === 'ENOENT') {
            console.log('💡 Make sure costco_coordinates.json exists in the current directory');
        }
        rl.close();
    }
}

// Handle graceful exit
process.on('SIGINT', () => {
    console.log('\n\n👋 Exiting... Your progress has been saved!');
    rl.close();
    process.exit(0);
});

// Run the script
main();