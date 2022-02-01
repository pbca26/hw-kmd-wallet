const fs = require('fs-extra');
const path = require('path');
const {getAppPath} = require('./path-utils');
const appDir = getAppPath();

const compareNSPVCoinsFile = () => {
  const rootLocation = path.join(__dirname, '.');
  const nspvCoinsAgamaDirSize = fs.existsSync(`${appDir}/coins`) && fs.lstatSync(`${appDir}/coins`);
  let localNSPVCoinsFile = fs.lstatSync(`${rootLocation}/nspv_coins`);
  
  if (!nspvCoinsAgamaDirSize ||
      (nspvCoinsAgamaDirSize && nspvCoinsAgamaDirSize.size !== localNSPVCoinsFile.size)) {
    console.log('NSPV coins file mismatch, copy over', 'init');
    localNSPVCoinsFile = fs.readFileSync(`${rootLocation}/nspv_coins`, 'utf8');
    fs.writeFileSync(`${appDir}/coins`, localNSPVCoinsFile, 'utf8');
  } else {
    console.log('NSPV coins file is matching', 'init');
  }
};

const parseNSPVports = () => {
  const nspvCoinsAppDirExists = fs.existsSync(`${appDir}/coins`);
  let nspvPorts = {};
  
  if (nspvCoinsAppDirExists) {
    const nspvCoinsContent = fs.readFileSync(`${appDir}/coins`, 'utf8');

    try {
      const nspvCoinsContentJSON = JSON.parse(nspvCoinsContent);

      for (let item of nspvCoinsContentJSON) {
        nspvPorts[item.coin.toLowerCase()] = item.rpcport;
      }
      console.log(`NSPV coins file ${nspvCoinsContentJSON.length} supported coins`, 'init');
    } catch (e) {
      console.log('NSPV coins file unable to parse!', 'init');
    }
  } else {
    console.log('NSPV coins file doesn\'t exist!', 'init');
  }

  console.log('nspv ports =>');
  console.log(nspvPorts);

  return nspvPorts;
};

module.exports = {
  compareNSPVCoinsFile,
  parseNSPVports,
};