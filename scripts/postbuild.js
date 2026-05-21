import fs from 'fs';
import path from 'path';

const srcDir = path.join(process.cwd(), 'dist', 'client');
const destDir = path.join(process.cwd(), 'dist');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

if (fs.existsSync(srcDir)) {
  fs.readdirSync(srcDir).forEach((item) => {
    copyRecursiveSync(path.join(srcDir, item), path.join(destDir, item));
  });
  console.log('Postbuild: Copied dist/client files to dist/');
} else {
  console.error('Postbuild error: dist/client directory not found');
}
