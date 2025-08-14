#!/usr/bin/env node

/**
 * Generate Static HTML Pages for Each Desk
 * 
 * This script creates individual HTML files for each desk to ensure
 * proper Open Graph meta tags for social sharing, especially Facebook.
 * 
 * Facebook's crawler doesn't execute JavaScript, so we need static HTML
 * files with the correct meta tags already in place.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import desk data
const deskData = JSON.parse(fs.readFileSync(path.join(__dirname, 'src/model/desk.json'), 'utf8'));

// Read the base index.html template
const baseHtml = fs.readFileSync(path.join(__dirname, 'dist/index.html'), 'utf8');

// Function to generate HTML for a specific desk
function generateDeskHtml(desk) {
    const baseUrl = 'https://desk.kelvinhung.uk';
    const deskUrl = `${baseUrl}/${desk.slug}`;
    const title = `DESK Tribute - where creativity is born - ${desk.name}`;
    const description = `Check out ${desk.name}'s desk setup - ${desk.title} from ${desk.location}. A creative workspace that inspires.`;
    const image = desk.photos && desk.photos[0] ? `${baseUrl}${desk.photos[0]}` : `${baseUrl}/favicon.ico`;

    // Replace meta tags in the HTML
    let html = baseHtml;

    // Update page title
    html = html.replace(
        /<title>.*?<\/title>/,
        `<title>${title}</title>`
    );

    // Update Open Graph meta tags
    html = html.replace(
        /property="og:url"\s+content="[^"]*"/,
        `property="og:url" content="${deskUrl}"`
    );

    html = html.replace(
        /property="og:title"\s+content="[^"]*"/,
        `property="og:title" content="${title}"`
    );

    html = html.replace(
        /property="og:description"\s+content="[^"]*"/,
        `property="og:description" content="${description}"`
    );

    html = html.replace(
        /property="og:image"\s+content="[^"]*"/,
        `property="og:image" content="${image}"`
    );

    // Update Twitter Card meta tags
    html = html.replace(
        /name="twitter:title"\s+content="[^"]*"/,
        `name="twitter:title" content="${title}"`
    );

    html = html.replace(
        /name="twitter:description"\s+content="[^"]*"/,
        `name="twitter:description" content="${description}"`
    );

    html = html.replace(
        /name="twitter:image"\s+content="[^"]*"/,
        `name="twitter:image" content="${image}"`
    );

    return html;
}

// Generate HTML files for each desk
console.log('🔧 Generating static HTML pages for each desk...');

let generatedCount = 0;

for (const desk of deskData) {
    try {
        const html = generateDeskHtml(desk);
        const fileName = `${desk.slug}.html`;
        const filePath = path.join(__dirname, 'dist', fileName);

        fs.writeFileSync(filePath, html);
        generatedCount++;

        if (generatedCount % 20 === 0) {
            console.log(`✅ Generated ${generatedCount} pages...`);
        }
    } catch (error) {
        console.error(`❌ Error generating page for ${desk.slug}:`, error.message);
    }
}

console.log(`🎉 Successfully generated ${generatedCount} static HTML pages!`);
console.log('📋 Each desk now has its own HTML file with proper Open Graph meta tags.');
console.log('🔗 Facebook sharing will now work correctly for each desk page.');
