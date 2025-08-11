#!/usr/bin/env node

/**
 * Fix asset paths for development mode
 * Changes "/src/assets/" to "/src/assets/" for development compatibility
 */

const fs = require('fs');
const path = require('path');

const deskJsonPath = path.join(__dirname, 'src', 'model', 'desk.json');

console.log('Reading desk.json...');
const deskData = fs.readFileSync(deskJsonPath, 'utf8');

console.log('Fixing asset paths for development...');
// For development, assets should be accessible via /src/assets/
const fixedData = deskData.replace(/\/src\/assets\//g, '/src/assets/');

console.log('Writing updated desk.json...');
fs.writeFileSync(deskJsonPath, fixedData);

console.log('✅ Asset paths fixed for development mode');
