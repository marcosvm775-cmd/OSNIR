const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

async function buildZip() {
  const distDir = path.resolve(__dirname, '..', 'dist');
  const publicDir = path.resolve(__dirname, '..', 'public');
  const publicZip = path.join(publicDir, 'webintoapp_pacote.zip');
  const distZip = path.join(distDir, 'webintoapp_pacote.zip');

  if (!fs.existsSync(distDir)) {
    console.log('Pasta dist nao encontrada ainda.');
    return;
  }

  const indexHtmlPath = path.join(distDir, 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
    let htmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
    htmlContent = htmlContent.replace(/\scrossorigin(=["'][^"']*["'])?/g, '');
    htmlContent = htmlContent.replace(/<script[^>]*register-sw[^>]*>.*?<\/script>/gi, '');
    htmlContent = htmlContent.replace(/<link[^>]*manifest\.webmanifest[^>]*>/gi, '');
    fs.writeFileSync(indexHtmlPath, htmlContent, 'utf8');
  }

  const zip = new JSZip();
  const allowedExtensions = new Set(['.html', '.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.json', '.woff', '.woff2', '.ttf']);

  function addFolderToZip(currentDir, relativePath = '') {
    const items = fs.readdirSync(currentDir);
    for (const item of items) {
      if (item === 'webintoapp_pacote.zip' || item === 'registerSW.js' || item === 'sw.js') continue;
      if (item.startsWith('workbox-') || item.endsWith('.webmanifest')) continue;

      const fullPath = path.join(currentDir, item);
      const zipPath = relativePath ? `${relativePath}/${item}` : item;
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        addFolderToZip(fullPath, zipPath);
      } else {
        const ext = path.extname(item).toLowerCase();
        if (allowedExtensions.has(ext)) {
          const content = fs.readFileSync(fullPath);
          zip.file(zipPath, content);
        }
      }
    }
  }

  addFolderToZip(distDir);

  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(publicZip, zipBuffer);
  fs.writeFileSync(distZip, zipBuffer);
  console.log(`Pacote WebIntoApp gerado com sucesso via Node! Tamanho: ${(zipBuffer.length / 1024).toFixed(1)} KB`);
}

buildZip().catch((err) => {
  console.error('Erro ao gerar pacote zip:', err);
});
