import React from 'react';
import getKomodoRewards from './lib/get-komodo-rewards';
import checkPublicAddress from './lib/validate-address';
import humanReadableSatoshis from './lib/human-readable-satoshis';
import {writeLog} from './Debug';
import coins from './lib/coins';
import {TX_FEE} from './constants';
import Translate, {t} from './Translate';
import blockchain from './lib/blockchain';

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
    error = t('send_error_insufficient_balance');
  } else if (Number(amount) < humanReadableSatoshis(TX_FEE)) {
    error = `${t('send_error_amount_small')} ${humanReadableSatoshis(TX_FEE)} ${coin}`;
  } else if (!Number(amount) || Number(amount) < 0) {
    error = t('send_error_wrong_amount');
  }

  writeLog('validate state', data.state);

  const validateAddress = checkPublicAddress(data.state.sendToIn);
  if (!validateAddress) error = t('send_error_invalid_address');

  return error;
};

export const getAvailableExplorerUrl = async (coin, _blockchain) => {
  if (!_blockchain) _blockchain = blockchain.insight;
  else _blockchain = _blockchain.insight;

  const getInfoRes = await Promise.all(coins[coin].api.map((value) => {
    _blockchain.setExplorerUrl(value);
    return _blockchain.getInfo(value);
  }));
  let longestBlockHeight = 0;
  let apiEndPointIndex = null;

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
  
  return apiEndPointIndex !== null ? coins[coin].api[apiEndPointIndex] : null;
};

export const getStateActionsInit = vendor => {
  return {
    connect: {
      icon: 'fab fa-usb',
      description: vendor === 'ledger' ? <div><Translate name="common_connect_and_unlock_ledger" /></div> : <div><Translate name="common_connect_and_unlock_trezor" /></div>,
      state: null
    },
    confirmAddress: {
      icon: 'fas fa-search-dollar',
      description: <div><Translate name="send_confirm_address" />.</div>,
      state: null
    },
    approveTransaction: {
      icon: 'fas fa-key',
      description: <div><Translate name="send_approve_tx" />.</div>,
      state: null
    },
    broadcastTransaction: {
      icon: 'fas fa-broadcast-tower',
      description: <div><Translate name="send_broadcasting_tx" />.</div>,
      state: null
    },
  };
}