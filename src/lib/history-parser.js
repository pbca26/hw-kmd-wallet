import {secondsToString} from './time';
import {sortTransactions} from './sort';
import compose from './compose';

const parse = ([txs, addr, options]) => {
  let txHistory = [];
  let addresses = [];

  if (options && options.hasOwnProperty('debug')) {
    console.warn('parsehistory txs', txs);
  }
  
  for (let i = 0; i < txs.length; i++) {
    let tx = {};
    let vinSum = 0, voutSum = 0;

    if (options && options.hasOwnProperty('debug')) {
      console.log('--- vin -->');
      console.log(txs[i].vin);
      console.log('--- vout -->');
      console.log(txs[i].vout);
    }
    
    for (let j = 0; j < txs[i].vin.length; j++) {
      if (addresses.indexOf(txs[i].vin[j].addr) === -1) {
        addresses.push(txs[i].vin[j].addr);
      }

      if (addr.indexOf(txs[i].vin[j].addr) > -1) {
        vinSum += Number(txs[i].vin[j].value);
      }
    }

    for (let j = 0; j < txs[i].vout.length; j++) {
      if (addresses.indexOf(txs[i].vout[j].scriptPubKey.addresses[0]) === -1) {
        addresses.push(txs[i].vout[j].scriptPubKey.addresses[0]);
      }

      if (addr.indexOf(txs[i].vout[j].scriptPubKey.addresses[0]) > -1) {
        voutSum += Number(txs[i].vout[j].value);
        console.warn('vout', JSON.stringify(txs[i].vout[j]));
      }
    }
  
    if (options && options.hasOwnProperty('debug')) {
      console.log(`vinsum: ${vinSum}`);
      console.log(`voutSum: ${voutSum}`);
    }

    tx = {
      type: 'sent',
      amount: Math.abs(Number(Number(Math.abs(vinSum) - Math.abs(voutSum) - 0.0001).toFixed(8))),
      timestamp: txs[i].height === -1 || txs[i].blockheight === -1  ? Math.floor(Date.now() / 1000) : txs[i].blocktime || 'pending',
      date: txs[i].blocktime ? secondsToString(txs[i].blocktime) : 'pending',
      txid: txs[i].txid || 'unknown',
      height: txs[i].height || txs[i].blockheight === -1 ? 0 : txs[i].height || txs[i].blockheight,
      confirmations: txs[i].confirmations || 0,
    };

    // TODO: dectect send to self txs
    if /*(vinSum && voutSum) {
      tx.type = 'self';
    } else if */(vinSum && !voutSum) {
      tx.type = 'sent';
    } else if (!vinSum && voutSum) {
      tx.type = 'received';
    }

    txHistory.push(tx);
  }

  return txHistory;
};

const sort = ([txs, addr, options]) => {
  console.warn('sort', txs);
  return [sortTransactions(txs, 'time'), addr, options];
};

const limit = ([txs, addr, options]) => {
  if (txs.length > 10) {
    txs = txs.slice(0, 9);
  }

  return [txs, addr, options];
};

const parsehistory = (txs, addr, options) => {
  return compose(sort, limit, parse)([txs, addr, options]);
};

export default parsehistory;