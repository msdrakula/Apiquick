const { app, BrowserWindow, Tray, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');

let mainWindow;
let tray;
let serverProcess;

const externalNodePath = path.join(__dirname, '..', 'nodejs', 'node.exe');
const serverScript = path.join(__dirname, '..', 'backend', 'dist', 'index.js');
const HEALTH = 'http://127.0.0.1:8765/health';

function startServer() {
  const useExternalNode = fs.existsSync(externalNodePath);
  const execPath = useExternalNode ? externalNodePath : process.execPath;
  const env = useExternalNode
    ? process.env
    : { ...process.env, ELECTRON_RUN_AS_NODE: '1' };

  serverProcess = spawn(execPath, [serverScript], {
    cwd: path.join(__dirname, '..'),
    stdio: 'ignore',
    windowsHide: true,
    env,
  });
}

function waitForServer(retries = 60) {
  return new Promise((resolve, reject) => {
    const tryOnce = (left) => {
      const req = http.get(HEALTH, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode < 500) resolve();
        else if (left <= 0) reject(new Error('Server did not become ready'));
        else setTimeout(() => tryOnce(left - 1), 250);
      });
      req.on('error', () => {
        if (left <= 0) reject(new Error('Server did not become ready'));
        else setTimeout(() => tryOnce(left - 1), 250);
      });
    };
    tryOnce(retries);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'Apiquick',
    backgroundColor: '#0b0d12',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL('http://127.0.0.1:8765');

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  tray = new Tray(path.join(__dirname, 'icon.png'));
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show Apiquick', click: () => mainWindow.show() },
    { label: 'Quit', click: () => { app.isQuiting = true; app.quit(); } },
  ]);
  tray.setToolTip('Apiquick');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    if (mainWindow.isVisible()) mainWindow.hide();
    else mainWindow.show();
  });
}

app.whenReady().then(async () => {
  startServer();
  try {
    await waitForServer();
  } catch {
    // still open the window so the user sees a connection error rather than a hang
  }
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {});

app.on('before-quit', () => {
  app.isQuiting = true;
  if (serverProcess) serverProcess.kill();
});

app.on('quit', () => {
  if (serverProcess) serverProcess.kill();
});
