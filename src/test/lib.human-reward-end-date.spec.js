import humanRewardEndDate from '../lib/human-reward-end-date';

test('it should return in about 1 month', () => {
  const data = {
    locktime: Date.now() / 1000,
    height: 2479656,
  };
  expect(humanRewardEndDate(data)).toBe('in about 1 month');
});

test('it should return less than a minute ago', () => {
  const date = new Date();
  date.setDate(date.getDate() - 31);

  const data = {
    locktime: date.getTime() / 1000,
    height: 2479656,
  };
  expect(humanRewardEndDate(data)).toBe('less than a minute ago');
});

test('it should return about 2 months ago', () => {
  const date = new Date();
  date.setDate(date.getDate() - 90);

  const data = {
    locktime: date.getTime() / 1000,
    height: 2479656,
  };
  expect(humanRewardEndDate(data)).toBe('about 2 months ago');
});

test('it should return in 2 months', () => {
  const date = new Date();
  date.setDate(date.getDate() + 31);

  const data = {
    locktime: date.getTime() / 1000,
    height: 2479656,
  };
  expect(humanRewardEndDate(data)).toBe('in 2 months');
});

test('it should return in 18 days', () => {
  const date = new Date();
  date.setDate(date.getDate() - 13);

  const data = {
    locktime: date.getTime() / 1000,
    height: 2479656,
  };
  expect(humanRewardEndDate(data)).toBe('in 18 days');
});

test('it should return 12 days ago', () => {
  const date = new Date();
  date.setDate(date.getDate() - 43);

  const data = {
    locktime: date.getTime() / 1000,
    height: 2479656,
  };
  expect(humanRewardEndDate(data)).toBe('12 days ago');
});