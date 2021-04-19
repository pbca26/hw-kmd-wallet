const path = require('path');
const fixPath = require('fix-path');
const os = require('os');
const fs = require('fs');
const appDirname = 'hw-kmd-wallet-electron';

const getAppPath = () => {
  const currentOs = os.platform();
  const homeDir = os.platform() === 'win32' ? process.env.APPDATA : process.env.HOME;

  if (currentOs === 'darwin') {
    fixPath();
    return `${homeDir}/Library/Application Support/${appDirname}`;
  } else if (currentOs === 'linux') {
    return `${homeDir}/.${appDirname}`;
  } else if (currentOs === 'win32') {
    return path.normalize(`${homeDir}/${appDirname}`);
  }
};

const getNspvBinPath = () => {
  const nspvPath = path.join(__dirname, './bin/');
  const currentOs = os.platform();

  if (currentOs === 'darwin') {
    fixPath();
    return `${nspvPath}/osx`;
  } else if (currentOs === 'linux') {
    return `${nspvPath}/linux64`;
  } else if (currentOs === 'win32') {
    return path.normalize(`${nspvPath}/win64`);
  }
};

module.exports = {
  getAppPath,
  getNspvBinPath,
};