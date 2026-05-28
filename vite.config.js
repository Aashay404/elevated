import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

// Dynamically discover all HTML files in the root folder
const input = {};
const files = fs.readdirSync(__dirname);
files.forEach(file => {
  if (file.endsWith('.html')) {
    const name = file.replace('.html', '');
    input[name] = resolve(__dirname, file);
  }
});

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    const srcPath = resolve(src, entry.name);
    const destPath = resolve(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export default defineConfig({
  build: {
    rollupOptions: {
      input: input
    }
  },
  plugins: [
    {
      name: 'copy-static-assets',
      closeBundle() {
        const srcDir = resolve(__dirname, 'assets');
        const destDir = resolve(__dirname, 'dist/assets');
        if (fs.existsSync(srcDir)) {
          const entries = fs.readdirSync(srcDir, { withFileTypes: true });
          for (let entry of entries) {
            const srcPath = resolve(srcDir, entry.name);
            const destPath = resolve(destDir, entry.name);
            if (entry.isDirectory()) {
              copyDirSync(srcPath, destPath);
            } else {
              fs.mkdirSync(destDir, { recursive: true });
              fs.copyFileSync(srcPath, destPath);
            }
          }
          // Copy header-loader.js to dist/
          const loaderSrc = resolve(__dirname, 'header-loader.js');
          const loaderDest = resolve(__dirname, 'dist/header-loader.js');
          if (fs.existsSync(loaderSrc)) {
            fs.copyFileSync(loaderSrc, loaderDest);
            console.log('Successfully copied header-loader.js to dist/');
          }
          console.log('Successfully copied all static assets to dist/assets/');
        }
      }
    }
  ]
});

