/*
MIT License

Copyright (c) 2017 Yuki Akiyama, SuperNET
Copyright (c) 2017 - 2020 SuperNET

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

const network = require('./networks');
const bitcoin = require('bitgo-utxo-lib');

// zcash tx decode fallback
const Buffer = require('safe-buffer').Buffer;
const {
  readSlice,
  readInt32,
  readUInt32,
} = require('tx-decoder/build/buffer-utils');
const {
  compose,
  addProp,
} = require('tx-decoder/build/compose');
const {
  readInputs,
  readInput,
  readOutput,
} = require('tx-decoder/build/tx-decoder');
const crypto = require('crypto');

const _sha256 = data => crypto.createHash('sha256').update(data).digest();

const decodeFormat = (tx) => {
  const result = {
    txid: tx.getId(),
    version: tx.version,
    locktime: tx.locktime,
  };

  return result;
};

const decodeInput = (tx, network) => {
  const result = [];

  tx.ins.forEach((input, n) => {
    const vin = {
      txid: !input.hash.reverse ? input.hash : input.hash.reverse().toString('hex'),
      n: input.index,
      script: bitcoin.script.toASM(input.script),
      sequence: input.sequence,
    };

    result.push(vin);
  });

  return result;
};

const decodeOutput = (tx, network) => {
  const format = (out, n, network) => {
    const vout = {
      satoshi: out.value,
      value: (1e-8 * out.value).toFixed(8),
      n,
      scriptPubKey: {
        asm: bitcoin.script.toASM(out.script),
        hex: out.script.toString('hex'),
        type: bitcoin.script.classifyOutput(out.script),
        addresses: [],
      },
    };

    switch (vout.scriptPubKey.type) {
    case 'pubkeyhash':
      vout.scriptPubKey.addresses.push(bitcoin.address.fromOutputScript(out.script, network));
      break;
    case 'pubkey':
      const pubKeyBuffer = new Buffer(vout.scriptPubKey.asm.split(' ')[0], 'hex');
      vout.scriptPubKey.addresses.push(bitcoin.ECPair.fromPublicKeyBuffer(pubKeyBuffer, network).getAddress());
      break;
    case 'scripthash':
      vout.scriptPubKey.addresses.push(bitcoin.address.fromOutputScript(out.script, network));
      break;
    }

    return vout;
  };

  const result = [];

  tx.outs.forEach((out, n) => {
    result.push(format(out, n, network));
  });

  return result;
};

const transactionDecoder = (rawtx, debug) => {
  if (debug) {
    const _tx = bitcoin.Transaction.fromHex(rawtx, network ? network : null);

    return {
      tx: _tx,
      network,
      format: decodeFormat(_tx),
      inputs: decodeInput(_tx, network),
      outputs: decodeOutput(_tx, network),
    };
  }

  if (network.isZcash &&
      !network.sapling) {
    const buffer = Buffer.from(rawtx, 'hex');

    const decodeTx = buffer => (
      compose([
        addProp('version', readInt32), // 4 bytes
        addProp('ins', readInputs(readInput)), // 1-9 bytes (VarInt), Input counter; Variable, Inputs
        addProp('outs', readInputs(readOutput)), // 1-9 bytes (VarInt), Output counter; Variable, Outputs
        addProp('locktime', readUInt32), // 4 bytes
      ])({}, buffer)
    );

    const readHash = (buffer) => {
      const [res, bufferLeft] = readSlice(32)(_sha256(_sha256(buffer)));
      const hash = Buffer.from(res, 'hex').reverse().toString('hex');
      return [hash, bufferLeft];
    };

    const decodedtx = decodeTx(buffer);
    decodedtx[0].getId = () => readHash(buffer)[0];

    return {
      tx: decodedtx[0],
      network,
      format: decodeFormat(decodedtx[0]),
      inputs: !decodedtx[0].ins.length ? [{ txid: '0000000000000000000000000000000000000000000000000000000000000000' }] : decodeInput(decodedtx[0], network),
      outputs: decodeOutput(decodedtx[0], network),
    };
  } else if (network.sapling) {
    const _tx = bitcoin.Transaction.fromHex(rawtx, network);

    if (_tx.joinsplits ||
        (_tx.vShieldedSpend || _tx.vShieldedOutput)) {
      const buffer = Buffer.from(rawtx, 'hex');
      const readHash = buffer => {
        const [res, bufferLeft] = readSlice(32)(_sha256(_sha256(buffer)));
        const hash = Buffer.from(res, 'hex').reverse().toString('hex');
        return hash;
      };

      _tx.getId = () => {
        return readHash(buffer);
      };

      return {
        tx: _tx,
        network: network,
        format: decodeFormat(_tx),
        inputs: !_tx.ins.length ? [{ txid: '0000000000000000000000000000000000000000000000000000000000000000' }] : decodeInput(_tx, network),
        outputs: decodeOutput(_tx, network),
      };
    }
  }

  try {
    const _tx = bitcoin.Transaction.fromHex(rawtx);
    
    let _decodedTx = {
      tx: _tx,
      network,
      format: decodeFormat(_tx),
      inputs: decodeInput(_tx, network),
      outputs: decodeOutput(_tx, network),
    };

    return _decodedTx;
  } catch (e) {
    return false;
  }
};

module.exports = transactionDecoder;