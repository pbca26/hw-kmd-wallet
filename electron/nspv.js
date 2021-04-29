// TODO: spawn multiple nspv instances to query data
//       address lookup
const request = require('request');
const { spawn } = require('child_process');
const {ipcMain} = require('electron');

const {parseNSPVports} = require('./nspv-config-utils');
const {
  getNspvBinPath,
  getAppPath,
} = require('./path-utils');
const cacheUtil = require('./cache');
const md5 = require('./md5');

const NSPV_CHECK_READY_INTERVAL_TIMEOUT = 50;
const NSPV_RECHECK_INTERVAL_TIMEOUT = 300 * 1000;
const nspvPorts = parseNSPVports();

let mainWindow;
let isNSPVReady = {};
let nspvProcesses = {};
let nspvProcessesSync = {};
let nspvCheckReadyInterval = {};
let nspvCheckReadyIntervalIncrement = -1;
let nspvSyncChainTipInterval = {};
let cancelRecheck = false;

const setMainWindow = (_mainWindow) => {
  mainWindow = _mainWindow;
};

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

const syncCoinData = async(_coin, isFirstRun) => {
  let requestsToProcess = [];

  for (let coin in nspvProcesses) {
    if (!_coin || (_coin && _coin === coin)) {
      for (let reqhash in cache[coin]) {
        if (cache[coin][reqhash].req.method === 'listtransactions' || cache[coin][reqhash].req.method === 'listunspent') {
          console.log(reqhash);
          console.log(cache[coin][reqhash].req);
          requestsToProcess.push(reqhash);
        }
      }

      //requestsToProcess = requestsToProcess.slice(0, 3);

      await asyncForEach(requestsToProcess, async (reqhash, index) => {
        console.log(`process reqhash ${reqhash}`);
        console.log(`req`, cache[coin][reqhash].req);
        await nspvRequest(
          coin.toLowerCase(),
          cache[coin][reqhash].req.method,
          cache[coin][reqhash].req.params,
          true
        );
        console.log(`processed reqhash ${reqhash} | ${index} of ${requestsToProcess.length - 1}`);
      });

      console.log(`${coin} nspv all reqhash synced!`);
      mainWindow.webContents.send('nspvRecheck', {coin, isFirstRun});
    }
  }
};

(async function() {
  cache = await cacheUtil.loadLocalCache('nspv');
  
  /*const nspv = startNSPVDaemon('rick');
  nspvProcesses['rick'] = {
    process: nspv,
    pid: nspv.pid,
  };
  /*setTimeout(() => {
    syncCoinData();
  }, 7000);*/
})();

/*setInterval(() => {
  syncCoinData();
}, NSPV_RECHECK_INTERVAL_TIMEOUT);*/

const getCache = (coin, hash) => {
  if (cache[coin] && cache[coin][hash]) {
    console.log(`nspv load from cache ${coin} ${hash}`);
    return cache[coin][hash].res;
  }

  return false;
};

const writeCache = (coin, hash, data) => {
  if (!cache[coin]) {
    cache[coin] = {};
  }

  if (!cache[coin][hash]) {
    cache[coin][hash] = {
      req: '',
      res: '',
    };
  }

  cache[coin][hash].req = data.req;
  cache[coin][hash].res = data.res;
  console.log(`save to cache ${coin} ${hash}`);
  cacheUtil.saveLocalCache(cache, 'nspv');
};

const toSats = value => Number((Number(value).toFixed(8) * 100000000).toFixed(0));

