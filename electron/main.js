// Modules to control application life and create native browser window
require('babel-polyfill');
require('@electron/remote/main').initialize();
const TransportNodeHid = require('@ledgerhq/hw-transport-node-hid-noevents').default;
const AppBtc = require('@ledgerhq/hw-app-btc').default;

const {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  Menu,
} = require('electron');
const path = require('path');
const url = require('url');
const ipcLedger = require('./ipc-ledger');
const ipcSPV = require('./spv');
const ipcNSPV = require('./nspv');
const isDev = process.argv.indexOf('devmode') > -1;
const {createAdapter} = require('iocane');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nativeWindowOpen: true, // <-- important for trezor
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  require("@electron/remote/main").enable(mainWindow.webContents);

  require(path.join(__dirname, 'menu'));

  const staticMenu = Menu.buildFromTemplate([ // if static
    { role: 'copy' },
    { type: 'separator' },
    { role: 'selectall' },
  ]);

  const editMenu = Menu.buildFromTemplate([ // if editable
    { role: 'undo' },
    { role: 'redo' },
    { type: 'separator' },
    { role: 'cut' },
    { role: 'copy' },
    { role: 'paste' },
    { type: 'separator' },
    { role: 'selectall' },
  ]);

  const decodeStoredData = (str, pw) => {
    return new Promise((resolve, reject) => {
      if (str.length) {
        createAdapter()
        .decrypt(str, pw)
        .catch((err) => {
          console.log('decodeStoredData error', err);
          resolve(false);
        })
        .then(decryptedString => {
          //console.log('decryptedString', decryptedString);
          resolve(decryptedString);
        });
      } else {
        resolve(false);
      }
    });
  };

  const encodeStoredData = (str, pw) => {
    return new Promise((resolve, reject) => {
      createAdapter()
      .encrypt(str, pw)
      .catch((err) => {
        console.log('encodeStoredData error', err);
        resolve(false);
      })
      .then(encryptedString => {
        resolve(encryptedString);
      });
    });
  };

  global.app = {
    isDev,
    noFWCheck: true,
    blockchainAPI: process.argv.indexOf('api=spv') > -1 || process.argv.indexOf('api=nspv') > -1 ? 'spv' : 'insight',
    isNspv: process.argv.indexOf('api=nspv') > -1,
    helpers: {
      decodeStoredData,
      encodeStoredData,
    },
  };

  // and load the index.html of the app.
  if (isDev) {
    mainWindow.maximize();
    mainWindow.loadURL('http://localhost:3000/');
  } else {
    mainWindow.loadFile('ui/build/index.html');
  }

  // important: allow connect popup to open external links in default browser (wiki, wallet, bridge download...)
  mainWindow.webContents.on('new-window', (event, url, frameName, disposition, options, additionalFeatures) => {
    if (url.indexOf('connect.trezor.io') > 0) {
      event.preventDefault();
      const connectPopup = new BrowserWindow(options);
      event.newGuest = connectPopup;
      // handle external links from trezor-connect popup
      connectPopup.webContents.on('new-window', (event, url) => {
        event.preventDefault();
        shell.openExternal(url);
      });
    }
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  ipcLedger.setMainWindow(mainWindow);
  ipcSPV.setMainWindow(mainWindow);
  ipcNSPV.setMainWindow(mainWindow);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin' || isDev) {
    app.quit();
  }
});

app.on('activate', function() {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
app.on('browser-window-focus', (event, win) => {
  if (!win.isDevToolsOpened() && isDev) {
    win.openDevTools();
  }
});