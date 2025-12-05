/* eslint-disable @typescript-eslint/no-require-imports */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputPath = path.resolve(__dirname, '../public/images/logo.png');
const outputPath = path.resolve(__dirname, '../public/images/logo_transparent.png');

async function removeBackground() {
  try {
    console.log(`Processing ${inputPath}...`);
    
    // First, resize to a reasonable size (e.g., 512x512 max) to reduce size
    const resizedBuffer = await sharp(inputPath)
      .resize(512, 512, { fit: 'inside' })
      .toBuffer();
      
    const { data, info } = await sharp(resizedBuffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const pixelArray = new Uint8ClampedArray(data.buffer);
    let transparentPixels = 0;
    
    // Check corners
    const width = info.width;
    const height = info.height;
    
    const getPixel = (x, y) => {
      const idx = (y * width + x) * 4;
      return {
        r: pixelArray[idx],
        g: pixelArray[idx+1],
        b: pixelArray[idx+2],
        a: pixelArray[idx+3]
      };
    };

    console.log('Top-Left:', getPixel(0, 0));
    console.log('Top-Right:', getPixel(width-1, 0));
    console.log('Bottom-Left:', getPixel(0, height-1));
    console.log('Bottom-Right:', getPixel(width-1, height-1));
    console.log('Center:', getPixel(Math.floor(width/2), Math.floor(height/2)));
    
    let nonTransparent = 0;
    let whitePixels = 0;
    const colorCounts = {};

    // Iterate over every pixel (4 channels: R, G, B, Alpha)
    for (let i = 0; i < pixelArray.length; i += 4) {
      const r = pixelArray[i];
      const g = pixelArray[i + 1];
      const b = pixelArray[i + 2];
      const a = pixelArray[i + 3];

      if (a > 0) {
        nonTransparent++;
        // Quantize color to reduce bins (divide by 10)
        const key = `${Math.floor(r/10)},${Math.floor(g/10)},${Math.floor(b/10)}`;
        colorCounts[key] = (colorCounts[key] || 0) + 1;
      }

      // Check if pixel is white (or close)
      if (r > 230 && g > 230 && b > 230 && a > 0) {
        pixelArray[i + 3] = 0; // Set alpha to 0
        transparentPixels++;
        whitePixels++;
      }
    }
    
    console.log(`Total pixels: ${pixelArray.length / 4}`);
    console.log(`Non-transparent pixels before: ${nonTransparent}`);
    console.log(`White pixels found (and removed): ${whitePixels}`);
    
    // Find top 5 colors
    const sortedColors = Object.entries(colorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
      
    console.log('Top 5 colors (quantized /10):', sortedColors);

    console.log(`Made ${transparentPixels} pixels transparent out of ${pixelArray.length / 4} total pixels.`);

    await sharp(pixelArray, {
      raw: {
        width: info.width,
        height: info.height,
        channels: 4
      }
    })
    .png({ quality: 80, compressionLevel: 9 })
    .toFile(outputPath);
    
    console.log(`Success! Saved to ${outputPath}`);
    
    // Check file size
    const stats = fs.statSync(outputPath);
    console.log(`New file size: ${(stats.size / 1024).toFixed(2)} KB`);
    
  } catch (error) {
    console.error('Error processing image:', error);
    process.exit(1);
  }
}

removeBackground();
