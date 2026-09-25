const { app, BrowserWindow, protocol, session } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

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

  app.whenReady().then(createWindow);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: 'OSNIR TURISMO - Sistema de Gestão',
    icon: path.join(__dirname, 'dist', 'icon.ico'),
    backgroundColor: '#065f46', // Fundo verde escuro oficial da OSNIR para NUNCA dar tela branca ao abrir
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      allowRunningInsecureContent: true,
      spellcheck: false,
    },
  });

  const indexPath = path.join(__dirname, 'dist', 'index.html');

  // Abre a interface apos pronta para exibicao evitando qualquer piscada branca
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Tenta carregar o arquivo com tratamento de falhas
  mainWindow.loadFile(indexPath).catch((err) => {
    console.error('[ERRO ELECTRON] Falha ao carregar dist/index.html:', err);
  });

  // Tratamento contra tela branca em caso de erro de carregamento
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.warn(`[WARN ELECTRON] Erro ao carregar (${errorCode}: ${errorDescription}) em ${validatedURL}`);
    setTimeout(() => {
      if (mainWindow) {
        mainWindow.loadFile(indexPath);
      }
    }, 800);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
