// TODO: account discovery progess indication

import {
  ipcRenderer,
  isElectron,
} from '../Electron';

let coin = 'kmd';
let data = {};
let pendingCalls = {};
let ruid = 0;
let intervals = {};

setInterval(() => {
  console.warn('pendingCalls', pendingCalls);
}, 1000);

if (isElectron) {
  ipcRenderer.on('spvGetAddress', (event, arg) => {
    console.warn('spvGetAddress arg', arg);
    if (arg === -777) console.warn('spvGetAddress', 'failed!');
    else data[arg.ruid] = arg.result;
  });

  ipcRenderer.on('spvGetUtxo', (event, arg) => {
    console.warn('spvGetUtxo arg', arg);
    if (arg === -777) console.warn('spvGetUtxo', 'failed!');
    else data[arg.ruid] = arg.result;
  });

  ipcRenderer.on('spvGetHistory', (event, arg) => {
    console.warn('spvGetHistory arg', arg);
    if (arg === -777) console.warn('spvGetHistory', 'failed!');
    else data[arg.ruid] = arg.result;
  });

  ipcRenderer.on('spvGetCurrentBlock', (event, arg) => {
    console.warn('spvGetCurrentBlock arg', arg);
    if (arg === -777) console.warn('spvGetCurrentBlock', 'failed!');
    else data[arg.ruid] = arg.result;
  });

  ipcRenderer.on('spvGetRawTransaction', (event, arg) => {
    console.warn('spvGetRawTransaction arg', arg);
    if (arg === -777) console.warn('spvGetRawTransaction', 'failed!');
    else data[arg.ruid] = arg.result;
  });

  ipcRenderer.on('spvGetTransaction', (event, arg) => {
    console.warn('spvGetTransaction arg', arg);
    if (arg === -777) console.warn('spvGetTransaction', 'failed!');
    else data[arg.ruid] = arg.result;
  });

  ipcRenderer.on('spvBroadcastTransaction', (event, arg) => {
    console.warn('spvBroadcastTransaction arg', arg);
    if (arg === -777) console.warn('spvBroadcastTransaction', 'failed!');
    else data[arg.ruid] = arg.result;
  });
}

// return data only when it was sent over from ipc main proc
const getData = (ruid, payload) => {
  return new Promise((resolve, reject) => {
    if (!data[ruid]) {
      console.warn(`data ruid ${ruid} not available yet, set interval`, ruid);

      intervals[ruid] = setInterval((ruid) => {
        if (data[ruid]) {
          console.warn(`data ruid ${ruid} available, clear interval`, data[ruid]);
          clearInterval(intervals[ruid]);
          delete pendingCalls[ruid];
          resolve(data[ruid]);
        } else {
          pendingCalls[ruid] = payload;
        }
      }, 100, ruid);
    } else {
      console.warn(`data ruid ${ruid} available`, data[ruid]);
      delete pendingCalls[ruid];
      resolve(data[ruid]);
    }
  });
};

const setCoin = (name) => {
  coin = name.toLowerCase();
};

const getAddress = address => {
  console.warn(`spv ${coin}`, `getAddress for ${address}`);
  ruid++;
  ipcRenderer.send('spvGetAddress', {coin, address, ruid});

  return new Promise(async(resolve, reject) => {
    const _data = await getData(ruid, {coin, type: 'getAddress', address});
    console.warn('spvGetAddress ready', _data);
    resolve(_data);
  });
}

//const getAddressHistory = (address) => get(`/txs?address=${address}`);

//const getHistory = addresses => get(`addrs/txs`, {addrs: addresses.join(',')});

const getHistory = addresses => {
  console.warn(`spv ${coin}`, `getHistory for ${addresses.join(',')}`);
  ruid++;
  ipcRenderer.send('spvGetHistory', {coin, addresses, ruid});

  return new Promise(async(resolve, reject) => {
    const _data = await getData(ruid, {coin, type: 'getHistory', addresses});
    console.warn('spvGetHistory ready', _data);
    resolve(_data);
  });

  //get(`addrs/utxo`, {addrs: addresses.join(',')});
}

const getUtxos = addresses => {
  console.warn(`spv ${coin}`, `getUtxo for ${addresses.join(',')}`);
  ruid++;
  ipcRenderer.send('spvGetUtxo', {coin, addresses, ruid});

  return new Promise(async(resolve, reject) => {
    const _data = await getData(ruid, {coin, type: 'getUtxos', addresses, ruid});
    console.warn('spvGetUtxo ready', _data);
    resolve(_data);
  });

  //get(`addrs/utxo`, {addrs: addresses.join(',')});
}

const getTransaction = txid => {
  console.warn(`spv ${coin}`, 'getTransaction');
  ruid++;
  ipcRenderer.send('spvGetTransaction', {coin, ruid, txid});

  return new Promise(async(resolve, reject) => {
    const _data = await getData(ruid, {coin, type: 'getTransaction', txid});
    console.warn('spvGetTransaction ready', _data);
    resolve(_data);
  });

  //get(`tx/${txid}`);
};

const getRawTransaction = txid => {
  console.warn(`spv ${coin}`, 'getRawTransaction');
  ruid++;
  ipcRenderer.send('spvGetRawTransaction', {coin, ruid, txid});

  return new Promise(async(resolve, reject) => {
    const _data = await getData(ruid, {coin, type: 'getRawTransaction', txid});
    console.warn('spvGetRawTransaction ready', _data);
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
  console.warn(`spv ${coin}`, 'getTipTime');
  ruid++;
  ipcRenderer.send('spvGetCurrentBlock', {coin, ruid});

  return new Promise(async(resolve, reject) => {
    const _data = await getData(ruid, {coin, type: 'getTipTime'});
    console.warn('spvGetCurrentBlock ready', _data);
    resolve(_data.timestamp);
  });
};

const broadcast = async (rawtx) => {
  console.warn(`spv ${coin}`, 'broadcast');
  ruid++;
  ipcRenderer.send('spvBroadcastTransaction', {coin, ruid, rawtx});

  return new Promise(async(resolve, reject) => {
    const _data = await getData(ruid);
    console.warn('spvBroadcastTransaction ready', _data);
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
