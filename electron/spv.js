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
  normalizeListTransactions,
  getUniqueHistory,
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

// eq to insight api/addrs/txs
// TODO: parse vins
const getHistory = (coin, address) => {
  return new Promise(async(resolve, reject) => {
    const _maxlength = 10;
    const coinLc = coin.toLowerCase()
    const ecl = await getServer(coin);
    const _address = ecl.protocolVersion && ecl.protocolVersion === '1.4' ? pubToElectrumScriptHashHex(address, network) : address;
    
    console.log('electrum get_transactions ==>', 'spv.get_transactions');
    
    // !expensive call!
    // TODO: limit e.g. 1-10, 10-20 etc
    const MAX_TX = _maxlength || 10;
    
    getCurrentBlockNum(coin)
    .then((currentHeight) => {
      if (currentHeight &&
          Number(currentHeight) > 0) {
        ecl.blockchainAddressGetHistory(_address)
        .then(async(json) => {
          if (json &&
              json.length) {
            let _rawtx = [];
            
            console.log(json.length, 'spv.get_transactions');
            //let index = 0;

            // callback hell, use await?
            await asyncForEach(json, async (transaction, index) => {
              await getBlock(
                coin,
                transaction.height
              )
              .then(async(blockInfo) => {
                console.log('blockinfo.timestamp', blockInfo.timestamp);
                if (blockInfo &&
                    blockInfo.timestamp) {
                  //if (transaction.height === 'pending') transaction.height = currentHeight;
                  
                  await getTransaction(
                    coin,
                    transaction.tx_hash
                  )
                  .then(async(_rawtxJSON) => {
                    // if (transaction.height === 'pending') transaction.height = currentHeight;
                    
                    console.log('electrum gettransaction ==>', 'spv.get_transactions');
                    console.log((index + ' | ' + (_rawtxJSON.length - 1)), 'spv.get_transactions');
                    // console.log(_rawtxJSON, 'spv.get_transactions');

                    // decode tx
                    let decodedTx = transactionDecoder(_rawtxJSON);
                    decodedTx.timestamp = blockInfo.timestamp;
                    decodedTx.height = transaction.height;
                    decodedTx.confirmations = Number(transaction.height) === 0 ? 0 : currentHeight - transaction.height;
                    //console.log('decodedTx', decodedTx);

                    console.log(`decodedtx network ${coin}`, 'spv.get_transactions');

                    console.log('decodedtx =>', 'spv.get_transactions');
                    // console.log(decodedTx.outputs, 'spv.get_transactions');
                    // collect vin amounts
                    //console.log(JSON.stringify(decodedTx.inputs, null, 2));
                    //console.log(JSON.stringify(decodedTx.outputs, null, 2));
                    await asyncForEach(decodedTx.inputs, async (input, index) => {
                      await getTransaction(
                        coin,
                        input.txid
                      )
                      .then((inputRawtxJSON) => {
                        console.log(`input index ${index}, n ${input.n}`);
                        const decodedInputTx = transactionDecoder(inputRawtxJSON);
                        
                        decodedTx.inputs[index].satoshi = decodedInputTx.outputs[input.n].satoshi;
                        decodedTx.inputs[index].value = decodedInputTx.outputs[input.n].value;
                        decodedTx.inputs[index].addr = decodedInputTx.outputs[input.n].scriptPubKey.addresses[0];
                      });
                    });
                    _rawtx.push(decodedTx);
                  });
                } else {
                  const _parsedTx = {
                    network: 'cant parse',
                    format: 'cant parse',
                    inputs: 'cant parse',
                    outputs: 'cant parse',
                    height: transaction.height,
                    timestamp: 'cant get block info',
                    confirmations: Number(transaction.height) === 0 ? 0 : currentHeight - transaction.height,
                  };
                  _rawtx.push(_parsedTx);
                }
              });
            });
            console.log('async done');
            resolve(_rawtx);
          } else {
            resolve(_rawtx);
          }
        });
      } else {
        resolve('Connection Errror');
      }
    });
  });
};

