import {
  checkTimestamp,
  secondsElapsedToString,
  secondsToString,
} from '../lib/time';

const timeExample = 1519344000000; // 02/23/2018 @ 12:00am (UTC)
const timeExample2 = 1519344060000; // 02/23/2018 @ 12:01am (UTC)

test('it should return 0 (time - checkTimestamp)', () => {
  expect(checkTimestamp(timeExample, timeExample / 1000)).toBe(0);
});

test('it should return 60 (time - checkTimestamp 60s)', () => {
  expect(checkTimestamp(timeExample, timeExample2 / 1000)).toBe(60);
});

test('it should return 23 Feb 2018 00:00 (time - secondsToString)', () => {
  expect(secondsToString(timeExample / 1000)).toBe('23 Feb 2018 03:00');
});

test('it should return 23 Feb 2018 00:00:0 (time - secondsToString)', () => {
  expect(secondsToString(Math.floor(timeExample / 1000), false, true)).toBe('23 Feb 2018 03:00:0');
});

test('it should return 1 second (time - secondsElapsedToString - 1s (singular))', () => {
  expect(secondsElapsedToString(Date.now() - 1000)).toBe('1 second');
});

test('it should return 10 seconds (time - secondsElapsedToString - 10s (plural))', () => {
  expect(secondsElapsedToString(Date.now() - 10000)).toBe('10 seconds');
});

test('it should return 1 minute (time - secondsElapsedToString - 1 min (singular))', () => {
  expect(secondsElapsedToString(Date.now() - 60 * 1000)).toBe('1 minute');
});

test('it should return 2 minutes (time - secondsElapsedToString - 2 min (plural))', () => {
  expect(secondsElapsedToString(Date.now() - 2 * 60 * 1000)).toBe('2 minutes');
});

test('it should return 1 hour (time - secondsElapsedToString - 1h (singular))', () => {
  expect(secondsElapsedToString(Date.now() - 60 * 60 * 1000)).toBe('1 hour');
});

test('it should return 2 hours (time - secondsElapsedToString - 2h (plural))', () => {
  expect(secondsElapsedToString(Date.now() - 2 * 60 * 60 * 1000)).toBe('2 hours');
});

test('it should return 1 day (time - secondsElapsedToString - 1d (singular))', () => {
  expect(secondsElapsedToString(Date.now() - 24 * 60 * 60 * 1000)).toBe('1 day');
});

test('it should return 2 days (time - secondsElapsedToString - 2d (plural))', () => {
  expect(secondsElapsedToString(Date.now() - 48 * 60 * 60 * 1000)).toBe('2 days');
});

test('it should return 1 week (time - secondsElapsedToString - 1w (singular))', () => {
  expect(secondsElapsedToString(Date.now() - 7 * 24 * 60 * 60 * 1000)).toBe('1 week');
});

test('it should return 2 weeks (time - secondsElapsedToString - 2w (plural))', () => {
  expect(secondsElapsedToString(Date.now() - 14 * 24 * 60 * 60 * 1000)).toBe('2 weeks');
});

test('it should return 1 month (time - secondsElapsedToString - 1m (singular))', () => {
  expect(secondsElapsedToString(Date.now() - 30 * 24 * 60 * 60 * 1000)).toBe('1 month');
});

test('it should return 2 months (time - secondsElapsedToString - 2m (plural))', () => {
  expect(secondsElapsedToString(Date.now() - 60 * 24 * 60 * 60 * 1000)).toBe('2 months');
});

test('it should return 1 year (time - secondsElapsedToString - 1y (singular))', () => {
  expect(secondsElapsedToString(Date.now() - 365 * 24 * 60 * 60 * 1000)).toBe('1 year');
});

test('it should return 2 years (time - secondsElapsedToString - 2y (plural))', () => {
  expect(secondsElapsedToString(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000)).toBe('2 years');
});

test('it should return (time - secondsElapsedToString - 1y 1m 1w 1d 1h 1m 1s', () => {
  const year = 365 * 24 * 60 * 60;
  const month = 30 * 24 * 60 * 60;
  const week = 7 * 24 * 60 * 60;
  const day = 24 * 60 * 60;
  const hr = 60 * 60;
  const min = 60;
  const sec = 1;

  expect(secondsElapsedToString(Date.now() - (year + month + week + day + hr + min + sec) * 1000)).toBe('1 year 1 month 1 week 1 day 1 hour 1 minute 1 second');
});

test('it should return 2 years (time - secondsElapsedToString - 2y (plural) value in seconds)', () => {
  expect(secondsElapsedToString(2 * 365 * 24 * 60 * 60, true)).toBe('2 years');
});