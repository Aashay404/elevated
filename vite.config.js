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

export default defineConfig({
  build: {
    rollupOptions: {
      input: input
    }
  }
});