const syncChainTip = (coin) => {
  console.log(`sync chaintip for ${coin} nspv`);

  const _syncChainTip = () => {
    nspvRequest(
      coin.toLowerCase(),
      'getinfo',
      null,
      true
    )
    .then((nspvGetinfo) => {
      console.log(nspvGetinfo);
      if (nspvGetinfo &&
          nspvGetinfo.height) {
        console.log(`synced chaintip for ${coin} nspv`);
        console.log(`${coin} nspv currentblock ==>`, 'nspv.currentblock');
        console.log(`${coin} h ${nspvGetinfo.height} t ${nspvGetinfo.header.nTime}`, 'nspv.currentblock');
      } else {
        resolve('Connection Error');
      }
    });
  };

  if (!nspvSyncChainTipInterval[coin]) {
    nspvSyncChainTipInterval[coin] = setInterval(() => {
      _syncChainTip();
    }, 30 * 1000);
    _syncChainTip();
  }
};

const nspvCheckReady = (coin) => {
  return new Promise((resolve, reject) => {
    if (!isNSPVReady[coin] && !nspvProcesses[coin]) {
      const nspv = startNSPVDaemon(coin);
      
      nspvProcesses[coin] = {
        process: nspv,
        pid: nspv.pid,
      };
    }
    
    if (!isNSPVReady[coin]) {
      if (!nspvCheckReadyInterval[coin]) nspvCheckReadyInterval[coin] = [];
      if (process.argv.indexOf('nspv-debug') > -1) console.log(`interval ${nspvCheckReadyIntervalIncrement} nspv daemon check set`, 'NSPV');
      nspvCheckReadyIntervalIncrement++;
      
      const interval = setInterval((nspvCheckReadyIntervalIncrement) => {
        
        if (isNSPVReady[coin]) {
          isNSPVReady[coin] = true;
          clearInterval(nspvCheckReadyInterval[coin][nspvCheckReadyIntervalIncrement]);
          if (process.argv.indexOf('nspv-debug') > -1) console.log(`interval ${nspvCheckReadyIntervalIncrement} nspv daemon check cleared`, 'NSPV');
          resolve(isNSPVReady[coin]);
        } else {
          if (process.argv.indexOf('nspv-debug') > -1) console.log(`awaiting ${coin} nspv daemon`, 'NSPV');
        }
      }, NSPV_CHECK_READY_INTERVAL_TIMEOUT, nspvCheckReadyIntervalIncrement);

      nspvCheckReadyInterval[coin].push(interval);
    } else {
      resolve(isNSPVReady[coin]);
    }
  });
};

const nspvRequest = async(coin, method, params, override) => {
  await nspvCheckReady(coin);

  const reqHash = md5(JSON.stringify(params ? {
    jsonrpc: '2.0',
    method,
    params,
  } : {
    jsonrpc: '2.0',
    method,
  }));

  if (nspvPorts[coin]) {
    return new Promise((resolve, reject) => {
      const cachedData = getCache(coin, reqHash);

      if (!override && cachedData) {
        resolve(cachedData);
      } else {
        const options = {
          url: `http://localhost:${nspvPorts[coin.toLowerCase()]}/`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params ? {
            jsonrpc: '2.0',
            method,
            params,
          } : {
            jsonrpc: '2.0',
            method,
          }),
        };
        
        console.log(`nspv req hash`, reqHash);

        console.log(JSON.stringify(params ? {
          jsonrpc: '2.0',
          method,
          params,
        } : {
          jsonrpc: '2.0',
          method,
        }), 'spv.nspv.req');

        request(options, (error, response, body) => {
          if (body) {
            console.log(body, 'spv.nspv.req');
            // TODO: proper error handling in ecl calls
            try {
              if (JSON) {
                const parsedBody = JSON.parse(body);
                writeCache(coin, reqHash, {
                  req: params ? {
                    jsonrpc: '2.0',
                    method,
                    params,
                  } : {
                    jsonrpc: '2.0',
                    method,
                  },
                  res: parsedBody,
                });
                resolve(parsedBody);
              }
              else resolve('error');
            } catch (e) {
              console.log('nspv json parse error', 'nspv');
              console.log(e);
              resolve('error');
            }
          } else {
            console.log('nspv empty response', 'nspv');
            resolve('error');
          }
        });
      }
    });
  } else {
    resolve('error');
  }
};

