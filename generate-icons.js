/**
 * Generate PNG icons from SVG
 * 
 * This script converts the SVG icon to PNG files of different sizes.
 * It requires the sharp library to be installed:
 * npm install sharp
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Icon sizes
const sizes = [16, 48, 128];

// Input and output paths
const svgPath = path.join(__dirname, 'extension', 'icons', 'icon.svg');
const outputDir = path.join(__dirname, 'extension', 'icons');

// Ensure the output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Convert SVG to PNG for each size
async function generateIcons() {
  try {
    // Read the SVG file
    const svgBuffer = fs.readFileSync(svgPath);
    
    // Generate PNG files for each size
    for (const size of sizes) {
      const outputPath = path.join(outputDir, `icon${size}.png`);
      
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`Generated ${outputPath}`);
    }
    
    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

// Run the function
generateIcons();
