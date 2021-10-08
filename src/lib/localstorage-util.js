import {createAdapter} from 'iocane';

const rootVar = 'hw-wallet';
let localStorageCache = {};
let pw;

if (!localStorage.getItem(rootVar)) {
  localStorage.setItem(rootVar, '');
}

export const resetLocalStorage = () => {
  pw = null;

  localStorage.setItem(rootVar, '');
};

export const setLocalStoragePW = (_pw) => {
  pw = _pw;

  console.warn('localStorage pw set to: ', pw);
};

export const decodeStoredData = () => {
  return new Promise((resolve, reject) => {
    if (localStorage.getItem(rootVar).length) {
      createAdapter()
      .decrypt(localStorage.getItem(rootVar), pw)
      .catch((err) => {
        resolve(false);
      })
      .then(decryptedString => {
        console.warn('decryptedString', decryptedString);
        
        localStorageCache = decryptedString ? JSON.parse(decryptedString) : {};
        resolve(true);
      });
    } else {
      resolve(false);
    }
  });
};

export const encodeStoredData = (str) => {
  createAdapter()
  .encrypt(str, pw)
  .catch((err) => {
    console.warn('encodeStoredData error', err);
  })
  .then(encryptedString => {
    localStorage.setItem(rootVar, encryptedString);
  });
};

export const setLocalStorageVar = (name, json) => {
  return new Promise((resolve, reject) => {
    let _var = {};
    
    try {
      _var = localStorageCache[name] || {};
    } catch (e) {
      console.warn(e);
    }

    for (let key in json) {
      _var[key] = json[key];
    }

    console.warn('_var', _var);

    localStorageCache[name] = json;

    encodeStoredData(JSON.stringify(localStorageCache));
    resolve(true);
  });
};

export const getLocalStorageVar = (name) => {
  return localStorageCache[name] ? localStorageCache[name] : {};
};