const startNSPVDaemon = (coin) => {
  syncChainTip(coin);
  isNSPVReady[coin] = false;

  const nspv = spawn(
    `${getNspvBinPath()}/nspv`,
    coin.toUpperCase() === 'KMD' ? [] : [coin.toUpperCase()],
    {
      cwd: getAppPath(),
    }, []
  );

  nspv.stdout.on('data', (data) => {
    if (process.argv.indexOf('nspv-debug') > -1) console.log(`stdout: ${data}`, 'NSPV');

    if (data.indexOf('NSPV_req "getnSPV" request sent to node') > -1 && !isNSPVReady[coin]) {
      console.log(`${coin} nspv is ready to serve requests`, 'NSPV');
      isNSPVReady[coin] = true;
    }
  });
  
  nspv.stderr.on('data', (data) => {
    if (process.argv.indexOf('nspv-debug') > -1) console.log(`stderr: ${data}`, 'NSPV');

    if (data.indexOf('NSPV_req "getnSPV" request sent to node') > -1 && !isNSPVReady[coin]) {
      console.log(`${coin} nspv is ready to serve requests`, 'NSPV');
      isNSPVReady[coin] = true;
    }
  });
  
  nspv.on('close', (code) => {
    console.log(`child process exited with code ${code}`, 'NSPV');
    isNSPVReady[coin] = false;
    
    if (nspvProcesses[coin]) {
      nspvProcesses[coin] = 'exited';
      
      setTimeout(() => {
          // attempt to revive supposedly dead daemon
        if (nspvProcesses[coin] &&
            nspvProcesses[coin] === 'exited') {
          const nspvProcess = startNSPVDaemon(coin);
          nspvProcesses[coin] = {
            process: nspvProcess,
            pid: nspvProcess.pid,
          };

          console.log(`${coin.toUpperCase()} NSPV daemon PID ${nspvProcess.pid} (restart)`, 'spv.coin');
        }
      }, 5000);
    }
  });

  return nspv;
};

const stopNSPVDaemon = (coin) => {
  if (coin === 'all') {
    for (let key in nspvPorts) {
      if (nspvProcesses[key].pid) {
        console.log(`NSPV daemon ${key.toUpperCase()} PID ${nspvProcesses[key].pid} is stopped`, 'spv.nspv.coin');
        for (let i = 0; i < nspvCheckReadyInterval[key].length; i++) {
          clearInterval(nspvCheckReadyInterval[key][i]);
        }
        nspvCheckReadyInterval[coin] = [];
        isNSPVReady[key] = false;
        nspvProcesses[key].process.kill('SIGINT');
        delete nspvProcesses[key];
      }
    }
  } else {
    if (nspvPorts[coin] &&
        nspvProcesses[coin].pid) {
      console.log(`NSPV daemon ${coin.toUpperCase()} PID ${nspvProcesses[coin].pid} is stopped`, 'spv.nspv.coin');

      for (let i = 0; i < nspvCheckReadyInterval[coin].length; i++) {
        clearInterval(nspvCheckReadyInterval[coin][i]);
      }
      nspvCheckReadyInterval[coin] = [];
      isNSPVReady[coin] = false;
      nspvProcesses[coin].process.kill('SIGINT');
      delete nspvProcesses[coin];
    }
  }
};

