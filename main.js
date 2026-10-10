'use strict';
const { app, BrowserWindow, ipcMain, Menu, shell } = require('electron');
const path = require('path');

const startFullscreen = process.argv.includes('--fullscreen');

// Kütüphanedeki çevrimiçi oyunlar: yalnızca bu adresler açılabilir
const WEB_APPS = {
  transformice: { title: 'Transformice', url: 'https://www.transformice.com/' }
};
const webWindows = {};

function openWebApp(id) {
  const entry = WEB_APPS[id];
  if (!entry) return;
  const existing = webWindows[id];
  if (existing && !existing.isDestroyed()) {
    if (existing.isMinimized()) existing.restore();
    existing.focus();
    return;
  }
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 500,
    title: entry.title,
    backgroundColor: '#000000',
    icon: path.join(__dirname, 'build', 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      partition: 'persist:' + id, // oturum (giriş bilgisi) kalıcı olsun
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  win.setMenu(null);
  win.loadURL(entry.url);
  // Açılır pencereleri (forum, wiki vb.) varsayılan tarayıcıda aç
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') {
      win.setFullScreen(!win.isFullScreen());
      event.preventDefault();
    }
  });
  win.on('closed', () => { delete webWindows[id]; });
  webWindows[id] = win;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 450,
    fullscreen: startFullscreen,
    backgroundColor: '#000000',
    title: 'PS4 Arayüz Emülatörü',
    icon: path.join(__dirname, 'build', 'icon.png'),
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      autoplayPolicy: 'no-user-gesture-required',
      backgroundThrottling: false
    }
  });

  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, 'src', 'index.html'));
  win.once('ready-to-show', () => win.show());

  // F11: tam ekran, F12: geliştirici araçları
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11') {
      win.setFullScreen(!win.isFullScreen());
      event.preventDefault();
    } else if (input.key === 'F12') {
      win.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  // Uygulama içinden dış bağlantı açılmasını engelle
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
}

ipcMain.on('app:quit', () => app.quit());
ipcMain.on('app:open-web', (e, id) => openWebApp(String(id)));
ipcMain.on('app:fullscreen', (e) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  if (win) win.setFullScreen(!win.isFullScreen());
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => app.quit());
