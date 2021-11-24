import {
  fromSats,
  toSats,
  maxSpendBalance,
  convertExponentialToDecimal,
} from '../lib/math';

test('it should return 2.9 (math - maxSpendBalance)', () => {
  const utxo = [{
    value: '1',
  }, {
    value: '2',
  }];

  expect(maxSpendBalance(utxo, 0.1)).toBe(2.9);
});

test('it should return 0.1 (math - maxSpendBalance)', () => {
  const utxo = [{
    value: '1',
  }, {
    value: '2',
  }];

  expect(maxSpendBalance(utxo, 2.9)).toBe(0.1);
});

test('it should return 0 (math - maxSpendBalance)', () => {
  const utxo = [{
    value: '1',
  }, {
    value: '2',
  }];

  expect(maxSpendBalance(utxo, 3)).toBe(0);
});

test('it should return 0.00000001 (math - convertExponentialToDecimal)', () => {
  expect(convertExponentialToDecimal(1e-8, true)).toBe('0.00000001');
});

test('it should return 0.0000001 (math - convertExponentialToDecimal)', () => {
  expect(convertExponentialToDecimal(1e-7, true)).toBe('0.0000001');
});

test('it should return 0.000001 (math - convertExponentialToDecimal)', () => {
  expect(convertExponentialToDecimal(1e-6, true)).toBe('0.000001');
});

test('it should return 0.00001 (math - convertExponentialToDecimal)', () => {
  expect(convertExponentialToDecimal(1e-5, true)).toBe('0.00001');
});

test('it should return 0.0001 (math - convertExponentialToDecimal)', () => {
  expect(convertExponentialToDecimal(1e-4, true)).toBe('0.0001');
});

test('it should return 0.001 (math - convertExponentialToDecimal)', () => {
  expect(convertExponentialToDecimal(1e-3, true)).toBe('0.001');
});

test('it should return 0.01 (math - convertExponentialToDecimal)', () => {
  expect(convertExponentialToDecimal(1e-2, true)).toBe('0.01');
});

test('it should return 0.1 (math - convertExponentialToDecimal)', () => {
  expect(convertExponentialToDecimal(1e-1, true)).toBe('0.1');
});

test('it should return 0.00000001 (math - fromSats)', () => {
  expect(fromSats(1)).toBe(convertExponentialToDecimal(0.00000001));
});

test('it should return 0.0000001 (math - fromSats)', () => {
  expect(fromSats(1 * Math.pow(10, 1))).toBe(convertExponentialToDecimal(0.0000001));
});

test('it should return 0.000001 (math - fromSats)', () => {
  expect(fromSats(1 * Math.pow(10, 2))).toBe(convertExponentialToDecimal(0.000001));
});

test('it should return 0.00001 (math - fromSats)', () => {
  expect(fromSats(1 * Math.pow(10, 3))).toBe(0.00001);
});

test('it should return 0.0001 (math - fromSats)', () => {
  expect(fromSats(1 * Math.pow(10, 4))).toBe(0.0001);
});

test('it should return 0.001 (math - fromSats)', () => {
  expect(fromSats(1 * Math.pow(10, 5))).toBe(0.001);
});

test('it should return 0.01 (math - fromSats)', () => {
  expect(fromSats(1 * Math.pow(10, 6))).toBe(0.01);
});

test('it should return 0.1 (math - fromSats)', () => {
  expect(fromSats(1 * Math.pow(10, 7))).toBe(0.1);
});

test('it should return 1 (math - fromSats)', () => {
  expect(fromSats(1 * Math.pow(10, 8))).toBe(1);
});

test('it should return 1 (math - toSats)', () => {
  expect(toSats(Math.pow(10, -8))).toBe(1);
});

test('it should return 10 (math - toSats)', () => {
  expect(toSats(Math.pow(10, -7))).toBe(10);
});

test('it should return 100 (math - toSats)', () => {
  expect(toSats(Math.pow(10, -6))).toBe(100);
});

test('it should return 1000 (math - toSats)', () => {
  expect(toSats(Math.pow(10, -5))).toBe(1000);
});

test('it should return 10000 (math - toSats)', () => {
  expect(toSats(Math.pow(10, -4))).toBe(10000);
});

test('it should return 100000 (math - toSats)', () => {
  expect(toSats(Math.pow(10, -3))).toBe(100000);
});

test('it should return 1000000 (math - toSats)', () => {
  expect(toSats(Math.pow(10, -2))).toBe(1000000);
});

test('it should return 10000000 (math - toSats)', () => {
  expect(toSats(Math.pow(10, -1))).toBe(10000000);
});

test('it should return 100000000 (math - toSats)', () => {
  expect(toSats(1)).toBe(100000000);
});

test('it should return 1000000000 (math - toSats)', () => {
  expect(toSats(Math.pow(10, 1))).toBe(1000000000);
});

test('it should return 10000000000 (math - toSats)', () => {
  expect(toSats(Math.pow(10, 2))).toBe(10000000000);
});

test('it should return 100000000000 (math - toSats)', () => {
  expect(toSats(Math.pow(10, 3))).toBe(100000000000);
});

test('it should return 1000000000000 (math - toSats)', () => {
  expect(toSats(Math.pow(10, 4))).toBe(1000000000000);
});

test('it should return 10000000000000 (math - toSats)', () => {
  expect(toSats(Math.pow(10, 5))).toBe(10000000000000);
});

test('it should return 100000000000000 (math - toSats)', () => {
  expect(toSats(Math.pow(10, 6))).toBe(100000000000000);
});

test('it should return 1000000000000000 (math - toSats)', () => {
  expect(toSats(Math.pow(10, 7))).toBe(1000000000000000);
});

test('it should return 10000000000000000 (math - toSats)', () => {
  expect(toSats(Math.pow(10, 8))).toBe(10000000000000000);
});