const nspvWrapper = (network) => {
  return {
    connect: () => {
      console.log('nspv connect', 'nspv');
    },
    close: () => {
      console.log('nspv close', 'nspv');
    },
    blockchainAddressGetHistory: (__address) => {
      return new Promise((resolve, reject) => {
        let _nspvTxs = [];

        nspvRequest(
          network.toLowerCase(),
          'listtransactions',
          [__address],
        )
        .then((nspvTxHistory) => {
          if (nspvTxHistory &&
              nspvTxHistory.result &&
              nspvTxHistory.result === 'success') {
            for (let i = 0; i < nspvTxHistory.txids.length; i++) {
              _nspvTxs.push({
                tx_hash: nspvTxHistory.txids[i].txid,
                height: nspvTxHistory.txids[i].height,
                value: nspvTxHistory.txids[i].value,
              });
            }

            resolve(_nspvTxs);
          } else {
            resolve('unable to get transactions history');
          }
        });
      });
    },
    blockchainAddressGetBalance: (__address) => {
      return new Promise((resolve, reject) => {
        nspvRequest(
          network.toLowerCase(),
          'listunspent',
          [__address],
        )
        .then((nspvTxHistory) => {
          if (nspvTxHistory &&
              nspvTxHistory.result &&
              nspvTxHistory.result === 'success') {
            resolve({
              confirmed: toSats(nspvTxHistory.balance),
              unconfirmed: 0,
            });
          } else {
            resolve('unable to get balance');
          }
        });
      });
    },
    blockchainAddressListunspent: (__address) => {
      return new Promise((resolve, reject) => {
        let nspvUtxos = [];
        
        nspvRequest(
          network.toLowerCase(),
          'listunspent',
          [__address],
        )
        .then((nspvListunspent) => {
          if (nspvListunspent &&
              nspvListunspent.result &&
              nspvListunspent.result === 'success') {
            for (let i = 0; i < nspvListunspent.utxos.length; i++) {
              nspvUtxos.push(network.toLowerCase() === 'kmd' ? {
                tx_hash: nspvListunspent.utxos[i].txid,
                height: nspvListunspent.utxos[i].height,
                value: toSats(nspvListunspent.utxos[i].value),
                rewards: toSats(nspvListunspent.utxos[i].rewards),
                tx_pos: nspvListunspent.utxos[i].vout,
              } : {
                tx_hash: nspvListunspent.utxos[i].txid,
                height: nspvListunspent.utxos[i].height,
                value: toSats(nspvListunspent.utxos[i].value),
                tx_pos: nspvListunspent.utxos[i].vout,
              });
            }

            resolve(nspvUtxos);
          } else {
            resolve('unable to get utxos');
          }
        });
      });
    },
    blockchainTransactionGet: (__txid, returnValue) => {
      return new Promise((resolve, reject) => {
        nspvRequest(
          network.toLowerCase(),
          'gettransaction',
          [__txid],
        )
        .then((nspvGetTx) => {
          if (returnValue) {
            resolve(nspvGetTx);
          } else {
            if (nspvGetTx &&
                nspvGetTx.hasOwnProperty('hex')) {
              resolve(nspvGetTx.hex);
            } else {
              console.log(`nspv unable to get raw input tx ${__txid}`, 'spv.cache');
              resolve('unable to get raw transaction');
            }
          }
        });
      });
    },
    blockchainTransactionBroadcast: (__rawtx, returnValue) => {
      return new Promise((resolve, reject) => {
        nspvRequest(
          network.toLowerCase(),
          'broadcast',
          [__rawtx],
        )
        .then((nspvBroadcast) => {
          if (returnValue) {
            resolve(nspvBroadcast);
          } else {
            if (nspvBroadcast &&
                nspvBroadcast.result &&
                nspvBroadcast.result === 'success' &&
                nspvBroadcast.expected === nspvBroadcast.broadcast) {
              resolve(nspvBroadcast.broadcast);
            } else {
              console.log(`nspv unable to push transaction ${__rawtx}`, 'spv.cache');
              resolve({err: 'Unable to push raw transaction'});
            }
          }
        });
      });
    },
  };
};

ipcMain.on('nspvRunRecheck', (e, {coin, isFirstRun}) => {
  if (mainWindow) {
    console.warn(`${coin} nspvRunRecheck called`);
    syncCoinData(coin, isFirstRun);
    //mainWindow.webContents.send('nspvRecheckInProgress');
  }
});

module.exports = {
  startNSPVDaemon,
  nspvRequest,
  nspvWrapper,
  setMainWindow,
};