const coinselect = require('coinselect');
//const checkPublicAddress = require('./validate-address');
const {maxSpendBalance} = require('./math');

// TODO: refactor

const transactionBuilder = (network, value, fee, outputAddress, changeAddress, utxoList) => {
  /*if (checkPublicAddress(outputAddress) !== true) {
    throw new Error('Invalid output address');
  }
  
  if (checkPublicAddress(changeAddress) !== true) {
    throw new Error('Invalid change address');
  }

  /*if (!utils.isNumber(value) ||
      !utils.isPositiveNumber(value) ||
      !Number.isInteger(value)) {
    throw new Error('Wrong value');
  }

  if (!fee.hasOwnProperty('perByte') &&
      (!utils.isNumber(fee) ||
      !utils.isPositiveNumber(fee) ||
      !Number.isInteger(fee))) {
    throw new Error('Wrong fee');
  }

  if (fee.hasOwnProperty('perByte') &&
      (!utils.isNumber(fee.value) ||
      !utils.isPositiveNumber(fee.value) ||
      !Number.isInteger(fee.value))) {
    throw new Error('Wrong fee');
  }*/

  const inputValue = value;

  if (utxoList &&
      utxoList.length &&
      utxoList[0] &&
      utxoList[0].txid) {
    const utxoListFormatted = [];
    const interestClaimThreshold = 200;
    let totalInterest = 0;
    let utxoVerified = true;

    for (let i = 0; i < utxoList.length; i++) {
      let _utxo = {
        txid: utxoList[i].txid,
        vout: utxoList[i].vout,
        value: Number(utxoList[i].amountSats || utxoList[i].value),
        verified: utxoList[i].verified ? utxoList[i].verified : false,
      };

      if (network.kmdInterest) {
        _utxo.interestSats = Number(utxoList[i].interestSats || utxoList[i].interest || 0);
      }

      if (utxoList[i].hasOwnProperty('dpowSecured')) {
        _utxo.dpowSecured = utxoList[i].dpowSecured;
      }

      if (utxoList[i].hasOwnProperty('currentHeight')) {
        _utxo.currentHeight = utxoList[i].currentHeight;
      }

      utxoListFormatted.push(_utxo);
    }

    const _maxSpendBalance = Number(maxSpendBalance(utxoListFormatted));
    
    if (value > _maxSpendBalance) {
      throw new Error('Spend value is too large');
    }
  
    const targets = [{
      address: outputAddress,
      value: value > _maxSpendBalance ? _maxSpendBalance : value,
    }];

    targets[0].value = targets[0].value + fee;

    // default coin selection algo blackjack with fallback to accumulative
    // make a first run, calc approx tx fee
    // if ins and outs are empty reduce max spend by txfee
    const firstRun = coinselect(utxoListFormatted, targets, 0);
    let inputs = firstRun.inputs;
    let outputs = firstRun.outputs;

    if (!outputs) {
      targets[0].value = targets[0].value - fee;

      const secondRun = coinselect(utxoListFormatted, targets, 0);
      inputs = secondRun.inputs;
      outputs = secondRun.outputs;
      fee = fee || secondRun.fee;
    }

    let _change = 0;

    if (outputs &&
        outputs.length === 2) {
      _change = outputs[1].value - fee;
    }

    if (_change === 0) {
      outputs[0].value = outputs[0].value - fee;
    } else if (_change >= 0) {
      value = outputs[0].value - fee;
    }
    
    if (outputs[0].value === value + fee) {
      outputs[0].value === outputs[0].value - fee;
      targets[0].value = targets[0].value - fee;
    }

    // check if any outputs are unverified
    if (inputs &&
        inputs.length) {
      for (let i = 0; i < inputs.length; i++) {
        if (!inputs[i].verified) {
          utxoVerified = false;
          break;
        }
      }

      for (let i = 0; i < inputs.length; i++) {
        if (Number(inputs[i].interestSats) > interestClaimThreshold) {
          totalInterest += Number(inputs[i].interestSats);
        }
      }
    }

    // account for KMD interest
    if (network.kmdInterest &&
        totalInterest > 0) {
      // account for extra vout

      if ((_maxSpendBalance - fee) === value) {
        _change = totalInterest - _change;

        if (outputAddress === changeAddress) {
          value += _change;
          _change = 0;
        }
      } else {
        _change += totalInterest;
      }

      // double check kmd interest is combined into 1 output
      if (outputAddress === changeAddress &&
          _change > 0) {
        value += _change - fee;

        if (Math.abs(value - inputValue) > fee) {
          value += fee;
        }

        _change = 0;
      }
    }

    if (!inputs &&
        !outputs) {
      throw new Error('Can\'t find best fit utxo. Try lower amount.');
    }
    
    let vinSum = 0;

    for (let i = 0; i < inputs.length; i++) {
      vinSum += inputs[i].value;
    }

    let voutSum = 0;
    
    for (let i = 0; i < outputs.length; i++) {
      voutSum += outputs[i].value;
    }

    const _estimatedFee = vinSum - voutSum - totalInterest;

    // double check no extra fee is applied
    if ((vinSum - value - _change) > fee) {
      _change += fee;
    } else if ((vinSum - value - _change) === 0) { // max amount spend edge case
      value -= fee;
    }

    // TODO: use individual dust thresholds
    if (_change > 0 &&
        _change <= 1000) {
      _change = 0;
    }

    if (vinSum === inputValue + fee &&
        _change > 0) {
      _change = 0;
    }

    return {
      outputAddress,
      changeAddress,
      network,
      change: _change,
      value: inputValue <= _maxSpendBalance && totalInterest <= 0 ? inputValue : value,
      inputValue,
      inputs,
      outputs,
      targets,
      fee,
      estimatedFee: _estimatedFee,
      balance: _maxSpendBalance,
      totalInterest,
      utxoVerified,
    };
  }
  
  throw new Error ('No valid UTXO');
};

module.exports = transactionBuilder;