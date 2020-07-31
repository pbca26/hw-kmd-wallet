import TransportU2F from '@ledgerhq/hw-transport-u2f';
import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
import Btc from '@ledgerhq/hw-app-btc';
import buildOutputScript from './build-output-script';
import bip32Path from 'bip32-path';
import createXpub from './create-xpub';
import TrezorConnect from 'trezor-connect';
import {KOMODO} from '../constants';

// TODO: get ledger fw version programmatically
//       https://github.com/LedgerHQ/ledger-live-common/blob/master/src/hw/getVersion.js
//       https://github.com/LedgerHQ/ledgerjs/issues/365

let vendor;
let ledgerFWVersion = 'default';

const getUniqueInputs = (utxos) => {
  let uniqueInputs = [];
  let uniqueTxids = [];

  for (let i = 0; i < utxos.length; i++) {
    if (uniqueTxids.indexOf(utxos[i].txid) === -1) {
      uniqueTxids.push(utxos[i].txid);
      uniqueInputs.push(utxos[i]);
    }
  }

  console.warn(`total utxos ${utxos.length} | unique utxos ${uniqueTxids.length}`);
  
  return uniqueInputs;
};

const setLedgerFWVersion = (name) => {
  ledgerFWVersion = name;
  console.warn(ledgerFWVersion);
};

const getLedgerFWVersion = () => {
  return ledgerFWVersion;
};

const setVendor = (name) => {
  vendor = name;
};

const getVendor = () => {
  return vendor;
};

const getDevice = async () => {
  if (vendor === 'ledger') {
    const transport = window.location.href.indexOf('ledger-webusb') > -1 || ledgerFWVersion === 'webusb' ? await TransportWebUSB.create() : await TransportU2F.create();
    const ledger = new Btc(transport);

    ledger.close = () => transport.close();

    return ledger;
  } else {
    return TrezorConnect;
  }
};

const isAvailable = async () => {
  if (vendor === 'ledger') {
    const ledger = await getDevice();
    try {
      await ledger.getWalletPublicKey(`m/44'/0'/0'/0/0`);
      await ledger.close();
      return true;
    } catch (error) {
      return false;
    }
  } else {
    const trezorRes = await TrezorConnect.getPublicKey({
      path: `m/141'/0'/0'/0/0`,
    })
    .then((result) => {
      return result && result.success === true ? true : false; 
    });

    return trezorRes;
  }
};

const getAddress = async (derivationPath, verify) => {
  if (vendor === 'ledger') {
    const ledger = await getDevice();
    const {bitcoinAddress} = await ledger.getWalletPublicKey(derivationPath, {verify});
    await ledger.close();

    return bitcoinAddress;
  } else {
    const bitcoinAddress = await TrezorConnect.getAddress({
      path: `m/${derivationPath}`,
      showOnTrezor: verify ? true : false,
    })
    .then((result) => {
      return result && result.payload && result.payload.address ? result.payload.address : null; 
    });

    return bitcoinAddress;
  }
};

