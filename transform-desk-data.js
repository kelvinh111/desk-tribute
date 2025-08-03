import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the original desk.json file
const inputFile = path.join(__dirname, 'src', 'model', 'desk.json');
const outputFile = path.join(__dirname, 'src', 'model', 'desk-new.json');

console.log('Reading desk.json...');
const deskData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

console.log(`Found ${deskData.length} desk entries to transform`);

// Transform each desk entry
const transformedData = deskData.map((desk, index) => {
    // Extract the screen.img value to move to profile
    const profile = desk.screen ? desk.screen.img : null;

    // Create new structure
    const transformedDesk = {
        id: desk.id,
        name: desk.name,
        title: desk.title,
        location: desk.location,
        profile: profile, // Move screen.img to root level as profile
        decor: desk.decor,
        monitor: desk.monitor,
        screen: {
            width: desk.screen.width,
            height: desk.screen.height,
            x: desk.screen.x,
            y: desk.screen.y,
            // Remove img property, keep firstPhoto if it exists
            ...(desk.screen.firstPhoto && { firstPhoto: desk.screen.firstPhoto })
        },
        photos: desk.photos,
        social: desk.social
    };

    if (index < 5) {
        console.log(`Transformed entry ${index + 1}:`, {
            id: transformedDesk.id,
            name: transformedDesk.name,
            originalScreenImg: desk.screen?.img,
            newProfile: transformedDesk.profile
        });
    }

    return transformedDesk;
});

// Write the transformed data to a new file
fs.writeFileSync(outputFile, JSON.stringify(transformedData, null, 4));

console.log(`\n✅ Successfully transformed ${transformedData.length} entries`);
console.log(`📁 New file created: ${outputFile}`);
console.log('\nSample of transformed structure:');
console.log(JSON.stringify(transformedData[0], null, 2));
