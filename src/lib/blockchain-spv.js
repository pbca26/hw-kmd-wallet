// TODO: account discovery progess indication

import {
  ipcRenderer,
  isElectron,
} from '../Electron';
import {writeLog} from '../Debug';

let coin = 'kmd';
let data = {};
let pendingCalls = {};
let ruid = 0;
let intervals = {};

if (isElectron) {
  setInterval(() => {
    writeLog('pendingCalls', pendingCalls);
  }, 1000);
  
  ipcRenderer.on('spvGetAddress', (event, arg) => {
    writeLog('spvGetAddress arg', arg);
    if (arg === -777) writeLog('spvGetAddress', 'failed!');
    else data[arg.ruid] = arg.result;
  });

  ipcRenderer.on('spvGetUtxo', (event, arg) => {
    writeLog('spvGetUtxo arg', arg);
    if (arg === -777) writeLog('spvGetUtxo', 'failed!');
    else data[arg.ruid] = arg.result;
  });

  ipcRenderer.on('spvGetHistory', (event, arg) => {
    writeLog('spvGetHistory arg', arg);
    if (arg === -777) writeLog('spvGetHistory', 'failed!');
    else data[arg.ruid] = arg.result;
  });

  ipcRenderer.on('spvGetCurrentBlock', (event, arg) => {
    writeLog('spvGetCurrentBlock arg', arg);
    if (arg === -777) writeLog('spvGetCurrentBlock', 'failed!');
    else data[arg.ruid] = arg.result;
  });

  ipcRenderer.on('spvGetRawTransaction', (event, arg) => {
    writeLog('spvGetRawTransaction arg', arg);
    if (arg === -777) writeLog('spvGetRawTransaction', 'failed!');
    else data[arg.ruid] = arg.result;
  });

  ipcRenderer.on('spvGetTransaction', (event, arg) => {
    writeLog('spvGetTransaction arg', arg);
    if (arg === -777) writeLog('spvGetTransaction', 'failed!');
    else data[arg.ruid] = arg.result;
  });

  ipcRenderer.on('spvBroadcastTransaction', (event, arg) => {
    writeLog('spvBroadcastTransaction arg', arg);
    if (arg === -777) writeLog('spvBroadcastTransaction', 'failed!');
    else data[arg.ruid] = arg.result;
  });
}

// return data only when it was sent over from ipc main proc
const getData = (ruid, payload) => {
  return new Promise((resolve, reject) => {
    if (!data[ruid]) {
      writeLog(`data ruid ${ruid} not available yet, set interval`, ruid);

      intervals[ruid] = setInterval((ruid) => {
        if (data[ruid]) {
          writeLog(`data ruid ${ruid} available, clear interval`, data[ruid]);
          clearInterval(intervals[ruid]);
          delete pendingCalls[ruid];
          resolve(data[ruid]);
        } else {
          pendingCalls[ruid] = payload;
        }
      }, 100, ruid);
    } else {
      writeLog(`data ruid ${ruid} available`, data[ruid]);
      delete pendingCalls[ruid];
      resolve(data[ruid]);
    }
  });
};

const setCoin = (name) => {
  coin = name.toLowerCase();
};

const getAddress = address => {
  writeLog(`spv ${coin}`, `getAddress for ${address}`);
  ruid++;
  ipcRenderer.send('spvGetAddress', {coin, address, ruid});

  return new Promise(async(resolve, reject) => {
    const _data = await getData(ruid, {coin, type: 'getAddress', address});
    writeLog('spvGetAddress ready', _data);
    resolve(_data);
  });
}

//const getAddressHistory = (address) => get(`/txs?address=${address}`);

//const getHistory = addresses => get(`addrs/txs`, {addrs: addresses.join(',')});

const getHistory = addresses => {
  writeLog(`spv ${coin}`, `getHistory for ${addresses.join(',')}`);
  ruid++;
  ipcRenderer.send('spvGetHistory', {coin, addresses, ruid});

  return new Promise(async(resolve, reject) => {
    const _data = await getData(ruid, {coin, type: 'getHistory', addresses});
    writeLog('spvGetHistory ready', _data);
    resolve(_data);
  });

  //get(`addrs/utxo`, {addrs: addresses.join(',')});
}

const getUtxos = addresses => {
  writeLog(`spv ${coin}`, `getUtxo for ${addresses.join(',')}`);
  ruid++;
  ipcRenderer.send('spvGetUtxo', {coin, addresses, ruid});

  return new Promise(async(resolve, reject) => {
    const _data = await getData(ruid, {coin, type: 'getUtxos', addresses, ruid});
    writeLog('spvGetUtxo ready', _data);
    resolve(_data);
  });

  //get(`addrs/utxo`, {addrs: addresses.join(',')});
}

const getTransaction = txid => {
  writeLog(`spv ${coin}`, 'getTransaction');
  ruid++;
  ipcRenderer.send('spvGetTransaction', {coin, ruid, txid});

  return new Promise(async(resolve, reject) => {
    const _data = await getData(ruid, {coin, type: 'getTransaction', txid});
    writeLog('spvGetTransaction ready', _data);
    resolve(_data);
  });

  //get(`tx/${txid}`);
};

const getRawTransaction = txid => {
  writeLog(`spv ${coin}`, 'getRawTransaction');
  ruid++;
  ipcRenderer.send('spvGetRawTransaction', {coin, ruid, txid});

  return new Promise(async(resolve, reject) => {
    const _data = await getData(ruid, {coin, type: 'getRawTransaction', txid});
    writeLog('spvGetRawTransaction ready', _data);
    resolve({rawtx: _data});
  });

  //get(`rawtx/${txid}`);
};

/*const getTipTime = async () => {
  const {bestblockhash} = await getBestBlockHash();
  const block = await getBlock(bestblockhash);

  return block.time;
};*/
const getTipTime = async () => {
  writeLog(`spv ${coin}`, 'getTipTime');
  ruid++;
  ipcRenderer.send('spvGetCurrentBlock', {coin, ruid});

  return new Promise(async(resolve, reject) => {
    const _data = await getData(ruid, {coin, type: 'getTipTime'});
    writeLog('spvGetCurrentBlock ready', _data);
    resolve(_data.timestamp);
  });
};

const broadcast = async (rawtx) => {
  writeLog(`spv ${coin}`, 'broadcast');
  ruid++;
  ipcRenderer.send('spvBroadcastTransaction', {coin, ruid, rawtx});

  return new Promise(async(resolve, reject) => {
    const _data = await getData(ruid);
    writeLog('spvBroadcastTransaction ready', _data);
    resolve(_data);
  });
};

//const broadcast = transaction => get('tx/send', {rawtx: transaction});

const blockchain = {
  getAddress,
  getUtxos,
  //getAddressHistory,
  getHistory,
  getTransaction,
  getRawTransaction,
  getTipTime,
  broadcast,
  setCoin,
};

export default blockchain;
