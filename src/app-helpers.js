import {sortTransactions} from './lib/sort';
import {writeLog} from './Debug';
import {TX_FEE} from './constants';
import getKomodoRewards from './lib/get-komodo-rewards';
import getRewardEndDate from './lib/get-reward-end-date';
import asyncForEach from './lib/async';
import {getAvailableExplorerUrl} from './send-coin-helpers';
import accountDiscovery from './lib/account-discovery';

const MAX_TIP_TIME_DIFF = 3600 * 24;

export const checkTipTime = (tiptime) => {
  if (!tiptime || Number(tiptime) <= 0) return tiptime;

  const currentTimestamp = Date.now() / 1000;
  const secondsDiff = Math.floor(Number(currentTimestamp) - Number(tiptime));

  if (Math.abs(secondsDiff) < MAX_TIP_TIME_DIFF) {      
    return tiptime;
  } else {
    writeLog('tiptime vs local time is too big, use local time to calc rewards!');
    return currentTimestamp;
  }
}

export const handleScanData = (coins, tiptime, stateCoins) => {
  let newCoins = coins;
  let lastOperations = [];
  coins = stateCoins;

  for (var i = 0; i < newCoins.length; i++) {
    coins[newCoins[i].coin] = newCoins[i];
    coins[newCoins[i].coin].lastChecked = Date.now();
  }
  
  for (let coin in coins) {
    for (let j = 0; j < coins[coin].accounts.length; j++) {
      for (let a = 0; a < coins[coin].accounts[j].utxos.length; a++) {
        if (Number(coins[coin].accounts[j].utxos[a].confirmations) < 0) {
          writeLog(`${coin} utxo data is incorrect for acc ${j}`);
        }
      }

      for (let a = 0; a < coins[coin].accounts[j].history.historyParsed.length; a++) {
        lastOperations.push({
          coin: coin,
          type: coins[coin].accounts[j].history.historyParsed[a].type,
          date: coins[coin].accounts[j].history.historyParsed[a].date,
          amount: coins[coin].accounts[j].history.historyParsed[a].amount,
          txid: coins[coin].accounts[j].history.historyParsed[a].txid,
          timestamp: coins[coin].accounts[j].history.historyParsed[a].timestamp,
        });
      }
    }
  }

  writeLog('lastops', lastOperations);
  writeLog(newCoins);
  writeLog(coins);  
  
  lastOperations = sortTransactions(lastOperations, 'timestamp').slice(0, 3);

  return {
    lastOperations,
    updatedCoins: coins,
  };
};

export const removeCoin = (coin, coins) => {
  let lastOperations = [];
  delete coins[coin];

  for (let coin in coins) {
    for (let j = 0; j < coins[coin].accounts.length; j++) {
      for (let a = 0; a < coins[coin].accounts[j].history.historyParsed.length; a++) {
        lastOperations.push({
          coin: coin,
          type: coins[coin].accounts[j].history.historyParsed[a].type,
          date: coins[coin].accounts[j].history.historyParsed[a].date,
          amount: coins[coin].accounts[j].history.historyParsed[a].amount,
          txid: coins[coin].accounts[j].history.historyParsed[a].txid,
          timestamp: coins[coin].accounts[j].history.historyParsed[a].timestamp,
        });
      }
    }
  }

  lastOperations = sortTransactions(lastOperations, 'timestamp').slice(0, 3);

  return {
    coins,
    lastOperations,
  };
};

export const emptyAccountState = (accountIndex, xpub) => {
  return {
    xpub,
    balance: 0,
    rewards: 0,
    claimableAmount: 0,
    enabled: true,
    accountIndex,
    utxos: [],
    history: {
      addresses: [],
      allTxs: [],
      historyParsed: [],
    },
  };
};

export const calculateRewardData = ({accounts, tiptime}) => accounts.map(account => {
  account.rewards = account.utxos.reduce((rewards, utxo) => rewards + getKomodoRewards({tiptime, ...utxo}), 0);
  account.claimableAmount = account.rewards - TX_FEE * 2;

  return account;
});

export const calculateBalanceData = accounts => accounts.map(account => {
  account.balance = account.utxos.reduce((balance, utxo) => balance + utxo.satoshis, 0);

  return account;
});


export const checkRewardsOverdue = accounts => {
  for (let i = 0; i < accounts.length; i++) {
    //writeLog(accounts[i].utxos);
    for (let j = 0; j < accounts[i].utxos.length; j++) {
      const rewardEndDate = getRewardEndDate({
        locktime: accounts[i].utxos[j].locktime,
        height: 7777776
      });

      writeLog('rewardEndDate', rewardEndDate, ' vs ', Date.now());

      if (Date.now() > rewardEndDate) {
        writeLog('account', i, 'rewards overdue');
        accounts[i].isRewardsOverdue = true;
      } else {
        accounts[i].isRewardsOverdue = false;
      }
    }
  }

  return accounts;
};

export const scanCoins = async (coinTickers, blockchain, explorerEndpointOverride, vendor, stateCoins, historyLength) => {
  let balances = [], tiptime;

  await asyncForEach(coinTickers, async (coin, index) => {
    let isExplorerEndpointSet = false;
    writeLog(coin);
    
    if (coin in explorerEndpointOverride) {
      writeLog(`${coin} set api endpoint to ${explorerEndpointOverride[coin]}`);
      blockchain.setExplorerUrl(explorerEndpointOverride[coin]);
      isExplorerEndpointSet = true;
    } else {
      const explorerUrl = await getAvailableExplorerUrl(coin, blockchain);

      writeLog(`${coin} set api endpoint to ${explorerUrl}`);
      blockchain.setExplorerUrl(explorerUrl);
      isExplorerEndpointSet = true;
    }

    if (isExplorerEndpointSet) {
      writeLog('app vendor', vendor);
      let [accounts, tiptime] = await Promise.all([
        accountDiscovery(vendor, coin, stateCoins[coin].accounts, historyLength),
        blockchain.getTipTime()
      ]);

      if (coin === 'KMD') {
        tiptime = checkTipTime(tiptime);
        accounts = calculateRewardData({accounts, tiptime});
        writeLog('check if any KMD rewards are overdue');
        accounts = checkRewardsOverdue(accounts);            
      }

      accounts = calculateBalanceData(accounts);

      let balanceSum = 0, rewardsSum = 0;

      for (let i = 0; i < accounts.length; i++) {
        balanceSum += accounts[i].balance;
        rewardsSum += accounts[i].rewards; 
      }

      balances.push({
        coin,
        balance: balanceSum || 0,
        rewards: rewardsSum || 0,
        accounts,
      });
    }
  });

  return {
    balances,
    tiptime,
  };
};

export const getAppInitState = () => {
  return {
    accounts: [],
    tiptime: null,
    explorerEndpoint: 'default',
    vendor: null,
    isFirstRun: true,
    ledgerDeviceType: null,
    ledgerFWVersion: 'webusb',
    coin: 'KMD',
    activeCoin: null,
    activeAccount: null,
    loginModalClosed: false,
    coins: {},
    lastOperations: [],
    prices: {},
    theme: 'tdark',
    isAuth: false,
    sidebarSizeChanged: false,
    syncInProgress: false,
    explorerEndpointOverride: {},
  };
};