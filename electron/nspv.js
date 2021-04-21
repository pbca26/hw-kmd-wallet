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

const nspvPorts = parseNSPVports();

let mainWindow;

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

module.exports = {
  setMainWindow,
};