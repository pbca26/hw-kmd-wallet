import TrezorConnect from 'trezor-connect';
import {KOMODO} from '../constants';

const getUniqueInputs = utxos => {
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

const init = () => {
  // this will work only on localhost
  if (window.location.href.indexOf('devmode') > -1) {
    TrezorConnect.init({
      webusb: true,
      popup: false,
      manifest: {
        email: 'developer@xyz.com',
        appUrl: 'http://your.application.com',
      },
    })
    .then((res) => {
      // note: mount point must exist before calling renderWebUSBButton method
      TrezorConnect.renderWebUSBButton('.trezor-webusb-container');
    });
  } else {
    TrezorConnect.manifest({
      email: 'developer@xyz.com',
      appUrl: 'http://your.application.com',
    });
  }
};

const getDevice = async () => {
  return TrezorConnect;
};

const isAvailable = async () => {
  const trezorRes = await TrezorConnect.getPublicKey({
    path: `m/141'/0'/0'/0/0`,
  })
  .then((result) => {
    return result && result.success === true ? true : false; 
  });

  return trezorRes;
};

const getAddress = async (derivationPath, verify) => {
  const bitcoinAddress = await TrezorConnect.getAddress({
    path: `m/${derivationPath}`,
  })
  .then((result) => {
    return result && result.payload && result.payload.address ? result.payload.address : null; 
  });

  return bitcoinAddress;
};

const createTransaction = async (utxos, outputs) => {
  const tx = {
    versionGroupId: KOMODO.versionGroupId, // zec sapling forks only
    branchId: KOMODO.consensusBranchId['4'], // zec sapling forks only
    version: 4, // zec sapling forks only
    push: false,
    coin: 'kmd',
    locktime: Math.floor(Date.now() / 1000) - 777,
    outputs: [{
      address: outputs.address,
      amount: outputs.value.toString(),
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
        extra_data: '0000000000000000000000',
        expiry: refTx.nExpiryHeight || 0,
      };
    }),
  };
  
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
};

const getXpub = async derivationPath => {
  const xpub = await TrezorConnect.getPublicKey({
    path: `m/${derivationPath}`,
  })
  .then((result) => {
    return result && result.payload && result.payload.xpub ? result.payload.xpub : null; 
  });

  return xpub;
};

const trezor = {
  init,
  isAvailable,
  getDevice,
  getAddress,
  createTransaction,
  getXpub,
};

export default trezor;