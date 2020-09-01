import Btc from '@ledgerhq/hw-app-btc';
import buildOutputScript from './build-output-script';
import bip32Path from 'bip32-path';
import createXpub from './create-xpub';
import transport from './ledger-transport';
const { ipcRenderer } = window.require('electron');

let ledgerFWVersion = 'default';
export let ledgerTransport;

const setLedgerTransport = (transport) => {
  ledgerTransport = transport;
  console.warn(ledgerTransport);
};

const setLedgerFWVersion = name => {
  ledgerFWVersion = name;
  console.warn(ledgerFWVersion);
};

const getLedgerFWVersion = () => {
  return ledgerFWVersion;
};

const resetTransport = () => {
  if (ledgerTransport) {
    if (ledgerFWVersion === 'ble') ledgerTransport.closeConnection();
    ledgerTransport = null;
  }
};

// wrap ledger methods using ipc renderer
const getDevice = async () => {
  return {
    getWalletPublicKey: (derivationPath) => {
      return new Promise((resolve, reject) => {
        ipcRenderer.on('getAddress', (event, arg) => {
          console.warn('getAddress arg', arg);
          console.warn('arg.bitcoinAddress', arg.bitcoinAddress);
          if (arg === -777) resolve(false);
          resolve(arg);
        });
        ipcRenderer.send('getAddress', derivationPath);
      });
    },
    close: () => {},
  };
};

const isAvailable = async () => {
  const ledger = await getDevice();

  try {
    const res = await ledger.getWalletPublicKey(`m/44'/141'/0'/0/0`, {
      verify: window.location.href.indexOf('ledger-ble') > -1 || ledgerFWVersion === 'ble',
    });
    await ledger.close();
    if (res) {
      console.warn('device available');
      return true;
    } else {
      console.warn('device unavailable');
      return false;
    }
  } catch (error) {
    return false;
  }
};

const getAddress = async (derivationPath, verify) => {
  const ledger = await getDevice();
  const {bitcoinAddress} = await ledger.getWalletPublicKey(derivationPath, {
    verify: window.location.href.indexOf('ledger-ble') > -1 || ledgerFWVersion === 'ble' ? true : verify,
  });
  await ledger.close();

  return bitcoinAddress;
};

const createTransaction = async (utxos, outputs) => {
  const ledger = await getDevice();

  const inputs = await Promise.all(utxos.map(async utxo => {
    const transactionHex = utxo.rawtx;
    const isSegwitSupported = undefined;
    const hasTimestamp = undefined;
    const hasExtraData = true;
    const additionals = ['sapling'];
    const tx = await ledger.splitTransaction(
      transactionHex,
      isSegwitSupported,
      hasTimestamp,
      hasExtraData,
      additionals,
    );
    return [tx, utxo.vout];
  }));
  const associatedKeysets = utxos.map(utxo => utxo.derivationPath);
  const changePath = undefined;
  const outputScript = buildOutputScript([outputs]);
  const unixtime = Math.floor(Date.now() / 1000);
  const lockTime = (unixtime - 777);
  const sigHashType = undefined;
  const segwit = undefined;
  const initialTimestamp = undefined;
  const additionals = ['sapling'];
  const expiryHeight = Buffer.from([0x00, 0x00, 0x00, 0x00]);

  const transaction = await ledger.createPaymentTransactionNew(
    inputs,
    associatedKeysets,
    changePath,
    outputScript,
    lockTime,
    sigHashType,
    segwit,
    initialTimestamp,
    additionals,
    expiryHeight,
  );

  await ledger.close();

  return transaction;
};

const getXpub = async derivationPath => {
  const ledger = await getDevice();
  const {publicKey, chainCode} = await ledger.getWalletPublicKey(derivationPath);
  const pathArray = bip32Path.fromString(derivationPath).toPathArray();
  const depth = pathArray.length;
  const childNumber = ((0x80000000 | pathArray.pop()) >>> 0);
  const xpub = createXpub({
    depth,
    childNumber,
    publicKey,
    chainCode,
  });
  
  await ledger.close();
  
  return xpub;
};

const ledger = {
  getDevice,
  isAvailable,
  getAddress,
  createTransaction,
  getXpub,
  setLedgerFWVersion,
  getLedgerFWVersion,
  setLedgerTransport,
  resetTransport,
  transportOptions: transport,
};

export default ledger;
