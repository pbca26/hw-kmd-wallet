import transactionBuilder from '../lib/transaction-builder';
import { toSats } from '../lib/math';

test('it should prepare transaction data for KMD external transfer', () => {
  const utxo = [{
    "txid": "33f61397abaf2f2bfd212d71432e5c9032b3033476e78d7ed1a654eb564639f9",
    "vout": 1,
    "value": toSats(1),
    "height": 1,
    "currentHeight": 1,
  }];
  
  const data = transactionBuilder(
    {},
    toSats(0.001),
    toSats(0.0001),
    'RHvM8DMwvFggeaLy46cXM41GzpYur6oWEe',
    'RRyBxbrAPRUBCUpiJgJZYrkxqrh8x5ta9Z',
    utxo
  );

  expect(data).toEqual({
    "outputAddress": "RHvM8DMwvFggeaLy46cXM41GzpYur6oWEe",
    "changeAddress": "RRyBxbrAPRUBCUpiJgJZYrkxqrh8x5ta9Z",
    "network": {
    },
    "change": 99890000,
    "value": 100000,
    "inputValue": 100000,
    "inputs": [
      {
        "txid": "33f61397abaf2f2bfd212d71432e5c9032b3033476e78d7ed1a654eb564639f9",
        "vout": 1,
        "value": 100000000,
        "currentHeight": 1
      }
    ],
    "outputs": [
      {
        "address": "RHvM8DMwvFggeaLy46cXM41GzpYur6oWEe",
        "value": 100000
      },
      {
        "value": 99890000
      }
    ],
    "targets": [
      {
        "address": "RHvM8DMwvFggeaLy46cXM41GzpYur6oWEe",
        "value": 100000
      }
    ],
    "fee": 10000,
    "estimatedFee": 10000,
    "balance": 100000000,
    "totalInterest": 0,
  });
});

test('it should prepare transaction data for KMD self send', () => {
  const utxo = [{
    "txid": "33f61397abaf2f2bfd212d71432e5c9032b3033476e78d7ed1a654eb564639f9",
    "vout": 1,
    "value": toSats(1),
    "height": 1,
    "currentHeight": 1,
    "interest": toSats(0.1),
  }];
  
  const data = transactionBuilder(
    {},
    toSats(0.001),
    toSats(0.0001),
    'RRyBxbrAPRUBCUpiJgJZYrkxqrh8x5ta9Z',
    'RRyBxbrAPRUBCUpiJgJZYrkxqrh8x5ta9Z',
    utxo
  );

  expect(data).toEqual({
    "outputAddress": "RRyBxbrAPRUBCUpiJgJZYrkxqrh8x5ta9Z",
    "changeAddress": "RRyBxbrAPRUBCUpiJgJZYrkxqrh8x5ta9Z",
    "network": {
    },
    "change": 99890000,
    "value": 100000,
    "inputValue": 100000,
    "inputs": [
      {
        "txid": "33f61397abaf2f2bfd212d71432e5c9032b3033476e78d7ed1a654eb564639f9",
        "vout": 1,
        "value": 100000000,
        "currentHeight": 1
      }
    ],
    "outputs": [
      {
        "address": "RRyBxbrAPRUBCUpiJgJZYrkxqrh8x5ta9Z",
        "value": 100000
      },
      {
        "value": 99890000
      }
    ],
    "targets": [
      {
        "address": "RRyBxbrAPRUBCUpiJgJZYrkxqrh8x5ta9Z",
        "value": 100000
      }
    ],
    "fee": 10000,
    "estimatedFee": 10000,
    "balance": 100000000,
    "totalInterest": 0,
  });
});

test('it should prepare transaction data for KMD self claim interest', () => {
  const utxo = [{
    "txid": "33f61397abaf2f2bfd212d71432e5c9032b3033476e78d7ed1a654eb564639f9",
    "vout": 1,
    "value": toSats(1),
    "height": 1,
    "currentHeight": 1,
    "interest": toSats(0.1),
  }];
  
  const data = transactionBuilder(
    {
      kmdInterest: true,
    },
    toSats(0.001),
    toSats(0.0001),
    'RRyBxbrAPRUBCUpiJgJZYrkxqrh8x5ta9Z',
    'RRyBxbrAPRUBCUpiJgJZYrkxqrh8x5ta9Z',
    utxo
  );

  expect(data).toEqual({
    "outputAddress": "RRyBxbrAPRUBCUpiJgJZYrkxqrh8x5ta9Z",
    "changeAddress": "RRyBxbrAPRUBCUpiJgJZYrkxqrh8x5ta9Z",
    "network": {
      "kmdInterest": true
    },
    "change": 0,
    "value": 109980000,
    "inputValue": 100000,
    "inputs": [
      {
        "txid": "33f61397abaf2f2bfd212d71432e5c9032b3033476e78d7ed1a654eb564639f9",
        "vout": 1,
        "value": 100000000,
        "interestSats": 10000000,
        "currentHeight": 1
      }
    ],
    "outputs": [
      {
        "address": "RRyBxbrAPRUBCUpiJgJZYrkxqrh8x5ta9Z",
        "value": 100000
      },
      {
        "value": 99890000
      }
    ],
    "targets": [
      {
        "address": "RRyBxbrAPRUBCUpiJgJZYrkxqrh8x5ta9Z",
        "value": 100000
      }
    ],
    "fee": 10000,
    "estimatedFee": -9990000,
    "balance": 100000000,
    "totalInterest": 10000000,
  });
});

