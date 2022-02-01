import hw from './hw';
import blockchain, {blockchainAPI} from './blockchain';
import getAddress from './get-address';
import bitcoin from 'bitcoinjs-lib';
import parseHistory from './history-parser';
import asyncForEach from './async';
import {
  isElectron,
  appData,
  ipcRenderer,
} from '../Electron';
import {writeLog} from '../Debug';
import TrezorUtxoLib from '@trezor/utxo-lib';

let pubKeysCache = {};
let isFirstRun = {};
let config = {
  discoveryGapLimit: 20,
  discoveryAddressConcurrency: 10,
  accountIndex: 0,
};

export const setConfigVar = (name, val) => {
  config[name] = val;

  writeLog('setConfigVar', config);
};

const walkDerivationPath = async node => {
  const addresses = [];
  let addressConcurrency = config.discoveryAddressConcurrency;
  let gapLimit = config.discoveryGapLimit;
  let consecutiveUnusedAddresses = 0;
  let addressIndex = 0;

  if (window.location.href.indexOf('extgap=s') > -1) gapLimit = 30;
  if (window.location.href.indexOf('extgap=m') > -1) gapLimit = 40;
  if (window.location.href.indexOf('extgap=l') > -1) gapLimit = 50;
  if (window.location.href.indexOf('extgap=xl') > -1) gapLimit = 100;

  if (window.location.href.indexOf('timeout=s') > -1) addressConcurrency = 2;
  if (window.location.href.indexOf('timeout=m') > -1) addressConcurrency = 5;

  if (gapLimit > 20) addressConcurrency = 5;
  if (gapLimit > 50) addressConcurrency = 3;

  if (isElectron && appData.isNspv) {
    writeLog('blockchainAPI', blockchainAPI);
    addressConcurrency = 2;
    gapLimit = 5;
    writeLog('walkDerivationPath gapLimit', gapLimit);
  }

  writeLog(`walkDerivationPath gapLimit = ${gapLimit}`);

  while (consecutiveUnusedAddresses < gapLimit) {
    const addressApiRequests = [];

    for (let i = 0; i < addressConcurrency; i++) {
      const address = getAddress(node.derive(addressIndex).publicKey);

      addressApiRequests.push(blockchain[blockchainAPI].getAddress(address));
      addresses.push({address, addressIndex});

      addressIndex++;
    }

    for (const address of await Promise.all(addressApiRequests)) {
      if (address.txApperances > 0 || address.totalReceived > 0 || address.unconfirmedBalance > 0) {
        consecutiveUnusedAddresses = 0;
      } else {
        consecutiveUnusedAddresses++;
      }
    }
  }

  return addresses.slice(0, addresses.length - consecutiveUnusedAddresses);
};

const getAccountAddresses = async (account, vendor, _xpub) => {
  const derivationPath = `44'/141'/${account}'`;
  const xpub = _xpub || pubKeysCache[derivationPath] || await hw[vendor].getXpub(derivationPath);
  const node = bitcoin.bip32.fromBase58(xpub);
  const externalNode = node.derive(0);
  const internalNode = node.derive(1);

  if (!pubKeysCache[derivationPath]) {
    pubKeysCache[derivationPath] = xpub;
  }

  const [externalAddresses, internalAddresses] = await Promise.all([
    walkDerivationPath(externalNode),
    walkDerivationPath(internalNode)
  ]);

  const addAddressMeta = ({isChange}) => {
    return address => ({
      ...address,
      account,
      isChange,
      derivationPath: `${derivationPath}/${isChange ? 1 : 0}/${address.addressIndex}`,
    });
  };

  const addresses = [
    ...externalAddresses.map(addAddressMeta({isChange: false})),
    ...internalAddresses.map(addAddressMeta({isChange: true}))
  ];

  return {
    externalNode,
    internalNode,
    addresses,
    xpub,
  };
};

const getAddressUtxos = async addresses => {
  const utxos = await blockchain[blockchainAPI].getUtxos(addresses.map(a => a.address));

  return await Promise.all(utxos.map(async (utxo, index) => {
    const addressInfo = addresses.find(a => a.address === utxo.address);

    let [
      {rawtx},
      {
        locktime,
        vin,
        vout,
        version,
        nVersionGroupId,
        nExpiryHeight,
      }
    ] = await Promise.all([
      blockchain[blockchainAPI].getRawTransaction(utxo.txid),
      blockchain[blockchainAPI].getTransaction(utxo.txid)
    ]);

    // fix for insight explorer value rounding issue
    TrezorUtxoLib.Transaction.USE_STRING_VALUES = true;
    const decodeFromRaw = TrezorUtxoLib.Transaction.fromHex(rawtx, TrezorUtxoLib.networks.komodo);

    for (let i = 0; i < vout.length; i++) {
      vout[i].satoshis = parseInt(decodeFromRaw.outs[i].value);
    }

    return {
      id: `${utxo.txid}:${utxo.vout}`,
      ...addressInfo,
      ...utxo,
      locktime,
      rawtx,
      inputs: vin,
      outputs: vout,
      version,
      nVersionGroupId,
      nExpiryHeight,
    };
  }));
};

const getAddressHistory = async addresses => {
  const history = await blockchain[blockchainAPI].getHistory(addresses.map(a => a.address));

  return {
    addresses: addresses,
    allTxs: history.items,
    historyParsed: parseHistory(history.items, addresses.map(a => a.address)),
  };
};

