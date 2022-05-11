import React from 'react';
import getKomodoRewards from './lib/get-komodo-rewards';
import checkPublicAddress from './lib/validate-address';
import humanReadableSatoshis from './lib/human-readable-satoshis';
import {writeLog} from './Debug';
import coins from './lib/coins';
import {TX_FEE} from './constants';

export const formatUtxos = (utxos, coin, tiptime) => {
  let formattedUtxos = [];
  
  for (let i = 0; i < utxos.length; i++) {
    let utxo = utxos[i];
    writeLog('utxos[i].amount', utxos[i].amount);

    utxo.amountSats = utxo.satoshis;

    if (coin === 'KMD') {
      const rewards = getKomodoRewards({tiptime, ...utxo});
      writeLog('rewards', rewards);
      writeLog('tiptime', tiptime);
      utxo.interestSats = rewards;
    }

    formattedUtxos.push(utxo);
  }

  writeLog('formatted utxos', formattedUtxos);
  
  return formattedUtxos;
};

export const filterUtxos = (utxoListSimplified, utxoListDetailed) => {
  let utxos = [];
  
  for (let i = 0; i < utxoListSimplified.length; i++) {
    for (let j = 0; j < utxoListDetailed.length; j++) {
      if (utxoListDetailed[j].vout === utxoListSimplified[i].vout &&
          utxoListDetailed[j].txid === utxoListSimplified[i].txid) {
        utxos.push(utxoListDetailed[j]);
        break;
      }
    }
  }

  writeLog('filterUtxos', utxos);

  return utxos;
};

export const validate = data => {
  const amount = Number(data.state.amountIn);
  const balance = data.props.isClaimRewardsOnly ? data.props.balance : data.props.accounts[data.state.accountIndex].balance;
  const {coin} = data.props;
  let error;

  if (Number(amount) > balance) {
    error = 'insufficient balance';
  } else if (Number(amount) < humanReadableSatoshis(TX_FEE)) {
    error = `amount is too small, min is ${humanReadableSatoshis(TX_FEE)} ${coin}`;
  } else if (!Number(amount) || Number(amount) < 0) {
    error = 'wrong amount format';
  }

  writeLog('validate state', data.state);

  const validateAddress = checkPublicAddress(data.state.sendToIn);
  if (!validateAddress) error = 'Invalid send to address';

  return error;
};

export const getAvailableExplorerUrl = async (coin, blockchain) => {
  const getInfoRes = await Promise.all(coins[coin].api.map((value, index) => {
    return blockchain.getInfo(value);
  }));
  let longestBlockHeight = 0;
  let apiEndPointIndex = 0;

  writeLog('checkExplorerEndpoints', getInfoRes);
  
  for (let i = 0; i < coins[coin].api.length; i++) {
    if (getInfoRes[i] &&
        'info' in getInfoRes[i] &&
        'version' in getInfoRes[i].info) {
      if (getInfoRes[i].info.blocks > longestBlockHeight) {
        longestBlockHeight = getInfoRes[i].info.blocks;
        apiEndPointIndex = i;
      }
    }
  }

  writeLog('apiEndPointIndex', apiEndPointIndex);
  
  return coins[coin].api[apiEndPointIndex];
};

export const getStateActionsInit = (vendor) => {
  return {
    connect: {
      icon: 'fab fa-usb',
      description: vendor === 'ledger' ? <div>Connect and unlock your Ledger, then open the Komodo app on your device.</div> : <div>Connect and unlock your Trezor.</div>,
      state: null
    },
    confirmAddress: {
      icon: 'fas fa-search-dollar',
      description: <div>Confirm the address on your device matches the new unused address shown above.</div>,
      state: null
    },
    approveTransaction: {
      icon: 'fas fa-key',
      description: <div>Approve the transaction on your device after carefully checking the values and addresses match those shown above.</div>,
      state: null
    },
    broadcastTransaction: {
      icon: 'fas fa-broadcast-tower',
      description: <div>Broadcasting transaction to the network.</div>,
      state: null
    },
  };
}