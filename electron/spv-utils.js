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

module.exports = {
  asyncForEach,
  getRandomIntInclusive,
  checkTimestamp,
  pubToElectrumScriptHashHex,
  parseBlock,
  parseBlockToJSON,
};