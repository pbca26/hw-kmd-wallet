import {createAdapter} from 'iocane';
import {writeLog} from '../Debug';
import {isElectron, helpers} from '../Electron';

const rootVar = 'hw-wallet';
let localStorageCache = {};
let pw;

if (!localStorage.getItem(rootVar)) {
  localStorage.setItem(rootVar, '');
}

export const resetLocalStorage = () => {
  pw = null;

  if (isElectron) {
    helpers.setPW();
  }
  localStorageCache = {};
  localStorage.setItem(rootVar, '');
};

export const setLocalStoragePW = _pw => {
  pw = _pw;

  localStorageCache = {};

  if (isElectron) {
    helpers.setPW(_pw);
  }
  //writeLog('localStorage pw set to: ', pw);
};

export const decodeStoredData = () => {
  if (!pw) {
    return new Promise((resolve, reject) => {
      resolve(false);
    });
  } else {
    if (!isElectron) {
      return new Promise((resolve, reject) => {
        if (localStorage.getItem(rootVar).length) {
          createAdapter()
          .decrypt(localStorage.getItem(rootVar), pw)
          .catch((err) => {
            resolve(false);
          })
          .then(decryptedString => {
            //writeLog('decryptedString', decryptedString);
            //writeLog('decryptedString', JSON.parse(decryptedString));
            
            localStorageCache = decryptedString ? JSON.parse(decryptedString) : {};
            resolve(true);
          });
        } else {
          resolve(false);
        }
      });
    } else {
      return new Promise((resolve, reject) => {
        if (localStorage.getItem(rootVar).length) {
          helpers.decodeStoredData(localStorage.getItem(rootVar), pw)
          .catch((err) => {
            resolve(false);
          })
          .then(decryptedString => {
            //writeLog('decryptedString', decryptedString);
            
            localStorageCache = decryptedString ? JSON.parse(decryptedString) : {};
            resolve(true);
          });
        } else {
          resolve(false);
        }
      });
    }
  }
};

export const encodeStoredData = str => {
  if (pw) {
    if (!isElectron) {
      createAdapter()
      .encrypt(str, pw)
      .catch((err) => {
        writeLog('encodeStoredData error', err);
      })
      .then(encryptedString => {
        localStorage.setItem(rootVar, encryptedString);
      });
    } else {
      helpers.encodeStoredData(str, pw)
      .catch((err) => {
        writeLog('encodeStoredData error', err);
      })
      .then(encryptedString => {
        //writeLog('encryptedString', encryptedString);
        localStorage.setItem(rootVar, encryptedString);
      });
    }
  }
};

export const setLocalStorageVar = (name, json, replace) => {
  return new Promise((resolve, reject) => {
    let _var = {};
    //writeLog('localStorageCache', localStorageCache);
    
    try {
      _var = localStorageCache[name] || {};
    } catch (e) {
      writeLog(e);
    }

    if (replace) {
      localStorageCache[name] = json;
    } else {
      for (let key in json) {
        _var[key] = json[key];
      }
      
      localStorageCache[name] = Array.isArray(json) ? json : Object.assign({}, localStorageCache[name], _var);
    }
    
    writeLog('_var', _var);
        
    encodeStoredData(JSON.stringify(localStorageCache));
    resolve(true);
  });
};

export const getLocalStorageVar = name => {
  return localStorageCache[name] ? localStorageCache[name] : {};
};