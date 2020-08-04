import TrezorConnect from 'trezor-connect';

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
    showOnTrezor: verify ? true : false,
  })
  .then((result) => {
    return result && result.payload && result.payload.address ? result.payload.address : null; 
  });

  return bitcoinAddress;
};

const createTransaction = async (utxos, outputs, isKMD) => {
  let tx = {
    versionGroupId: 2301567109, // zec sapling forks only
    branchId: 1991772603, // zec sapling forks only
    overwintered: true, // zec sapling forks only
    version: 4, // zec sapling forks only
    push: false,
    coin: 'kmd',
    outputs: [],
    inputs: [],
    refTxs: [],
  };

  tx.locktime = isKMD ? Math.floor(Date.now() / 1000) - 777 : 0;

  for (let i = 0; i < utxos.length; i++) {
    const derivationPathPartials = utxos[i].derivationPath.replace(/'/g, '').split('/');
    tx.inputs.push({
      address_n: [(44 | 0x80000000) >>> 0, (141 | 0x80000000) >>> 0, (derivationPathPartials[2] | 0x80000000) >>> 0, derivationPathPartials[3], derivationPathPartials[4]],
      prev_index: utxos[i].vout,
      prev_hash: utxos[i].txid,
      amount: utxos[i].satoshis.toString(),
    });
  }
  
  tx.outputs.push({
    address: outputs[0].address,
    amount: outputs[0].value.toString(),
    script_type: 'PAYTOADDRESS',
  });

  if (outputs.length === 2) {
    const changeAddressDerivationPathPartials = outputs[1].derivationPath.replace(/'/g, '').split('/');
    
    tx.outputs.push({
      address_n: [(44 | 0x80000000) >>> 0, (141 | 0x80000000) >>> 0, (changeAddressDerivationPathPartials[2] | 0x80000000) >>> 0, changeAddressDerivationPathPartials[3], changeAddressDerivationPathPartials[4]],
      amount: outputs[1].value.toString(),
      script_type: 'PAYTOADDRESS',
    });
  }

  const uniqueInputs = getUniqueInputs(utxos);
  
  for (let i = 0; i < uniqueInputs.length; i++) {
    tx.refTxs.push({
      hash: uniqueInputs[i].txid,
      inputs: [],
      bin_outputs: [],
      version: uniqueInputs[i].version,
      lock_time: uniqueInputs[i].locktime,
    });

    for (let j = 0; j < uniqueInputs[i].inputs.length; j++) {
      tx.refTxs[i].inputs.push({
        prev_hash: uniqueInputs[i].inputs[j].txid,
        prev_index: uniqueInputs[i].inputs[j].n,
        script_sig: uniqueInputs[i].inputs[j].scriptSig.hex,
        sequence: uniqueInputs[i].inputs[j].sequence,
      });
    }
  
    for (let j = 0; j < uniqueInputs[i].outputs.length; j++) {
      tx.refTxs[tx.refTxs.length - 1].bin_outputs.push({
        amount: Number((Number(uniqueInputs[i].outputs[j].value).toFixed(8) * 100000000).toFixed(0)),
        script_pubkey: uniqueInputs[i].outputs[j].scriptPubKey.hex,
      });
    }
  }
  
  const transaction = await TrezorConnect.signTransaction(tx)
  .then((res) => {
    console.warn(res);
    console.warn('trezor tx', tx);

    if (res.payload.hasOwnProperty('error')) {
      // res.payload
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
  getDevice,
  isAvailable,
  getAddress,
  createTransaction,
  getXpub,
};

export default trezor;
