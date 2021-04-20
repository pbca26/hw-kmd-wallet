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

module.exports = {
  setMainWindow,
};