// eq to insight api/tx/send
// TODO: parse vins
const broadcastTx = async(coin, rawtx) => {
  return new Promise(async(resolve, reject) => {
    const ecl = await getServer(coin);

    ecl.blockchainTransactionBroadcast(rawtx)
    .then((json) => {
      console.log('rawtx', rawtx);
      console.log('electrum pushtx ==>', 'spv.pushtx');
      console.log(json, 'spv.pushtx');

      if (json &&
          JSON.stringify(json).indexOf('fee not met') > -1) {
        resolve(json);
        /*const retObj = {
          msg: 'error',
          result: 'Missing fee',
        };*/

        res.end(JSON.stringify(retObj));
      } else if (
        json &&
        JSON.stringify(json).indexOf('the transaction was rejected by network rules') > -1
      ) {
        resolve(json);
        /*const retObj = {
          msg: 'error',
          result: json,
        };*/
        res.end(JSON.stringify(retObj));
      } else if (
        json &&
        JSON.stringify(json).indexOf('bad-txns-inputs-spent') > -1
      ) {
        resolve(json);
        /*const retObj = {
          msg: 'error',
          result: 'Bad transaction inputs spent',
        };*/
      } else if (
        json &&
        json.length === 64
      ) {
        if (JSON.stringify(json).indexOf('bad-txns-in-belowout') > -1) {
          resolve(json);
          /*const retObj = {
            msg: 'error',
            result: 'Bad transaction inputs spent',
          };

          res.end(JSON.stringify(retObj));*/
        } else {
          resolve({txid: json});
        }
      } else if (
        json &&
        JSON.stringify(json).indexOf('bad-txns-in-belowout') > -1
      ) {
        resolve(json);
        /*const retObj = {
          msg: 'error',
          result: 'Bad transaction inputs spent',
        };

        res.end(JSON.stringify(retObj));*/
      } else {
        resolve(json);
        /*const retObj = {
          msg: 'error',
          result: 'Can\'t broadcast transaction',
        };

        res.end(JSON.stringify(retObj));*/
      }
    });
  });
};

ipcMain.on('spvGetAddress', (e, {ruid, coin, address}) => {
  if (mainWindow) {
    console.warn(`${coin} spvGetAddress called`);
    getAddress(coin, address).then(result => {
      mainWindow.webContents.send('spvGetAddress', {ruid, result});
    });
  }
});

ipcMain.on('spvGetUtxo', async(e, {ruid, coin, addresses}) => {
  if (mainWindow) {
    let result = [];
    console.warn(`${coin} spvGetUtxo called`);
    await asyncForEach(addresses, async (address, index) => {
      const res = await getUtxo(coin, address);

      console.log(`${coin} spv utxo for ${address}`);
      console.log(res);
      result = result.concat(res);
    });

    mainWindow.webContents.send('spvGetUtxo', {ruid, result});
  }
});

ipcMain.on('spvGetHistory', async(e, {ruid, coin, addresses}) => {
  if (mainWindow) {
    let result = [];
    console.warn(`${coin} spvGetHistory called`);
    await asyncForEach(addresses, async (address, index) => {
      const res = normalizeListTransactions(await getHistory(coin, address));

      console.log(`${coin} spv tx history for ${address}`);
      console.log(res);
      result = result.concat(res); 
    });

    result = getUniqueHistory(result);

    mainWindow.webContents.send('spvGetHistory', {ruid, result: {
      totalItems: result.length,
      from: 0,
      to: result.length - 1,
      items: result,
    }});
  }
});

ipcMain.on('spvGetCurrentBlock', (e, {ruid, coin}) => {
  if (mainWindow) {
    console.warn(`${coin} spvGetCurrentBlock called`);
    getCurrentBlock(coin).then(result => {
      console.warn(`${coin} spvGetCurrentBlock result`, result);
      mainWindow.webContents.send('spvGetCurrentBlock', {ruid, result});
    });
  }
});

ipcMain.on('spvGetRawTransaction', (e, {ruid, coin, txid}) => {
  if (mainWindow) {
    console.warn(`${coin} spvGetRawTransaction called`);
    getTransaction(coin, txid).then(result => {
      console.warn(`${coin} spvGetRawTransaction result`, result);
      mainWindow.webContents.send('spvGetRawTransaction', {ruid, result});
    });
  }
});

ipcMain.on('spvGetTransaction', (e, {ruid, coin, txid}) => {
  if (mainWindow) {
    console.warn(`${coin} spvGetTransaction called`);
    getTransaction(coin, txid, true).then(result => {
      console.warn(`${coin} spvGetTransaction result`, formatTransaction(result));
      mainWindow.webContents.send('spvGetTransaction', {ruid, result: formatTransaction(result)});
    });
  }
});

ipcMain.on('spvBroadcastTransaction', (e, {ruid, coin, rawtx}) => {
  if (mainWindow) {
    console.warn(`${coin} spvBroadcastTransaction called`);
    broadcastTx(coin, rawtx).then(result => {
      console.warn(`${coin} spvBroadcastTransaction result`, result);
      mainWindow.webContents.send('spvBroadcastTransaction', {ruid, result});
    });
  }
});

module.exports = {
  setMainWindow,
};