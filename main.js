'use strict';
const { app, BrowserWindow, ipcMain, Menu, shell } = require('electron');
const path = require('path');

const startFullscreen = process.argv.includes('--fullscreen');

// Emülatörün içine gömülebilecek çevrimiçi oyunlar (yalnızca bu alan adları)
function isAllowedWebUrl(u) {
  try {
    const url = new URL(u);
    return url.protocol === 'https:' && /(^|\.)transformice\.com$/i.test(url.hostname);
  } catch (e) {
    return false;
  }
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
      webviewTag: true,
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
    } else if (input.key === 'Home') {
      // PS tuşu: gömülü oyun klavyeyi tutsa bile her zaman ana ekrana döner
      event.preventDefault();
      win.webContents.send('webapp:home');
    } else if (input.key === 'F12') {
      win.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  // Uygulama içinden dış bağlantı açılmasını engelle
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  // Gömülü oyun görünümü: güvenli ayarlar ve izinli adres kontrolü
  win.webContents.on('will-attach-webview', (event, webPreferences, params) => {
    delete webPreferences.preload;
    webPreferences.nodeIntegration = false;
    webPreferences.contextIsolation = true;
    webPreferences.sandbox = true;
    if (!isAllowedWebUrl(params.src)) event.preventDefault();
  });
  win.webContents.on('did-attach-webview', (event, guest) => {
    // Oyundaki açılır bağlantılar (forum, wiki vb.) varsayılan tarayıcıda açılsın
    guest.setWindowOpenHandler(({ url }) => {
      if (/^https?:\/\//i.test(url)) shell.openExternal(url);
      return { action: 'deny' };
    });
    // Oyun klavyeyi tutarken Home = PS tuşu (ana ekrana dön), F11 = tam ekran
    guest.on('before-input-event', (e, input) => {
      if (input.type !== 'keyDown') return;
      if (input.key === 'Home') {
        e.preventDefault();
        win.webContents.send('webapp:home');
      } else if (input.key === 'F11') {
        e.preventDefault();
        win.setFullScreen(!win.isFullScreen());
      }
    });
  });
}

ipcMain.on('app:quit', () => app.quit());
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
