// Fix asset paths in desk.json for production build
import { readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

const deskJsonPath = resolve('src/model/desk.json');
const deskData = JSON.parse(readFileSync(deskJsonPath, 'utf8'));

// Function to fix asset paths
function fixAssetPath(path) {
    if (path.startsWith('../src/assets/')) {
        // Convert ../src/assets/generated/img-030.png to /src/assets/generated/img-030.png
        return path.replace('../src/assets/', '/src/assets/');
    }
    if (path.startsWith('../src/')) {
        // Convert any other ../src/ paths to /src/
        return path.replace('../src/', '/src/');
    }
    return path;
}

// Fix paths in all desk objects
deskData.forEach(desk => {
    if (desk.profile) desk.profile = fixAssetPath(desk.profile);
    if (desk.decor) desk.decor = fixAssetPath(desk.decor);

    if (desk.monitor && desk.monitor.img) {
        desk.monitor.img = fixAssetPath(desk.monitor.img);
    }

    if (desk.screen && desk.screen.firstPhoto) {
        desk.screen.firstPhoto = fixAssetPath(desk.screen.firstPhoto);
    }

    if (desk.photos) {
        desk.photos = desk.photos.map(photo => fixAssetPath(photo));
    }
});

// Write the fixed JSON back
writeFileSync(deskJsonPath, JSON.stringify(deskData, null, 4));
console.log('Fixed asset paths in desk.json');
