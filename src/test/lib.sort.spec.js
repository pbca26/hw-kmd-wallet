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
  expect(sortTransactions(JSON.parse(JSON.stringify(numbersArrayAsc)), 'num')).toEqual(JSON.parse(JSON.stringify(numbersArrayDesc)));
});

test('it should keep array in DESC order (sort - sortTransactions)', () => {
  expect(sortTransactions(JSON.parse(JSON.stringify(numbersArrayDesc)), 'num')).toEqual(JSON.parse(JSON.stringify(numbersArrayDesc)));
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
  expect(sortTransactions(JSON.parse(JSON.stringify(textArrayAsc)), 'text')).toEqual(JSON.parse(JSON.stringify(textArrayDesc)));
});

test('it should keep array in DESC order (sort - sortTransactions)', () => {
  expect(sortTransactions(JSON.parse(JSON.stringify(textArrayDesc)), 'num')).toEqual(JSON.parse(JSON.stringify(textArrayDesc)));
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
  expect(sortTransactions(JSON.parse(JSON.stringify(transactionsAsc)))).toEqual(JSON.parse(JSON.stringify(transactionsDesc)));
});

test('it should keep array in DESC order (sort - sortTransactions)', () => {
  expect(sortTransactions(JSON.parse(JSON.stringify(transactionsDesc)))).toEqual(JSON.parse(JSON.stringify(transactionsDesc)));
});