test('it should prepare transaction data for KMD external send + claim interest', () => {
  const utxo = [{
    "txid": "33f61397abaf2f2bfd212d71432e5c9032b3033476e78d7ed1a654eb564639f9",
    "vout": 1,
    "value": toSats(1),
    "height": 1,
    "currentHeight": 1,
    "interest": toSats(0.1),
  }];
  
  const data = transactionBuilder(
    {
      kmdInterest: true,
    },
    toSats(0.001),
    toSats(0.0001),
    'RHvM8DMwvFggeaLy46cXM41GzpYur6oWEe',
    'RRyBxbrAPRUBCUpiJgJZYrkxqrh8x5ta9Z',
    utxo
  );

  expect(data).toEqual({
    "outputAddress": "RHvM8DMwvFggeaLy46cXM41GzpYur6oWEe",
    "changeAddress": "RRyBxbrAPRUBCUpiJgJZYrkxqrh8x5ta9Z",
    "network": {
      "kmdInterest": true
    },
    "change": 109880000,
    "value": 100000,
    "inputValue": 100000,
    "inputs": [
      {
        "txid": "33f61397abaf2f2bfd212d71432e5c9032b3033476e78d7ed1a654eb564639f9",
        "vout": 1,
        "value": 100000000,
        "interestSats": 10000000,
        "currentHeight": 1
      }
    ],
    "outputs": [
      {
        "address": "RHvM8DMwvFggeaLy46cXM41GzpYur6oWEe",
        "value": 100000
      },
      {
        "value": 99890000
      }
    ],
    "targets": [
      {
        "address": "RHvM8DMwvFggeaLy46cXM41GzpYur6oWEe",
        "value": 100000
      }
    ],
    "fee": 10000,
    "estimatedFee": -9990000,
    "balance": 100000000,
    "totalInterest": 10000000,
  });
});

test('it should prepare transaction data for KMD, donate dust to miners', () => {
  const utxo = [{
    "txid": "33f61397abaf2f2bfd212d71432e5c9032b3033476e78d7ed1a654eb564639f9",
    "vout": 1,
    "value": toSats(1),
    "height": 1,
    "currentHeight": 1,
  }];
  
  const data = transactionBuilder(
    {},
    toSats(0.9999),
    toSats(0.000091),
    'RRyBxbrAPRUBCUpiJgJZYrkxqrh8x5ta9Z',
    'RRyBxbrAPRUBCUpiJgJZYrkxqrh8x5ta9Z',
    utxo
  );

  expect(data).toEqual({
    "outputAddress": "RRyBxbrAPRUBCUpiJgJZYrkxqrh8x5ta9Z",
    "changeAddress": "RRyBxbrAPRUBCUpiJgJZYrkxqrh8x5ta9Z",
    "network": {
    },
    "change": 0,
    "value": 99990000,
    "inputValue": 99990000,
    "inputs": [
      {
        "txid": "33f61397abaf2f2bfd212d71432e5c9032b3033476e78d7ed1a654eb564639f9",
        "vout": 1,
        "value": 100000000,
        "currentHeight": 1
      }
    ],
    "outputs": [
      {
        "address": "RRyBxbrAPRUBCUpiJgJZYrkxqrh8x5ta9Z",
        "value": 99990000
      },
      {
        "value": 900
      }
    ],
    "targets": [
      {
        "address": "RRyBxbrAPRUBCUpiJgJZYrkxqrh8x5ta9Z",
        "value": 99990000
      }
    ],
    "fee": 9100,
    "estimatedFee": 9100,
    "balance": 100000000,
    "totalInterest": 0,
  });
});

test('it should prepare transaction data for KMD, throw error Spend value is too large', () => {
  const utxo = [{
    "txid": "33f61397abaf2f2bfd212d71432e5c9032b3033476e78d7ed1a654eb564639f9",
    "vout": 1,
    "value": 0.00000001,
    "height": 1,
    "currentHeight": 1,
  }];

  expect(() => transactionBuilder(
    {},
    10,
    10,
    'RRyBxbrAPRUBCUpiJgJZYrkxqrh8x5ta9Z',
    'RRyBxbrAPRUBCUpiJgJZYrkxqrh8x5ta9Z',
    utxo
  ))
  .toThrowError(/Spend value is too large/);
});

test('it should prepare transaction data for KMD, throw error No valid UTXO', () => {
  const utxo = [];

  expect(() => transactionBuilder(
    {},
    toSats(0.9999),
    toSats(0.000091),
    'RRyBxbrAPRUBCUpiJgJZYrkxqrh8x5ta9Z',
    'RRyBxbrAPRUBCUpiJgJZYrkxqrh8x5ta9Z',
    utxo
  ))
  .toThrowError(/No valid UTXO/);
});