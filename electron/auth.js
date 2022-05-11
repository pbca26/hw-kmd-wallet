
const {createAdapter} = require('iocane');
let pw;

const decodeStoredData = (str/*, pw*/) => {
  return new Promise((resolve, reject) => {
    if (str.length) {
      createAdapter()
      .decrypt(str, pw)
      .catch((err) => {
        console.log('decodeStoredData error', err);
        resolve(false);
      })
      .then(decryptedString => {
        //console.log('decryptedString', decryptedString);
        resolve(decryptedString);
      });
    } else {
      resolve(false);
    }
  });
};

const encodeStoredData = (str/*, pw*/) => {
  return new Promise((resolve, reject) => {
    createAdapter()
    .encrypt(str, pw)
    .catch((err) => {
      console.log('encodeStoredData error', err);
      resolve(false);
    })
    .then(encryptedString => {
      resolve(encryptedString);
    });
  });
};

const getPW = () => {
  return pw;
};
const setPW = (_pw) => {
  pw = _pw;
};

module.exports = {
  decodeStoredData,
  encodeStoredData,
  getPW,
  setPW,
};