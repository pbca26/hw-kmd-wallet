const network = require('./networks');
const bitcoin = require('bitgo-utxo-lib');

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

const checkTimestamp = (dateToCheck, currentEpochTime = Date.now() / 1000) => {
  const secondsElapsed = Number(currentEpochTime) - Number(dateToCheck / 1000);

  return Math.floor(secondsElapsed);
};

const getRandomIntInclusive = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);

  return Math.floor(Math.random() * (max - min + 1)) + min; // the maximum is inclusive and the minimum is inclusive
};

const pubToElectrumScriptHashHex = (address, network) => {
  const script = bitcoin.address.toOutputScript(address, network);  
  const hash = bitcoin.crypto.sha256(script);

  return hash.reverse().toString('hex');
};

const parseBlock = (hex) => {
  const block = bitcoin.Block.fromBuffer(new Buffer.from(hex, 'hex'), network, true);
  return block;
};

const parseBlockToJSON = (hex, network) => {
  if (typeof hex === 'string') {            
    hex = parseBlock(hex, network);

    if (hex.hasOwnProperty('merkle_root')) {
      hex.merkleRoot = hex.merkle_root;
      delete hex.merkle_root;
    }

    for (let key in hex) {
      if (typeof hex[key] === 'object') {
        hex[key] = key !== 'solution' ? hex[key].reverse().toString('hex') : hex[key].toString('hex');
      }
    }
  }

  return hex;
};

const formatTransaction = (tx) => {
  return {
    txid: tx.format.txid,
    version: tx.format.version,
    locktime: tx.format.locktime,
    vin: tx.inputs,
    vout: tx.outputs,
    time: tx.timestamp,
    blocktime: tx.timestamp,
    confirmations: tx.confirmations,
    blockheight: tx.height,
    fOverwintered: tx.tx.overwintered ? true : false,
    nVersionGroupId: tx.tx.versionGroupId,
    nExpiryHeight: tx.tx.expiryHeight,
  };
};

// format electrum like utxo list in insight compatible format
const normalizeListTransactions = (txs) => {
  let _txs = [];

  for (let i = 0; i < txs.length; i++) {
    _txs.push({
      txid: txs[i].format.txid,
      version: txs[i].format.version,
      locktime: txs[i].format.locktime,
      vin: txs[i].inputs,
      vout: txs[i].outputs,
      time: txs[i].timestamp,
      blocktime: txs[i].timestamp,
      confirmations: txs[i].confirmations,
      blockheight: txs[i].height,
      fOverwintered: txs[i].tx.overwintered ? true : false,
      nVersionGroupId: txs[i].tx.versionGroupId,
      nExpiryHeight: txs[i].tx.expiryHeight,
    });
  }

  return _txs;
};

const getUniqueHistory = txs => {
  let uniqueTxs = [];
  let uniqueTxids = [];

  for (let i = 0; i < txs.length; i++) {
    if (uniqueTxids.indexOf(txs[i].txid) === -1) {
      uniqueTxids.push(txs[i].txid);
      uniqueTxs.push(txs[i]);
    }
  }

  console.warn(`total tx in history ${txs.length} | unique txs ${uniqueTxids.length}`);
  
  return uniqueTxs;
};

module.exports = {
  asyncForEach,
  getRandomIntInclusive,
  checkTimestamp,
  pubToElectrumScriptHashHex,
  parseBlock,
  parseBlockToJSON,
  formatTransaction,
  normalizeListTransactions,
  getUniqueHistory,
};