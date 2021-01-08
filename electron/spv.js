const network = require('./networks');
const bitcoin = require('bitgo-utxo-lib');

const electrumServersList = require('./electrum-servers');
const electrumJSCore = require('./electrumjs.core');
const transactionDecoder = require('./transaction-decoder');
const {ipcMain} = require('electron');

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

module.exports = {
  setMainWindow,
};