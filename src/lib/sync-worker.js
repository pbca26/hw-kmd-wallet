import {scanCoins} from '../app-helpers';

// eslint-disable-next-line no-restricted-globals
self.onmessage = message => {
  console.debug('sync worker msg', message);

  const {
    tickers,
    explorer,
    vendor,
    coins,
    historyLength,
  } = JSON.parse(message.data);

  scanCoins(
    tickers,
    explorer,
    vendor,
    coins,
    historyLength,
  )
  .then((res) => {
    console.debug('scan coins worker res');
    postMessage(res);
  });
};