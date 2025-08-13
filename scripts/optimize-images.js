import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const imagesDir = 'public/images';
const outputDir = 'public/images/optimized';

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const imageOptimizationConfig = {
  jpg: {
    quality: 85,
    progressive: true,
    mozjpeg: true
  },
  webp: {
    quality: 80,
    effort: 6
  }
};

async function optimizeImage(inputPath, filename) {
  const basename = path.basename(filename, path.extname(filename));
  
  try {
    // Generate optimized JPEG
    await sharp(inputPath)
      .jpeg(imageOptimizationConfig.jpg)
      .resize(1920, null, { 
        withoutEnlargement: true,
        fit: 'inside'
      })
      .toFile(path.join(outputDir, `${basename}-optimized.jpg`));
    
    // Generate WebP version
    await sharp(inputPath)
      .webp(imageOptimizationConfig.webp)
      .resize(1920, null, {
        withoutEnlargement: true,
        fit: 'inside'
      })
      .toFile(path.join(outputDir, `${basename}.webp`));
    
    // Generate thumbnail for lazy loading placeholder
    await sharp(inputPath)
      .resize(20)
      .blur(10)
      .jpeg({ quality: 50 })
      .toFile(path.join(outputDir, `${basename}-placeholder.jpg`));
      
    const originalSize = fs.statSync(inputPath).size;
    const optimizedSize = fs.statSync(path.join(outputDir, `${basename}-optimized.jpg`)).size;
    const webpSize = fs.statSync(path.join(outputDir, `${basename}.webp`)).size;
    
    console.log(`Optimized ${filename}:`);
    console.log(`  Original: ${(originalSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`  Optimized JPEG: ${(optimizedSize / 1024 / 1024).toFixed(2)}MB (${Math.round((1 - optimizedSize/originalSize) * 100)}% reduction)`);
    console.log(`  WebP: ${(webpSize / 1024 / 1024).toFixed(2)}MB (${Math.round((1 - webpSize/originalSize) * 100)}% reduction)`);
    
  } catch (error) {
    console.error(`Error optimizing ${filename}:`, error);
  }
}

// Process all large images
const largeImages = [
  'jeshoots-com-sMKUYIasyDM-unsplash.jpg',
  'kilian-seiler-PZLgTUAhxMM-unsplash.jpg', 
  'markus-winkler-3vlGNkDep4E-unsplash.jpg'
];

async function optimizeAll() {
  for (const image of largeImages) {
    const imagePath = path.join(imagesDir, image);
    if (fs.existsSync(imagePath)) {
      await optimizeImage(imagePath, image);
    }
  }
}

optimizeAll().then(() => {
  console.log('\nImage optimization complete!');
  console.log('Update your HTML to use picture elements with WebP fallback.');
});