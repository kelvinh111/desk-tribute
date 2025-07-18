import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const deskJsonPath = path.join(__dirname, 'src', 'model', 'desk.json');
const generatedImagesDir = 'src/assets/generated';

// Read the current desk.json
const deskData = JSON.parse(fs.readFileSync(deskJsonPath, 'utf8'));

// Function to get a random image from our generated images
function getRandomImage() {
    const imageNumber = Math.floor(Math.random() * 250) + 1;
    return `../${generatedImagesDir}/img-${imageNumber.toString().padStart(3, '0')}.png`;
}

// Function to get a specific image (for consistent firstPhoto)
function getSpecificImage(index) {
    const imageNumber = ((index - 1) % 250) + 1;
    return `../${generatedImagesDir}/img-${imageNumber.toString().padStart(3, '0')}.png`;
}

// Update each desk with local images
deskData.forEach((desk, index) => {
    if (desk.screen) {
        // For screen.img, use a random image
        desk.screen.img = getRandomImage();

        // For screen.firstPhoto, use a different image (to ensure it's different from screen.img)
        const firstPhotoIndex = (index * 2 + 1) % 250 + 1;
        desk.screen.firstPhoto = `../${generatedImagesDir}/img-${firstPhotoIndex.toString().padStart(3, '0')}.png`;
    }
});

// Write the updated desk.json
fs.writeFileSync(deskJsonPath, JSON.stringify(deskData, null, 4));

console.log('✅ Successfully updated desk.json with local images!');
console.log(`📁 Updated ${deskData.length} desks to use images from ${generatedImagesDir}/`);
console.log('🎨 Each desk now has unique screen.img and screen.firstPhoto from your generated images');

// Show a sample of the changes
console.log('\n📋 Sample desk configuration:');
console.log(JSON.stringify(deskData[0].screen, null, 2));
