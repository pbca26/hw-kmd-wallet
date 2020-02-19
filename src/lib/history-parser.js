const historyParser = (tx, targetAddress, options) => {
  // TODO: - sum vins / sum vouts to the same address
  //       - multi vin multi vout
  //       - detect change address
  //       - double check for exact sum input/output values
  let result = [];
  const _parse = {
    inputs: {},
    outputs: {},
  };
  const _sum = {
    inputs: 0,
    outputs: 0,
  };
  const _total = {
    inputs: 0,
    outputs: 0,
  };
  const _addresses = {
    inputs: [],
    outputs: [],
  };

  if (typeof tx.format !== 'object' ||
      tx.format === null) {
    return {
      type: 'unknown',
      amount: 'unknown',
      address: targetAddress,
      timestamp: tx.timestamp && Number(tx.timestamp) || 'unknown',
      txid: tx.format && tx.format.txid || 'unknown',
      confirmations: tx.confirmations && Number(tx.confirmations) || 'unknown',
    };
  }

  for (const key in _parse) {
    if (!tx[key].length) {
      _parse[key] = [];
      _parse[key].push(tx[key]);
    } else {
      _parse[key] = tx[key];
    }

    for (let i = 0; i < _parse[key].length; i++) {
      _total[key] += Number(_parse[key][i].value);

      // ignore op return outputs
      if (_parse[key][i].scriptPubKey &&
          _parse[key][i].scriptPubKey.addresses &&
          _parse[key][i].scriptPubKey.addresses[0] &&
          _parse[key][i].scriptPubKey.addresses[0] === targetAddress &&
          _parse[key][i].value) {
        _sum[key] += Number(_parse[key][i].value);
      }

      if (_parse[key][i].scriptPubKey &&
          _parse[key][i].scriptPubKey.addresses &&
          _parse[key][i].scriptPubKey.addresses[0]) {
        _addresses[key].push(_parse[key][i].scriptPubKey.addresses[0]);

        if (_parse[key][i].scriptPubKey.addresses[0] === targetAddress &&
            options &&
            options.skipTargetAddress) {
          _addresses[key].pop();
        }
      }
    }
  }

  _addresses.inputs = [...new Set(_addresses.inputs)];
  _addresses.outputs = [...new Set(_addresses.outputs)];

  const isSelfSend = {
    inputs: false,
    outputs: false,
  };

  for (const key in _parse) {
    for (let i = 0; i < _addresses[key].length; i++) {
      if (_addresses[key][i] === targetAddress &&
          _addresses[key].length === 1) {
        isSelfSend[key] = true;
      }
    }
  }

  if (_sum.inputs > 0 &&
      _sum.outputs > 0) {
    // vin + change, break into two tx

    // send to self
    if (isSelfSend.inputs &&
        isSelfSend.outputs) {
      result = {
        type: 'self',
        amount: _sum.inputs === _sum.outputs ? Number(Number(_sum.outputs).toFixed(8)) : Number(Number(_sum.inputs - _sum.outputs).toFixed(8)),
        amountIn: Number(Number(_sum.inputs).toFixed(8)),
        amountOut: Number(Number(_sum.outputs).toFixed(8)),
        totalIn: Number(Number(_total.inputs).toFixed(8)),
        totalOut: Number(Number(_total.outputs).toFixed(8)),
        fee: Number(Number(_total.inputs - _total.outputs).toFixed(8)),
        address: targetAddress,
        timestamp: tx.timestamp && Number(tx.timestamp) || 'unknown',
        txid: tx.format.txid || 'unknown',
        confirmations: tx.confirmations && Number(tx.confirmations) || 'unknown',
      };

      if (options &&
          options.isKomodo) { // calc claimed interest amount
        const vinVoutDiff = _total.inputs - _total.outputs;

        if (vinVoutDiff < 0) {
          result.interest = Math.abs(Number(vinVoutDiff.toFixed(8)));

          if (result.amount < 0) {
            result.amount = Number(Number(_total.outputs).toFixed(8));
          }
        }
      }
    } else {
      result = {
        type: 'sent',
        amount: Number(Number(options && options.isKomodo && (_sum.inputs - _sum.outputs) < 0 ? _total.outputs - _sum.outputs : _sum.inputs - _sum.outputs).toFixed(8)),
        amountIn: Number(Number(_sum.inputs).toFixed(8)),
        amountOut: Number(Number(_sum.outputs).toFixed(8)),
        totalIn: Number(Number(_total.inputs).toFixed(8)),
        totalOut: Number(Number(_total.outputs).toFixed(8)),
        fee: Number(Number(_total.inputs - _total.outputs).toFixed(8)),
        address: _addresses.outputs[0],
        timestamp: tx.timestamp && Number(tx.timestamp) || 'unknown',
        txid: tx.format.txid || 'unknown',
        confirmations: tx.confirmations && Number(tx.confirmations) || 'unknown',
        from: _addresses.inputs,
        to: _addresses.outputs,
      };

      if (options &&
          options.isKomodo) { // calc claimed interest amount
        const vinVoutDiff = _total.inputs - _total.outputs;

        if (vinVoutDiff < 0) {
          result.interest = Math.abs(Number(vinVoutDiff.toFixed(8)));
        }
      }
    }
  } else if (
    _sum.inputs === 0 &&
    _sum.outputs > 0
  ) {
    result = {
      type: 'received',
      amount: Number(Number(_sum.outputs).toFixed(8)),
      amountIn: Number(Number(_sum.inputs).toFixed(8)),
      amountOut: Number(Number(_sum.outputs).toFixed(8)),
      totalIn: Number(Number(_total.inputs).toFixed(8)),
      totalOut: Number(Number(_total.outputs).toFixed(8)),
      fee: Number(Number(_total.inputs - _total.outputs).toFixed(8)),
      address: targetAddress,
      timestamp: tx.timestamp && Number(tx.timestamp) || 'unknown',
      txid: tx.format.txid || 'unknown',
      confirmations: tx.confirmations && Number(tx.confirmations) || 'unknown',
      inputAddresses: _addresses.inputs,
      outputAddresses: _addresses.outputs,
    };
  } else if (
    _sum.inputs > 0 &&
    _sum.outputs === 0
  ) {
    result = {
      type: 'sent',
      amount: Number(Number(_sum.inputs).toFixed(8)),
      amountIn: Number(Number(_sum.inputs).toFixed(8)),
      amountOut: Number(Number(_sum.outputs).toFixed(8)),
      totalIn: Number(Number(_total.inputs).toFixed(8)),
      totalOut: Number(Number(_total.outputs).toFixed(8)),
      fee: Number(Number(_total.inputs - _total.outputs).toFixed(8)),
      address: isSelfSend.inputs && isSelfSend.outputs ? targetAddress : _addresses.outputs[0],
      timestamp: tx.timestamp && Number(tx.timestamp) || 'unknown',
      txid: tx.format.txid || 'unknown',
      confirmations: tx.confirmations && Number(tx.confirmations) || 'unknown',
      inputAddresses: _addresses.inputs,
      outputAddresses: _addresses.outputs,
    };

    if (options &&
        options.isKomodo) { // calc claimed interest amount
      const vinVoutDiff = _total.inputs - _total.outputs;

      if (vinVoutDiff < 0) {
        result.interest = Math.abs(Number(vinVoutDiff.toFixed(8)));
      }
    }
  } else {
    // (?)
    result = {
      type: 'other',
      amount: 'unknown',
      address: 'unknown',
      timestamp: tx.timestamp && Number(tx.timestamp) || 'unknown',
      txid: tx.format.txid || 'unknown',
      confirmations: tx.confirmations && Number(tx.confirmations) || 'unknown',
    };
  }

  return result;
};

module.exports = historyParser;