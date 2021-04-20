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

module.exports = {
  setMainWindow,
};