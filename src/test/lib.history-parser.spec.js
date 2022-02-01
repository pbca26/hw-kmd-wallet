import parsehistory from '../lib/history-parser';
import fixture from './fixtures/lib.history-parser';

test('it should return a partially decoded received KMD transaction with target address', () => {
  let redactedTransaction = JSON.parse(JSON.stringify(fixture.raw.received));
  delete redactedTransaction.confirmations;
  delete redactedTransaction.timestamp;
  delete redactedTransaction.blocktime;
  delete redactedTransaction.height;

  expect(parsehistory([redactedTransaction], ['RDbGxL8QYdEp8sMULaVZS2E6XThcTKT9Jd'])).toEqual(fixture.decoded.partial);
});

test('it should return a fully decoded received KMD transaction with target address', () => {
  expect(parsehistory([fixture.raw.received], ['RDbGxL8QYdEp8sMULaVZS2E6XThcTKT9Jd'])).toEqual(fixture.decoded.received);
});

test('it should return a fully decoded received KMD transaction w/o target address', () => {
  expect(parsehistory([fixture.raw.received], [])).toEqual(fixture.decoded.receivedNoAddress);
});

test('it should return a fully decoded sent KMD transaction with target address', () => {
  expect(parsehistory([fixture.raw.sent], ['RDbGxL8QYdEp8sMULaVZS2E6XThcTKT9Jd'])).toEqual(fixture.decoded.sent);
});

test('it should return a fully decoded KMD transaction history with target address sorted by height ASC', () => {
  expect(parsehistory([fixture.raw.received, fixture.raw.sent], ['RDbGxL8QYdEp8sMULaVZS2E6XThcTKT9Jd'])).toEqual(fixture.decoded.sortedASC);
});

test('it should return a fully decoded KMD transaction history with target address sorted by height ASC2', () => {
  expect(parsehistory([fixture.raw.sent, fixture.raw.received], ['RDbGxL8QYdEp8sMULaVZS2E6XThcTKT9Jd'])).toEqual(fixture.decoded.sortedASC);
});

test('it should truncate transaction history to last 10 items', () => {
  let txs = [];

  for (let i = 0; i < 15; i++) {
    txs.push(i % 2 === 0 ? fixture.raw.sent : fixture.raw.received);
  }

  expect(parsehistory(txs, ['RDbGxL8QYdEp8sMULaVZS2E6XThcTKT9Jd']).length).toEqual(10);
});