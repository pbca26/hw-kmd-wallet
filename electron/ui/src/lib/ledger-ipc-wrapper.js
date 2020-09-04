import {ipcRenderer} from '../Electron';

// wrap ledger methods using ipc renderer
const getDevice = async () => {
  return {
    getWalletPublicKey: (derivationPath) => {
      return new Promise((resolve, reject) => {
        ipcRenderer.on('getAddress', (event, arg) => {
          console.warn('getAddress arg', arg);
          console.warn('arg.bitcoinAddress', arg.bitcoinAddress);
          if (arg === -777) resolve(false);
          resolve(arg);
        });
        ipcRenderer.send('getAddress', derivationPath);
      });
    },
    createPaymentTransactionNew: (
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
    ) => {
      return new Promise((resolve, reject) => {
        ipcRenderer.on('createPaymentTransactionNew', (event, arg) => {
          console.warn('createPaymentTransactionNew arg', arg);
          if (arg === -777) resolve(false);
          resolve(arg);
        });
        ipcRenderer.send('createPaymentTransactionNew', {
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
        });
      });
    },
    splitTransaction: (
      transactionHex,
      isSegwitSupported,
      hasTimestamp,
      hasExtraData,
      additionals,
    ) => {
      return new Promise((resolve, reject) => {
        ipcRenderer.on('splitTransaction', (event, arg) => {
          console.warn('splitTransaction arg', arg);
          if (arg === -777) resolve(false);
          resolve(arg);
        });
        ipcRenderer.send('splitTransaction', {
          transactionHex,
          isSegwitSupported,
          hasTimestamp,
          hasExtraData,
          additionals,
        });
      });
    },
    close: () => {},
  };
};

const isAvailable = async () => {
  const ledger = await getDevice();

  try {
    const res = await ledger.getWalletPublicKey(`m/44'/141'/0'/0/0`, {
      verify: window.location.href.indexOf('ledger-ble') > -1,
    });
    await ledger.close();
    if (res) {
      console.warn('device available');
      return true;
    } else {
      console.warn('device unavailable');
      return false;
    }
  } catch (error) {
    console.warn('isAvailable error', error);
    return false;
  }
};

const ledgerIpcWrapper = {
  getDevice,
  isAvailable,
};

export default ledgerIpcWrapper;