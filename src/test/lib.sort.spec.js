import {
  sortTransactions,
  sortObject,
} from '../lib/sort';

test('it should sort an object ASC (sort - sortObject)', () => {
  const originalObj = {
    xyz: 'xyz',
    abc: 'abc',
    aab: 'aab',
  };
  const sortedObj = {
    aab: 'aab',
    abc: 'abc',
    xyz: 'xyz',
  };

  expect(sortObject(originalObj)).toEqual(sortedObj);
});

const numbersArrayAsc = [{
  num: 1,
  text: 'one',
}, {
  num: 2,
  text: 'two',
}, {
  num: 3,
  text: 'three',
}];
const numbersArrayDesc = [{
  num: 3,
  text: 'three',
}, {
  num: 2,
  text: 'two',
}, {
  num: 1,
  text: 'one',
}];

test('it should sort array by number field in DESC order (sort - sortTransactions)', () => {
  const data1 = JSON.parse(JSON.stringify(numbersArrayAsc));
  const data2 = JSON.parse(JSON.stringify(numbersArrayDesc));
  expect(sortTransactions(data1, 'num')).toEqual(data2);
});

test('it should keep array in DESC order (sort - sortTransactions)', () => {
  const data1 = JSON.parse(JSON.stringify(numbersArrayDesc));
  const data2 = JSON.parse(JSON.stringify(numbersArrayDesc));
  expect(sortTransactions(data1, 'num')).toEqual(data2);
});

const textArrayAsc = [{
  num: 1,
  text: 'abc',
}, {
  num: 2,
  text: 'abd',
}, {
  num: 3,
  text: 'abe',
}];
const textArrayDesc = [{
  num: 3,
  text: 'abe',
}, {
  num: 2,
  text: 'abd',
}, {
  num: 1,
  text: 'abc',
}];

test('it should sort array by text field in DESC order (sort - sortTransactions)', () => {
  const data1 = JSON.parse(JSON.stringify(textArrayAsc));
  const data2 = JSON.parse(JSON.stringify(textArrayDesc));
  expect(sortTransactions(data1, 'text')).toEqual(data2);
});

test('it should keep array in DESC order (sort - sortTransactions)', () => {
  const data1 = JSON.parse(JSON.stringify(textArrayDesc));
  const data2 = JSON.parse(JSON.stringify(textArrayDesc));
  expect(sortTransactions(data1, 'num')).toEqual(data2);
});

const transactionsAsc = [{
  height: 1,
  confirmations: 1,
  txid: 'test1',
}, {
  height: 2,
  confirmations: 2,
  txid: 'test2',
}, {
  height: 3,
  confirmations: 3,
  txid: 'test3',
}, {
  height: 3,
  confirmations: 3,
  txid: 'test4',
}];
const transactionsDesc = [{
  height: 3,
  confirmations: 3,
  txid: 'test3',
}, {
  height: 3,
  confirmations: 3,
  txid: 'test4',
}, {
  height: 2,
  confirmations: 2,
  txid: 'test2',
}, {
  height: 1,
  confirmations: 1,
  txid: 'test1',
}];

test('it should sort array by default prop (height) in DESC order (sort - sortTransactions)', () => {
  const data1 = JSON.parse(JSON.stringify(transactionsAsc));
  const data2 = JSON.parse(JSON.stringify(transactionsDesc));
  expect(sortTransactions(data1)).toEqual(data2);
});

test('it should keep array in DESC order (sort - sortTransactions)', () => {
  const data1 = JSON.parse(JSON.stringify(transactionsDesc));
  const data2 = JSON.parse(JSON.stringify(transactionsDesc));
  expect(sortTransactions(data1)).toEqual(data2);
});