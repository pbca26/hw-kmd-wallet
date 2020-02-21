import {secondsToString} from 'agama-wallet-lib/src/time';
import {sortTransactions} from 'agama-wallet-lib/src/utils';

const parseHistory = (txs, addr) => {
  let txHistory = [];
  let addresses = [];

  console.warn('parsehistory txs', txs)
  
  for (let i = 0; i < txs.length; i++) {
    let tx = {};
    let vinSum = 0, voutSum = 0;
    console.log('--- vin -->')
    console.log(txs[i].vin)
    console.log('--- vout -->')
    console.log(txs[i].vout)
    
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
        voutsSum += Number(txs[i].vout[j].value);
      }
    }
  
    console.log('vinsum: ' + vinSum)
    console.log('voutSum: ' + voutSum)

    txHistory.push(tx);
  }
  
  console.log(txHistory)
  return txHistory;
};

export default parseHistory;