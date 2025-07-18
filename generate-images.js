import fs from 'fs';
import path from 'path';
import { createCanvas } from 'canvas';
import { fileURLToPath } from 'url';

// Create assets directory if it doesn't exist
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const assetsDir = path.join(__dirname, 'src', 'assets', 'generated');
if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
}

// Color palettes for different themes
const colorPalettes = [
    // Nature colors
    ['#2E8B57', '#228B22', '#32CD32', '#90EE90'],
    ['#4682B4', '#5F9EA0', '#87CEEB', '#B0C4DE'],
    ['#CD853F', '#D2691E', '#DEB887', '#F4A460'],

    // Warm colors
    ['#FF6B6B', '#FF8E53', '#FF6F91', '#C44569'],
    ['#FFA726', '#FFB74D', '#FFCC02', '#FFD54F'],
    ['#9C88FF', '#BB6BD9', '#E056FD', '#F093FB'],

    // Cool colors
    ['#4ECDC4', '#45B7D1', '#96CEB4', '#A8E6CF'],
    ['#667292', '#8B80F9', '#ADA7FF', '#D4D3DD'],
    ['#74B9FF', '#0984E3', '#6C5CE7', '#A29BFE'],

    // Monochrome variations
    ['#2D3436', '#636E72', '#B2BEC3', '#DDD'],
    ['#2C3E50', '#34495E', '#7F8C8D', '#95A5A6'],
];

function getRandomColor() {
    const palette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];
    return palette[Math.floor(Math.random() * palette.length)];
}

function generateGradient(ctx, width, height) {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, getRandomColor());
    gradient.addColorStop(1, getRandomColor());
    return gradient;
}

function generatePattern(ctx, width, height, index) {
    // Clear canvas
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, width, height);

    const patternType = index % 5;

    switch (patternType) {
        case 0: // Gradient
            ctx.fillStyle = generateGradient(ctx, width, height);
            ctx.fillRect(0, 0, width, height);
            break;

        case 1: // Geometric shapes
            ctx.fillStyle = getRandomColor();
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = getRandomColor();
            ctx.beginPath();
            ctx.arc(width / 2, height / 2, Math.min(width, height) / 3, 0, 2 * Math.PI);
            ctx.fill();
            break;

        case 2: // Stripes
            ctx.fillStyle = getRandomColor();
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = getRandomColor();
            for (let i = 0; i < width; i += 8) {
                ctx.fillRect(i, 0, 4, height);
            }
            break;

        case 3: // Dots pattern
            ctx.fillStyle = getRandomColor();
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = getRandomColor();
            for (let x = 5; x < width; x += 10) {
                for (let y = 5; y < height; y += 10) {
                    ctx.beginPath();
                    ctx.arc(x, y, 2, 0, 2 * Math.PI);
                    ctx.fill();
                }
            }
            break;

        case 4: // Abstract shapes
            ctx.fillStyle = generateGradient(ctx, width, height);
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = getRandomColor();
            ctx.beginPath();
            ctx.moveTo(0, height / 2);
            ctx.quadraticCurveTo(width / 2, 0, width, height / 2);
            ctx.quadraticCurveTo(width / 2, height, 0, height / 2);
            ctx.fill();
            break;
    }

    // Add a subtle number overlay
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '8px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(index.toString(), width / 2, height / 2 + 3);
}

async function generateImages(count = 250) {
    console.log(`Generating ${count} images...`);

    for (let i = 1; i <= count; i++) {
        // Create canvas
        const canvas = createCanvas(72, 45);
        const ctx = canvas.getContext('2d');

        // Generate pattern
        generatePattern(ctx, 72, 45, i);

        // Save as PNG
        const fileName = `img-${i.toString().padStart(3, '0')}.png`;
        const filePath = path.join(assetsDir, fileName);

        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(filePath, buffer);

        if (i % 50 === 0) {
            console.log(`Generated ${i}/${count} images...`);
        }
    }

    console.log(`✅ Successfully generated ${count} images in ${assetsDir}`);
    console.log(`📁 Images saved as: img-001.png, img-002.png, ... img-${count.toString().padStart(3, '0')}.png`);
}

// Check if canvas module is available and generate images
try {
    await generateImages(250);
} catch (error) {
    console.log('❌ Error generating images:', error.message);
    console.log('\nIf canvas module is not found, install it first:');
    console.log('npm install canvas');
}
