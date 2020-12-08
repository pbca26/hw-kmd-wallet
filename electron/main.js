// Modules to control application life and create native browser window
require('babel-polyfill');
const TransportNodeHid = require('@ledgerhq/hw-transport-node-hid').default;
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

function getAddress(derivationPath, verify) {
  return TransportNodeHid.open('')
    .then(transport => {
      transport.setDebugMode(true);
      const appBtc = new AppBtc(transport);
      return appBtc.getWalletPublicKey(derivationPath, verify).then(r =>
        transport
          .close()
          .catch(e => {})
          .then(() => r)
      );
    })
    .catch(e => {
      console.warn(e);
      return -777;
    });
}

function createPaymentTransactionNew(txData) {
  const {
    inputs,
    associatedKeysets,
    changePath,
    outputScript,
    lockTime,
    sigHashType,
    segwit,
    initialTimestamp,
    additionals,
    expiryHeight,
  } = txData;

  return TransportNodeHid.open('')
    .then(transport => {
      transport.setDebugMode(true);
      const appBtc = new AppBtc(transport);
      return appBtc.createPaymentTransactionNew(
        inputs,
        associatedKeysets,
        changePath,
        outputScript,
        lockTime,
        sigHashType,
        segwit,
        initialTimestamp,
        additionals,
        expiryHeight,
      ).then(r =>
        transport
          .close()
          .catch(e => {})
          .then(() => r)
      );
    })
    .catch(e => {
      console.warn(e);
      return -777;
    });
}

function splitTransaction(txData) {
  const {
    transactionHex,
    isSegwitSupported,
    hasTimestamp,
    hasExtraData,
    additionals,
  } = txData;

  return TransportNodeHid.open('')
    .then(transport => {
      transport.setDebugMode(true);
      const appBtc = new AppBtc(transport);
      const txSplit = appBtc.splitTransaction(
        transactionHex,
        isSegwitSupported,
        hasTimestamp,
        hasExtraData,
        additionals,
      );
      console.log(txSplit);
      transport.close();
      return txSplit;
    })
    .catch(e => {
      console.warn(e);
      return -777;
    });
}

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
    },
  });

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

  global.app = {
    isDev: process.argv.indexOf('devmode') > -1,
    noFWCheck: true,
  };

  // and load the index.html of the app.
  if (process.argv.indexOf('devmode') > -1) {
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

  ipcMain.on('getAddress', (e, {ruid, derivationPath}) => {
    console.log(derivationPath);

    if (mainWindow) {
      getAddress(derivationPath, false).then(result => {
        mainWindow.webContents.send('getAddress', {ruid, result});
      });
    }
  });

  ipcMain.on('createPaymentTransactionNew', (e, {ruid, txData}) => {
    console.log(txData);

    if (mainWindow) {
      createPaymentTransactionNew(txData).then(result => {
        mainWindow.webContents.send('createPaymentTransactionNew', {ruid, result});
      });
    }
  });

  ipcMain.on('splitTransaction', (e, {ruid, txData}) => {
    console.log(txData);

    if (mainWindow) {
      splitTransaction(txData).then(result => {
        mainWindow.webContents.send('splitTransaction', {ruid, result});
      });
    }
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin' || process.argv.indexOf('devmode') > -1) {
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
  if (!win.isDevToolsOpened() && process.argv.indexOf('devmode') > -1) {
      win.openDevTools();
  }
});
