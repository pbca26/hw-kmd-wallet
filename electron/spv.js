const network = require('./networks');
const bitcoin = require('bitgo-utxo-lib');
const async = require('async');

const electrumServersList = require('./electrum-servers');
const electrumJSCore = require('./electrumjs.core');
const transactionDecoder = require('./transaction-decoder');
const {ipcMain} = require('electron');
const cacheUtil = require('./cache');
const {
  asyncForEach,
  getRandomIntInclusive,
  checkTimestamp,
  pubToElectrumScriptHashHex,
  parseBlock,
  parseBlockToJSON,
  formatTransaction,
} = require('./spv-utils');

let mainWindow;
let cache = {};

(async function() {
  cache = await cacheUtil.loadLocalCache();
})();

const setMainWindow = (_mainWindow) => {
  mainWindow = _mainWindow;
};

// TODO: reconnect/cycle if electrum server is not responding

let electrumServers = {};

const getProtocolVersion = (_ecl) => {
  let protocolVersion;
  
  return new Promise((resolve, reject) => {
    _ecl.serverVersion('KMDHW')
    .then((serverData) => {
      if (serverData &&
          JSON.stringify(serverData).indexOf('server.version already sent') > -1) {
        if (process.argv.indexOf('spv-debug') > -1) console.log('server version already sent', 'ecl.manager');
        resolve('sent');
      }

      let serverVersion = 0;

      if (serverData &&
          typeof serverData === 'object' &&
          serverData[0] &&
          serverData[0].indexOf('ElectrumX') > -1 &&
          Number(serverData[1])
      ) {
        serverVersion = Number(serverData[1]);

        if (serverVersion) {            
          protocolVersion = Number(serverData[1]);
          _ecl.setProtocolVersion(protocolVersion.toString());
        }
      }

      if (serverData.hasOwnProperty('code') &&
          serverData.code === '-777') {
        resolve(-777);
      }

      if (process.argv.indexOf('spv-debug') > -1) console.log(`ecl ${`${_ecl.host}:${_ecl.port}:${_ecl.protocol || 'tcp'}`} protocol version: ${protocolVersion}`, 'ecl.manager');
      resolve(protocolVersion);
    });
  });
};

const eclManagerClear = (coin) => {
  if (coin) delete electrumServers[coin];
  electrumServers = {};
};

const getServer = async(coin, customServer) => {
  if (customServer && process.argv.indexOf('spv-debug') > -1) console.log(`custom server ${customServer.ip}:${customServer.port}:${customServer.proto}`, 'ecl.manager');
  if ((customServer && !electrumServers[coin][`${customServer.ip}:${customServer.port}:${customServer.proto}`]) ||
      !electrumServers[coin] ||
      (electrumServers[coin] && !Object.keys(electrumServers[coin]).length)) {
    let serverStr = '';

    if (!customServer) {
      const randomServerDefault = electrumServersList[coin][getRandomIntInclusive(0, electrumServersList[coin].length - 1)].split(':');
      console.log('randomServerDefault', randomServerDefault);
      serverStr = [
        randomServerDefault[0],
        randomServerDefault[1],
        randomServerDefault[2]
      ];
    } else {
      serverStr = [
        customServer.ip,
        customServer.port,
        customServer.proto
      ];
    }

    if (process.argv.indexOf('spv-debug') > -1) console.log('ecl server doesnt exist yet, lets add', 'ecl.manager')

    const ecl = new electrumJSCore(serverStr[1], serverStr[0], serverStr[2]);
    if (process.argv.indexOf('spv-debug') > -1) console.log(`ecl conn ${serverStr}`, 'ecl.manager');
    ecl.connect();
    if (process.argv.indexOf('spv-debug') > -1) console.log(`ecl req protocol ${serverStr}`, 'ecl.manager');
    const eclProtocolVersion = await getProtocolVersion(ecl);
    
    if (!electrumServers[coin]) {
      electrumServers[coin] = {};
    }

    electrumServers[coin][serverStr.join(':')] = {
      server: ecl,
      lastReq: Date.now(),
      lastPing: Date.now(),
    };

    return electrumServers[coin][serverStr.join(':')].server;
  } else {
    if (customServer) {
      if (process.argv.indexOf('spv-debug') > -1) console.log(`ecl ${coin} server exists, custom server param provided`, 'ecl.manager');
      let ecl = electrumServers[coin][`${customServer.ip}:${customServer.port}:${customServer.proto}`];
      ecl.lastReq = Date.now();
      return ecl.server;
    } else {
      if (process.argv.indexOf('spv-debug') > -1) console.log(`ecl ${coin} server exists`, 'ecl.manager');
      let ecl = Object.keys(electrumServers[coin]) > 1 ? electrumServers[coin][Object.keys(electrumServers[coin])[getRandomIntInclusive(0, Object.keys(electrumServers[coin]).length)]] : electrumServers[coin][Object.keys(electrumServers[coin])[0]];
      console.log('ecl server returned', coin);
      ecl.lastReq = Date.now();
      return ecl.server;
    }
  }
};

