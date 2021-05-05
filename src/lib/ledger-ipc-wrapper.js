import {
  ipcRenderer,
  isElectron,
} from '../Electron';

let data = {};
let ruid = 0;
let intervals = {};
let pendingCalls = {};

// return data only when it was sent over from ipc main proc
const getData = (ruid, payload) => {
  return new Promise((resolve, reject) => {
    if (!data[ruid]) {
      console.warn(`ledger data ruid ${ruid} not available yet, set interval`, ruid);

      intervals[ruid] = setInterval((ruid) => {
        if (data[ruid]) {
          console.warn(`ledger data ruid ${ruid} available, clear interval`, data[ruid]);
          clearInterval(intervals[ruid]);
          delete pendingCalls[ruid];
          resolve(data[ruid]);
        } else {
          pendingCalls[ruid] = payload;
        }
      }, 100, ruid);
    } else {
      console.warn(`ledger data ruid ${ruid} available`, data[ruid]);
      delete pendingCalls[ruid];
      resolve(data[ruid]);
    }
  });
};

if (isElectron) {
  ipcRenderer.on('getAddress', (event, arg) => {
    console.warn('getAddress arg', arg);
    console.warn('arg.bitcoinAddress', arg.bitcoinAddress);
    if (arg === -777) resolve(false);
    else data[arg.ruid] = arg.result;
  });

  ipcRenderer.on('createPaymentTransactionNew', (event, arg) => {
    console.warn('createPaymentTransactionNew arg', arg);
    if (arg === -777) resolve(false);
    else data[arg.ruid] = arg.result;
  });

  ipcRenderer.on('splitTransaction', (event, arg) => {
    console.warn('splitTransaction arg', arg);
    if (arg === -777) resolve(false);
    else data[arg.ruid] = arg.result;
  });
}

// wrap ledger methods using ipc renderer
const getDevice = async () => {
  return {
    getWalletPublicKey: (derivationPath) => {
      console.warn(`ledger getWalletPublicKey`);
      ruid++;
      ipcRenderer.send('getAddress', {derivationPath, ruid});
      
      return new Promise(async(resolve, reject) => {
        const _data = await getData(ruid);
        console.warn('ledger getAddress ready', _data);
        resolve(_data);
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
      console.warn(`ledger createPaymentTransactionNew`);
      ruid++;
      ipcRenderer.send('createPaymentTransactionNew', {txData: {
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
      }, ruid});

      return new Promise(async(resolve, reject) => {
        const _data = await getData(ruid);
        console.warn('ledger createPaymentTransactionNew ready', _data);
        resolve(_data);
      });
    },
    splitTransaction: (
      transactionHex,
      isSegwitSupported,
      hasTimestamp,
      hasExtraData,
      additionals,
    ) => {
      console.warn(`ledger splitTransaction`);
      ruid++;
      ipcRenderer.send('splitTransaction', {txData: {
        transactionHex,
        isSegwitSupported,
        hasTimestamp,
        hasExtraData,
        additionals,
      }, ruid});

      return new Promise(async(resolve, reject) => {
        const _data = await getData(ruid);
        console.warn('ledger splitTransaction ready', _data);
        resolve(_data);
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