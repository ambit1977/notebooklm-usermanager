#!/usr/bin/env node

/**
 * Convert SVG icon to PNG files for Chrome extension
 */

const fs = require('fs');
const path = require('path');

// SVG content for the icon
const svgContent = `<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <!-- Background circle -->
  <circle cx="64" cy="64" r="60" fill="#4285f4" stroke="#ffffff" stroke-width="4"/>
  
  <!-- User icon -->
  <g fill="#ffffff">
    <!-- User head -->
    <circle cx="64" cy="45" r="15"/>
    <!-- User body -->
    <path d="M 40 85 Q 40 70 64 70 Q 88 70 88 85 L 88 95 L 40 95 Z"/>
  </g>
  
  <!-- Plus icon for adding users -->
  <g fill="#ffffff" opacity="0.8">
    <rect x="85" y="25" width="20" height="4" rx="2"/>
    <rect x="93" y="17" width="4" height="20" rx="2"/>
  </g>
  
  <!-- NotebookLM indicator -->
  <text x="64" y="110" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#ffffff" opacity="0.7">NLM</text>
</svg>`;

// Function to create PNG from SVG (simplified version)
function createPNGFromSVG(svgContent, size) {
  // For now, we'll create a simple HTML file that can be used to generate PNG
  // In a real implementation, you would use a library like sharp or canvas
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; padding: 20px; background: #f0f0f0; }
    .icon-container { 
      display: inline-block; 
      width: ${size}px; 
      height: ${size}px; 
      background: white; 
      border-radius: 8px; 
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    svg { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div class="icon-container">
    ${svgContent.replace('width="128" height="128"', `width="${size}" height="${size}"`)}
  </div>
  <p>Right-click on the icon above and "Save image as..." to save as PNG</p>
</body>
</html>`;
  
  return htmlContent;
}

// Create HTML files for each size
const sizes = [16, 48, 128];
const iconsDir = path.join(__dirname, '..', 'src', 'icons');

sizes.forEach(size => {
  const htmlContent = createPNGFromSVG(svgContent, size);
  const htmlPath = path.join(iconsDir, `icon${size}.html`);
  fs.writeFileSync(htmlPath, htmlContent);
  console.log(`Created ${htmlPath} for ${size}x${size} icon`);
});

// Also create a simple PNG placeholder using base64
const createSimplePNG = (size) => {
  // This is a minimal PNG data URL for a blue circle
  // In production, you would use a proper image generation library
  const canvas = `
<canvas width="${size}" height="${size}" style="background: #4285f4; border-radius: 50%;"></canvas>
<script>
  const canvas = document.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  
  // Draw blue circle
  ctx.fillStyle = '#4285f4';
  ctx.beginPath();
  ctx.arc(${size/2}, ${size/2}, ${size/2-2}, 0, 2 * Math.PI);
  ctx.fill();
  
  // Draw white user icon
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(${size/2}, ${size/2-8}, ${size/8}, 0, 2 * Math.PI);
  ctx.fill();
  
  // Draw user body
  ctx.beginPath();
  ctx.moveTo(${size/2-size/4}, ${size/2+size/8});
  ctx.quadraticCurveTo(${size/2-size/4}, ${size/2-size/8}, ${size/2}, ${size/2-size/8});
  ctx.quadraticCurveTo(${size/2+size/4}, ${size/2-size/8}, ${size/2+size/4}, ${size/2+size/8});
  ctx.lineTo(${size/2+size/4}, ${size/2+size/4});
  ctx.lineTo(${size/2-size/4}, ${size/2+size/4});
  ctx.closePath();
  ctx.fill();
</script>`;

  return canvas;
};

// Create HTML files with canvas-based icons
sizes.forEach(size => {
  const canvasContent = createSimplePNG(size);
  const htmlPath = path.join(iconsDir, `icon${size}_canvas.html`);
  fs.writeFileSync(htmlPath, `<!DOCTYPE html><html><body>${canvasContent}</body></html>`);
  console.log(`Created ${htmlPath} with canvas-based icon`);
});

console.log('\nTo generate actual PNG files:');
console.log('1. Open the HTML files in a browser');
console.log('2. Right-click on the icon and "Save image as..."');
console.log('3. Save as icon16.png, icon48.png, icon128.png');
console.log('\nAlternatively, use an online SVG to PNG converter with the icon.svg file.');
