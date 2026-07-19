#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { rm, mkdir, copyFile, readdir, stat, writeFile } = fs.promises;

const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');
const exclude = new Set(['node_modules', 'dist', '.git', '.github', '.vscode', 'scripts', 'package-lock.json', 'README.md']);

async function copyDir(src, dest) {
  await mkdir(dest, { recursive: true });
  for (const entry of await readdir(src, { withFileTypes: true })) {
    if (exclude.has(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      await copyFile(srcPath, destPath);
    }
  }
}

async function optimizeImages(dir) {
  let imagemin;
  try {
    imagemin = require('imagemin').default;
  } catch {
    console.log('imagemin not installed, skipping image optimization');
    return;
  }

  let mozjpeg;
  let pngquant;
  try {
    mozjpeg = require('imagemin-mozjpeg').default;
    pngquant = require('imagemin-pngquant').default;
  } catch (err) {
    console.log('imagemin plugins not installed, skipping image optimization');
    return;
  }

  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await optimizeImages(filePath);
      continue;
    }
    if (!/\.(jpe?g|png)$/i.test(entry.name)) continue;

    const plugins = entry.name.match(/\.jpe?g$/i)
      ? [mozjpeg({ quality: 75 })]
      : [pngquant({ quality: [0.6, 0.8], speed: 3 })];

    const data = await imagemin([filePath], { destination: path.dirname(filePath), plugins });
    await writeFile(filePath, data[0].data);
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
