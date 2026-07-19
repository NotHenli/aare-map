#!/usr/bin/env node
// Build: copy the site to dist/ and shrink images (resize + recompress with sharp).
const fs = require('fs');
const path = require('path');
const { rm, mkdir, copyFile, readdir, readFile, writeFile } = fs.promises;

const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');

// Not deployed: tooling, docs and the raw geodata (runtime only needs data/river.js).
const exclude = new Set([
  'node_modules', 'dist', '.git', '.github', '.vscode', 'scripts',
  '.gitignore', 'package.json', 'package-lock.json', 'README.md',
  'river_raw.json', 'river.geojson'
]);

async function copyDir(src, dest) {
  await mkdir(dest, { recursive: true });
  for (const entry of await readdir(src, { withFileTypes: true })) {
    if (exclude.has(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) await copyDir(srcPath, destPath);
    else if (entry.isFile()) await copyFile(srcPath, destPath);
  }
}

async function optimizeImages(dir) {
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.log('sharp not installed, skipping image optimization');
    return;
  }

  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) { await optimizeImages(filePath); continue; }
    const isJpg = /\.jpe?g$/i.test(entry.name);
    const isPng = /\.png$/i.test(entry.name);
    if (!isJpg && !isPng) continue;

    try {
      // Read via Node (sharp's own file open can fail on OneDrive-synced folders),
      // then resize + recompress. Popups/lightbox never show images wider than
      // ~900px; 1600px keeps them sharp on retina screens. Icons (192/512px)
      // are untouched by the resize.
      const input = await readFile(filePath);
      let img = sharp(input).resize({ width: 1600, withoutEnlargement: true });
      img = isJpg
        ? img.jpeg({ quality: 78, mozjpeg: true })
        : img.png({ compressionLevel: 9, palette: true });
      const data = await img.toBuffer();
      const before = input.length;
      if (data.length < before) {
        await writeFile(filePath, data);
        console.log(`${entry.name}: ${(before / 1024).toFixed(0)} KB → ${(data.length / 1024).toFixed(0)} KB`);
      }
    } catch (err) {
      console.log(`Skipping optimization for ${entry.name}: ${err.message}`);
    }
  }
}

async function run() {
  await rm(distDir, { recursive: true, force: true });
  await copyDir(root, distDir);
  await optimizeImages(path.join(distDir, 'img'));
  console.log(`Build complete: ${distDir}`);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