const initElectrumManager = () => {
  setInterval(() => {
    for (let coin in electrumServers) {
      if (process.argv.indexOf('spv-debug') > -1) console.log(`ecl check coin ${coin}`, 'ecl.manager');

      for (let serverStr in electrumServers[coin]) {
        const pingSecPassed = checkTimestamp(electrumServers[coin][serverStr].lastPing);
        if (process.argv.indexOf('spv-debug') > -1) console.log(`ping sec passed ${pingSecPassed}`, 'ecl.manager');
        
        if (pingSecPassed > PING_TIME) {
          if (process.argv.indexOf('spv-debug') > -1) console.log(`ecl ${coin} ${serverStr} ping limit passed, send ping`, 'ecl.manager');

          getProtocolVersion(electrumServers[coin][serverStr].server)
          .then((eclProtocolVersion) => {
            if (eclProtocolVersion === 'sent') {
              if (process.argv.indexOf('spv-debug') > -1) console.log(`ecl ${coin} ${serverStr} ping success`, 'ecl.manager');
              electrumServers[coin][serverStr].lastPing = Date.now();
            } else {
              if (process.argv.indexOf('spv-debug') > -1) console.log(`ecl ${coin} ${serverStr} ping fail, remove server`, 'ecl.manager');
              delete electrumServers[coin][serverStr];
            }
          });
        }

        const reqSecPassed = checkTimestamp(electrumServers[coin][serverStr].lastReq);
        if (process.argv.indexOf('spv-debug') > -1) console.log(`req sec passed ${reqSecPassed}`, 'ecl.manager');
        
        if (reqSecPassed > MAX_IDLE_TIME) {
          if (process.argv.indexOf('spv-debug') > -1) console.log(`ecl ${coin} ${serverStr} req limit passed, disconnect server`, 'ecl.manager');
          electrumServers[coin][serverStr].server.close();
          delete electrumServers[coin][serverStr];
        }
      }
    }

    //api.checkOpenElectrumConnections();
  }, CHECK_INTERVAL);
};

// eq to insight api/block/
const getCurrentBlock = (coin) => {
  return new Promise(async (resolve, reject) => {
    const ecl = await getServer(coin);
    
    ecl.blockchainHeadersSubscribe()
    .then((json) => {
      console.log('getCurrentBlock', parseBlockToJSON(parseBlock(json.hex)));
      resolve(parseBlockToJSON(parseBlock(json.hex)));
    });
  });
};

const getCurrentBlockNum = (coin) => {
  return new Promise(async (resolve, reject) => {
    const ecl = await getServer(coin);

    ecl.blockchainHeadersSubscribe()
    .then((json) => {
      console.log('getCurrentBlockNum', json.height);
      resolve(json.height);
    });
  });
};

