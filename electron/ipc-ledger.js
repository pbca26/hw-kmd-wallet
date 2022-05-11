require('babel-polyfill');
const TransportNodeHid = require('@ledgerhq/hw-transport-node-hid-noevents').default;
const AppBtc = require('@ledgerhq/hw-app-btc').default;
const {ipcMain} = require('electron');
const isDev = process.argv.indexOf('devmode') > -1;

let mainWindow;

const setMainWindow = (_mainWindow) => {
  mainWindow = _mainWindow;
};

function getAddress(derivationPath, verify) {
  return TransportNodeHid.open('')
    .then(transport => {
      const appBtc = new AppBtc(transport);
      return appBtc.getWalletPublicKey(derivationPath, verify).then(r =>
        transport
          .close()
          .catch(e => {})
          .then(() => r)
      );
    })
    .catch(e => {
      if (isDev) console.warn(e);
      return -777;
    });
}

function createPaymentTransactionNew(txData) {
  const {
    inputs,
    associatedKeysets,
    changePath,
    outputScriptHex,
    lockTime,
    additionals,
    expiryHeight,
  } = txData;

  return TransportNodeHid.open('')
    .then(transport => {
      const appBtc = new AppBtc(transport);
      return appBtc.createPaymentTransactionNew({
        inputs,
        associatedKeysets,
        changePath,
        outputScriptHex,
        lockTime,
        additionals,
        expiryHeight,
      }).then(r =>
        transport
          .close()
          .catch(e => {})
          .then(() => r)
      );
    })
    .catch(e => {
      if (isDev) console.warn(e);
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
      const appBtc = new AppBtc(transport);
      const txSplit = appBtc.splitTransaction(
        transactionHex,
        isSegwitSupported,
        hasTimestamp,
        hasExtraData,
        additionals,
      );
      if (isDev) console.log(txSplit);
      transport.close();
      return txSplit;
    })
    .catch(e => {
      if (isDev) console.warn(e);
      return -777;
    });
}

ipcMain.on('getAddress', (e, {derivationPath, ruid}) => {
  if (isDev) console.log(derivationPath);

  if (mainWindow) {
    getAddress(derivationPath, false).then(result => {
      mainWindow.webContents.send('getAddress', {ruid, result});
    });
  }
});

ipcMain.on('createPaymentTransactionNew', (e, {txData, ruid}) => {
  if (isDev) console.log(txData);

  if (mainWindow) {
    createPaymentTransactionNew(txData).then(result => {
      mainWindow.webContents.send('createPaymentTransactionNew', {ruid, result});
    });
  }
});

ipcMain.on('splitTransaction', (e, {txData, ruid}) => {
  if (isDev) console.log(txData);

  if (mainWindow) {
    splitTransaction(txData).then(result => {
      mainWindow.webContents.send('splitTransaction', {ruid, result});
    });
  }
});

module.exports = {
  setMainWindow,
};