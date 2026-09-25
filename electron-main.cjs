const { app, BrowserWindow, protocol, session } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');

let mainWindow = null;
let localServer = null;
let localServerPort = 38450;

// Evita abrir multiplas instancias
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(initApp);
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp',
};

function startLocalHttpServer(callback) {
  const distDir = path.join(__dirname, 'dist');

  localServer = http.createServer((req, res) => {
    try {
      let reqPath = req.url.split('?')[0].split('#')[0];
      reqPath = decodeURIComponent(reqPath).replace(/^\/+/, '');
      if (!reqPath || reqPath === '') reqPath = 'index.html';

      let filePath = path.join(distDir, reqPath);

      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(distDir, 'index.html');
      }

      if (!fs.existsSync(filePath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Arquivo nao encontrado');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      });

      fs.createReadStream(filePath).pipe(res);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Erro interno: ' + err.message);
    }
  });

  // Tenta escutar na porta padrao ou dinamica se estiver ocupada
  localServer.on('error', (err) => {
    console.warn('[LOCAL SERVER] Porta 38450 ocupada, usando porta aleatoria:', err.message);
    localServer.close();
    localServer.listen(0, '127.0.0.1', () => {
      localServerPort = localServer.address().port;
      console.log('[LOCAL SERVER] Iniciado na porta dinamica:', localServerPort);
      callback(localServerPort);
    });
  });

  localServer.listen(localServerPort, '127.0.0.1', () => {
    console.log('[LOCAL SERVER] Iniciado com sucesso na porta:', localServerPort);
    callback(localServerPort);
  });
}

function initApp() {
  startLocalHttpServer((port) => {
    createWindow(port);
  });
}

function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: 'OSNIR TURISMO - Sistema de Gestão',
    icon: path.join(__dirname, 'dist', 'icon.ico'),
    backgroundColor: '#f8fafc', // Fundo cinza suave padrao do app (evita tela verde estatica)
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      allowRunningInsecureContent: true,
      allowFileAccessFromFileURLs: true,
      allowUniversalAccessFromFileURLs: true,
      spellcheck: false,
    },
  });

  const appUrl = `http://127.0.0.1:${port}/index.html`;
  const fallbackPath = path.join(__dirname, 'dist', 'index.html');

  // Abre a interface assim que carregar
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Atalho F12 ou Ctrl+Shift+I para abrir ferramentas de desenvolvedor caso necessario
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' || (input.control && input.shift && input.key === 'I')) {
      mainWindow.webContents.toggleDevTools();
    }
  });

  // Carrega via HTTP local para suporte total a ES Modules e IndexedDB sem restricoes de arquivo
  mainWindow.loadURL(appUrl).catch((err) => {
    console.error('[ERRO ELECTRON] Falha ao abrir via HTTP, tentando fallback direto:', err);
    mainWindow.loadFile(fallbackPath).catch((err2) => {
      console.error('[ERRO ELECTRON] Falha no fallback:', err2);
    });
  });

  // Tratamento contra falhas de carregamento
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.warn(`[WARN ELECTRON] Erro ao carregar (${errorCode}: ${errorDescription}) em ${validatedURL}`);
    setTimeout(() => {
      if (mainWindow) {
        mainWindow.loadURL(appUrl).catch(() => {
          mainWindow.loadFile(fallbackPath);
        });
      }
    }, 1000);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('before-quit', () => {
  if (localServer) {
    try {
      localServer.close();
    } catch {}
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    if (localServer && localServer.listening) {
      createWindow(localServerPort);
    } else {
      initApp();
    }
  }
});