const createTransaction = async function(utxos, outputs, isKMD) {
  if (vendor === 'ledger') {
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
        additionals
      );
      return [tx, utxo.vout];
    }));
    const associatedKeysets = utxos.map(utxo => utxo.derivationPath);
    const changePath = outputs.length === 2 ? outputs[1].derivationPath : undefined;
    const outputScript = buildOutputScript(outputs);
    const unixtime = Math.floor(Date.now() / 1000);
    const lockTime = isKMD ? unixtime - 777 : 0;
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
      expiryHeight
    );

    await ledger.close();

    return transaction;
  } else {
    let tx = {
      versionGroupId: KOMODO.versionGroupId, // zec sapling forks only
      branchId: KOMODO.consensusBranchId['4'], // zec sapling forks only
      overwintered: true, // zec sapling forks only
      version: 4, // zec sapling forks only
      push: false,
      coin: 'kmd',
      locktime: isKMD ? Math.floor(Date.now() / 1000) - 777 : 0,
      outputs: [{
        address: outputs[0].address,
        amount: outputs[0].value.toString(),
        script_type: 'PAYTOADDRESS',
      }],
      inputs: utxos.map((utxo) => {
        const derivationPathPartials = utxo.derivationPath.replace(/'/g, '').split('/');
        return {
          address_n: [
            (44 | 0x80000000) >>> 0,
            (141 | 0x80000000) >>> 0,
            (derivationPathPartials[2] | 0x80000000) >>> 0,
            derivationPathPartials[3],
            derivationPathPartials[4]
          ],
          prev_index: utxo.vout,
          prev_hash: utxo.txid,
          amount: utxo.satoshis.toString(),
        };
      }),
      // reduce multiple vouts related to one tx into a single array element 
      refTxs: getUniqueInputs(utxos).map((refTx) => {
        return {
          hash: refTx.txid,
          inputs: refTx.inputs.map((input) => {
            return {
              prev_hash: input.txid,
              prev_index: input.vout,
              script_sig: input.scriptSig.hex,
              sequence: input.sequence,
            };
          }),
          bin_outputs: refTx.outputs.map((output) => {
            return {
              amount: Number((Number(output.value).toFixed(8) * 100000000).toFixed(0)),
              script_pubkey: output.scriptPubKey.hex,
            };
          }),
          version: refTx.version,
          lock_time: refTx.locktime,
          version_group_id: refTx.nVersionGroupId,
          branch_id: KOMODO.consensusBranchId[refTx.version],
          // how to get extra_data https://github.com/trezor/trezor-utxo-lib/blob/trezor/src/transaction.js#L1200
          extra_data: '0000000000000000000000',
          expiry: refTx.nExpiryHeight || 0,
        }; 
      }),
    };
    
    // change
    if (outputs.length === 2) {
      const changeAddressDerivationPathPartials = outputs[1].derivationPath.replace(/'/g, '').split('/');
      
      tx.outputs.push({
        address_n: [
          (44 | 0x80000000) >>> 0,
          (141 | 0x80000000) >>> 0,
          (changeAddressDerivationPathPartials[2] | 0x80000000) >>> 0,
          changeAddressDerivationPathPartials[3],
          changeAddressDerivationPathPartials[4]
        ],
        amount: outputs[1].value.toString(),
        script_type: 'PAYTOADDRESS',
      });
    }
    
    const transaction = await TrezorConnect.signTransaction(tx)
    .then((res) => {
      if (res.payload.hasOwnProperty('error')) {
        if (window.location.href.indexOf('devmode') > -1) {
          console.warn('trezor tx obj', tx);
          console.warn('trezor signTransaction error', res);
        }
        return null;
      } else {
        return res.payload.serializedTx;
      }
    });

    return transaction;
  }
};

const getXpub = async derivationPath => {
  if (vendor === 'ledger') {
    const ledger = await getDevice();
    const {publicKey, chainCode} = await ledger.getWalletPublicKey(derivationPath);
    const pathArray = bip32Path.fromString(derivationPath).toPathArray();
    const depth = pathArray.length;
    const childNumber = ((0x80000000 | pathArray.pop()) >>> 0);
    const xpub = createXpub({
      depth,
      childNumber,
      publicKey,
      chainCode
    });
    await ledger.close();
    return xpub;
  } else {
    const xpub = await TrezorConnect.getPublicKey({
      path: `m/${derivationPath}`,
    })
    .then((result) => {
      return result && result.payload && result.payload.xpub ? result.payload.xpub : null; 
    });

    return xpub;
  }
};

const ledger = {
  getDevice,
  isAvailable,
  getAddress,
  createTransaction,
  getXpub,
  setVendor,
  getVendor,
  setLedgerFWVersion,
  getLedgerFWVersion
};

export default ledger;
