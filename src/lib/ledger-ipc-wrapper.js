import {
  ipcRenderer,
  isElectron,
} from '../Electron';
import {writeLog} from '../Debug';
import {COIN_DERIVATION_PATH} from '../constants';

let data = {};
let ruid = 0;
let intervals = {};
let pendingCalls = {};

const wrapIpcRendererSend = (cmd, payload) => {
  ruid++;
  payload.ruid = ruid;
  ipcRenderer.send(cmd, payload);
}

// return data only when it was sent over from ipc main proc
const getData = (ruid, payload) => {
  return new Promise((resolve, reject) => {
    if (!data[ruid]) {
      writeLog(`ledger data ruid ${ruid} not available yet, set interval`, ruid);

      intervals[ruid] = setInterval(ruid => {
        if (data[ruid]) {
          writeLog(`ledger data ruid ${ruid} available, clear interval`, data[ruid]);
          clearInterval(intervals[ruid]);
          delete pendingCalls[ruid];
          resolve(data[ruid]);
        } else {
          pendingCalls[ruid] = payload;
        }
      }, 100, ruid);
    } else {
      writeLog(`ledger data ruid ${ruid} available`, data[ruid]);
      delete pendingCalls[ruid];
      resolve(data[ruid]);
    }
  });
};

if (isElectron) {
  ipcRenderer.on('getAddress', (event, arg) => {
    writeLog('getAddress arg', arg);
    writeLog('arg.bitcoinAddress', arg.bitcoinAddress);
    if (arg === -777) data[arg.ruid] = false;
    else data[arg.ruid] = arg.result;
  });

  ipcRenderer.on('createPaymentTransactionNew', (event, arg) => {
    writeLog('createPaymentTransactionNew arg', arg);
    if (arg === -777) data[arg.ruid] = false;
    else data[arg.ruid] = arg.result;
  });

  ipcRenderer.on('splitTransaction', (event, arg) => {
    writeLog('splitTransaction arg', arg);
    if (arg === -777) data[arg.ruid] = false;
    else data[arg.ruid] = arg.result;
  });
}

// wrap ledger methods using ipc renderer
const getDevice = async () => {
  return {
    getWalletPublicKey: derivationPath => {
      writeLog('ledger getWalletPublicKey');
      wrapIpcRendererSend('getAddress', {derivationPath});
      
      return new Promise(async(resolve, reject) => {
        const _data = await getData(ruid);
        writeLog('ledger getAddress ready', _data);
        resolve(_data);
      });
    },
    createPaymentTransactionNew: ({
      inputs,
      associatedKeysets,
      changePath,
      outputScriptHex,
      lockTime,
      additionals,
      expiryHeight,
    }) => {
      writeLog('ledger createPaymentTransactionNew');
      wrapIpcRendererSend('createPaymentTransactionNew', {
        txData: {
          inputs,
          associatedKeysets,
          changePath,
          outputScriptHex,
          lockTime,
          additionals,
          expiryHeight,
        },
      });

      return new Promise(async (resolve, reject) => {
        const _data = await getData(ruid);
        writeLog('ledger createPaymentTransactionNew ready', _data);
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
      writeLog('ledger splitTransaction');
      wrapIpcRendererSend('splitTransaction', {
        txData: {
        transactionHex,
        isSegwitSupported,
        hasTimestamp,
        hasExtraData,
        additionals,
        },
        ruid
      });

      return new Promise(async (resolve, reject) => {
        const _data = await getData(ruid);
        writeLog('ledger splitTransaction ready', _data);
        resolve(_data);
      });
    },
    close: () => {},
  };
};

const isAvailable = async () => {
  const ledger = await getDevice();

  try {
    const res = await ledger.getWalletPublicKey(`m/${COIN_DERIVATION_PATH}/0'/0/0`, {
      verify: window.location.href.indexOf('ledger-ble') > -1,
    });
    await ledger.close();
    if (res) {
      writeLog('device available');
      return true;
    } else {
      writeLog('device unavailable');
      return false;
    }
  } catch (error) {
    writeLog('isAvailable error', error);
    return false;
  }
};

const ledgerIpcWrapper = {
  getDevice,
  isAvailable,
};

export default ledgerIpcWrapper;