export const getAddressHistoryOld = async addresses => {
  let addressCacheTemp = {};
  let allTxs = [];
  let addressHistory = [];
  let addressHistoryIDs = [];

  writeLog('addresses', addresses);

  await asyncForEach(addresses, async (addressItem, index) => {
    const addressHistoryRes = await blockchain[blockchainAPI].getHistory(addressItem.address);
    
    writeLog('addressHistoryRes', addressHistoryRes);

    if (addressHistoryRes &&
        addressHistoryRes.txs) {
      addressCacheTemp[addressItem.address] = addressHistoryRes.txs;
  
      for (let i = 0; i < addressHistoryRes.txs.length; i++) {
        if (addressHistoryIDs.indexOf(addressHistoryRes.txs[i].txid) === -1) {
          addressHistory.push(addressHistoryRes.txs[i]);
          addressHistoryIDs.push(addressHistoryRes.txs[i].txid);
        }
        if (allTxs.indexOf(addressHistoryRes.txs[i].txid) === -1) {
          allTxs.push(addressHistoryRes.txs[i]);
        }
      }
    } else {
      // TODO: something went wrong, request again
    }          
  });

  let uniqueTxids = [];
  let filteredHistoryTxs = [];

  for (let i = 0; i < 2; i++) {        
    for (let j = 0; j < allTxs.length; j++) {
      if (uniqueTxids.indexOf(allTxs[j].txid) === -1) {
        uniqueTxids.push(allTxs[j].txid);
        filteredHistoryTxs.push(allTxs[j]);
      }
    }
  }

  writeLog('filteredHistoryTxs', filteredHistoryTxs);
  
  return {
    addresses: addressCacheTemp,
    allTxs,
    historyParsed: parseHistory(filteredHistoryTxs, Object.keys(Object.assign(addressCacheTemp))),
  };
};

const accountDiscovery = async (vendor, coin, _accounts) => {
  const accounts = [];
  let accountIndex = config.accountIndex > 0 ? config.accountIndex - 1 : 0;
  
  // TODO
  if (isElectron && appData.isNspv) {
    writeLog('accountDiscovery accountIndex', accountIndex);
    const account = await getAccountAddresses(accountIndex, vendor);
    
    if (account.addresses.length === 0) {
      account.utxos = [];
      account.history = {
        addresses: [],
        allTxs: [],
        historyParsed: [],
      }; 
      account.accountIndex = accountIndex;
      account.enabled = true;
      accounts.push(account);
    } else {
      account.utxos = await getAddressUtxos(account.addresses);
      account.history = await getAddressHistory(account.addresses); 
      account.accountIndex = accountIndex;
      account.enabled = true;
    }

    writeLog('nspv account discovery done');

    accounts.push(account);
    writeLog('run diff check');
    ipcRenderer.send('nspvRunRecheck', {coin, isFirstRun: !isFirstRun.hasOwnProperty(coin)});
    if (!isFirstRun.hasOwnProperty(coin)) isFirstRun[coin] = true;
  } else {
    while (true) {
      if (!_accounts || (_accounts && _accounts[accountIndex] && _accounts[accountIndex].enabled)) {
        if (_accounts && _accounts[accountIndex]) writeLog(`${coin} data discovery for account ${accountIndex}`, _accounts[accountIndex]);
        //const account = await getAccountAddresses(accountIndex, vendor);
        const account = await getAccountAddresses(accountIndex, vendor, _accounts && _accounts[accountIndex] ? _accounts[accountIndex].xpub : null);
        writeLog('accountDiscovery accountIndex', accountIndex);
        
        if (account.addresses.length === 0) {
          account.utxos = [];
          account.history = {
            addresses: [],
            allTxs: [],
            historyParsed: [],
          }; 
          account.accountIndex = accountIndex;
          account.enabled = _accounts && _accounts[accountIndex] ? _accounts[accountIndex].enabled : true;
          accounts.push(account);
          if (config.accountIndex === 0 && accountIndex >= 2) break;
        } else {
          account.utxos = await getAddressUtxos(account.addresses);
          account.history = await getAddressHistory(account.addresses); 
          account.accountIndex = accountIndex;
          account.enabled = _accounts && _accounts[accountIndex] ? _accounts[accountIndex].enabled : true;
          accounts.push(account);
        }

        if (config.accountIndex > 0) break;

        accountIndex++;
      } else {
        return accounts;
      }
    }
  }

  writeLog('accounts', accounts);

  return accounts;
};

export const getAccountNode = (xpub) => {
  const node = bitcoin.bip32.fromBase58(xpub);
  const externalNode = node.derive(0);
  const internalNode = node.derive(1);

  return {
    externalNode,
    internalNode,
  };
};

export const getAccountXpub = async (account, vendor) => {
  const derivationPath = `44'/141'/${account}'`;
  const xpub = await hw[vendor].getXpub(derivationPath);

  if (!pubKeysCache[derivationPath]) {
    pubKeysCache[derivationPath] = xpub;
  }

  writeLog('getAccountXpub ' + derivationPath, xpub);

  return xpub;
};

export const clearPubkeysCache = () => {
  pubKeysCache = {};
};

export default accountDiscovery;
