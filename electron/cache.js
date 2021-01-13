const fs = require('fs');
const {getAppPath} = require('./path-utils');
const appDirname = 'hw-kmd-wallet-electron';
const appDir = getAppPath();

const cacheTypes = {
  spv: 'cache',
  nspv: 'cache-nspv',
};

const loadLocalCache = (type = 'spv') => {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(`${appDir}/${cacheTypes[type]}.json`)) {
      const localCache = fs.readFileSync(`${appDir}/${cacheTypes[type]}.json`, 'utf8');

      console.log(`local ${cacheTypes[type]} loaded from local file`);

      try {
        resolve(JSON.parse(localCache));
      } catch (e) {
        console.log(`local ${cacheTypes[type]} file is damaged, create new`);
        saveLocalCache({}, type);
        resolve({});
      }
    } else {
      console.log(`local ${cacheTypes[type]} file is not found, create new`);
      saveLocalCache({}, type);
      resolve({});
    }
  });
};

const saveLocalCache = (cache, type = 'spv') => {
  const cacheFileName = `${appDir}/${cacheTypes[type]}.json`;

  fs.access(appDir, fs.constants.R_OK, (err) => {
    if (!err) {
      const FixFilePermissions = () => {
        return new Promise((resolve, reject) => {
          const result = `${cacheTypes[type]}.json file permissions updated to Read/Write`;

          fs.chmodSync(cacheFileName, '0666');
          console.log(result);
          resolve(result);
        });
      }

      const FsWrite = () => {
        return new Promise((resolve, reject) => {
          const result = `${cacheTypes[type]}.json write file is done`;

          const err = fs.writeFileSync(cacheFileName, JSON.stringify(cache), 'utf8');

          if (err)
            return console.log(err);

          fs.chmodSync(cacheFileName, '0666');
          setTimeout(() => {
            console.log(result);
            console.log(`${cacheTypes[type]}.json file is created successfully at: ${appDir}`);
            resolve(result);
          }, 2000);
        });
      }

      FsWrite()
      .then(FixFilePermissions());
    }
  });
}

module.exports = {
  loadLocalCache,
  saveLocalCache,
};