const getBlock = (coin, height) => {
  return new Promise(async (resolve, reject) => {
    const ecl = await getServer(coin);
    
    ecl.blockchainBlockGetHeader(height)
    .then((json) => {
      try {
        parseBlockToJSON(parseBlock(json));
      } catch (e) {
        // handle
      }
      console.log('blockchainBlockGetHeader', parseBlockToJSON(parseBlock(json)));
      resolve(parseBlockToJSON(parseBlock(json)));
    });
  });
};

// eq to insight api/tx/
// TODO: parse vins
const getTransaction = (coin, txid, decode) => {
  return new Promise(async (resolve, reject) => {
    const ecl = await getServer(coin);      

    ecl.blockchainTransactionGet(txid)
    .then((json) => {
      try {
        transactionDecoder(json);
      } catch (e) {
        // handle
      }
      if (decode) json = transactionDecoder(json);
      console.log('getTransaction', json);
      resolve(json);
    });
  });
};

// eq to insight api/addrs/utxo
const getUtxo = (coin, address) => {
  return new Promise(async (resolve, reject) => {
    const ecl = await getServer(coin);
    const _address = ecl.protocolVersion && ecl.protocolVersion === '1.4' ? pubToElectrumScriptHashHex(address, network) : address;

    let _atLeastOneDecodeTxFailed = false;
  
    ecl.blockchainAddressListunspent(_address)
    .then((_utxoJSON) => {
      console.log(_utxoJSON)
      if (_utxoJSON) {
        let formattedUtxoList = [];
        let _utxo = [];

        getCurrentBlockNum(coin)
        .then((currentHeight) => {
          if (currentHeight &&
              Number(currentHeight) > 0) {
            // filter out unconfirmed utxos
            for (let i = 0; i < _utxoJSON.length; i++) {
              if (Number(currentHeight) - Number(_utxoJSON[i].height) !== 0) {
                _utxo.push(_utxoJSON[i]);
                console.log('utxo '+ i);
                console.log(_utxoJSON[i]);
              }
            }

            if (!_utxo.length) { // no confirmed utxo
              //resolve('no valid utxo');
              resolve([]);
            } else {
              Promise.all(_utxo.map((_utxoItem, index) => {
                return new Promise((resolve, reject) => {
                  const _resolveObj = {
                    txid: _utxoItem.tx_hash,
                    vout: _utxoItem.tx_pos,
                    address,
                    amount: Number(_utxoItem.value) * 0.00000001,
                    satoshis: _utxoItem.value,
                    confirmations: Number(_utxoItem.height) === 0 ? 0 : currentHeight - _utxoItem.height,
                    height: _utxoItem.height,
                    currentHeight,
                    spendable: true,
                    verified: false,
                    dpowSecured: false,
                  };
                  resolve(_resolveObj);
                });
              }))
              .then(promiseResult => {
                if (!_atLeastOneDecodeTxFailed) {
                  console.log(promiseResult, 'spv.listunspent');
                  resolve(promiseResult);
                } else {
                  console.log('listunspent error, cant decode tx(s)', 'spv.listunspent');
                  resolve('decode error');
                }
              });
            }
          } else {
            resolve('cant get current height');
          }
        });
      } else {
        resolve('Connection Error');
      }
    });
  });
};

// eq to insight addr/address/?noTxList=1 
const getAddress = (coin, address) => {
  return new Promise(async (resolve, reject) => {
    const ecl = await getServer(coin);
    const _address = ecl.protocolVersion && ecl.protocolVersion === '1.4' ? pubToElectrumScriptHashHex(address, network) : address;
    
    ecl.blockchainAddressGetHistory(_address)
    .then((json) => {
      console.log('getAddress', {
        txApperances: json.length,
        addrStr: address,
      });
      resolve({
        txApperances: json.length,
        addrStr: address,
      });
    });
  });
};

module.exports = {
  setMainWindow,
};