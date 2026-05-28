import fs from 'fs';
import path from 'path';

function findImages(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        findImages(fullPath);
      }
    } else if (file.match(/\.(png|jpg|jpeg|svg|gif|webp)$/i)) {
      console.log(fullPath);
    }
  }
}

findImages(process.cwd());
