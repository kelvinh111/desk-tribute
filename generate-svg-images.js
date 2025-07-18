const fs = require('fs');
const path = require('path');

// Create assets directory if it doesn't exist
const assetsDir = path.join(__dirname, 'src', 'assets', 'generated');
if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
}

// Simple SVG generator (no external dependencies)
function generateSVG(index, width = 72, height = 45) {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
        '#DDA0DD', '#98D8C8', '#6C5CE7', '#A29BFE', '#FD79A8',
        '#74B9FF', '#0984E3', '#00B894', '#00CEC9', '#6C5CE7',
        '#A29BFE', '#E17055', '#FDCB6E', '#E84393', '#F8B500'
    ];

    const color1 = colors[index % colors.length];
    const color2 = colors[(index + 1) % colors.length];

    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad${index}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#grad${index})" />
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
          fill="white" font-size="8" font-family="Arial">${index}</text>
  </svg>`;
}

async function generateSVGImages(count = 250) {
    console.log(`Generating ${count} SVG images...`);

    for (let i = 1; i <= count; i++) {
        const svg = generateSVG(i);
        const fileName = `img-${i.toString().padStart(3, '0')}.svg`;
        const filePath = path.join(assetsDir, fileName);

        fs.writeFileSync(filePath, svg);

        if (i % 50 === 0) {
            console.log(`Generated ${i}/${count} images...`);
        }
    }

    console.log(`✅ Successfully generated ${count} SVG images in ${assetsDir}`);
    console.log(`📁 Images saved as: img-001.svg, img-002.svg, ... img-${count.toString().padStart(3, '0')}.svg`);
}

generateSVGImages(250);
