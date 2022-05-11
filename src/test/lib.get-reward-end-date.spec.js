import getRewardEndDate from '../lib/get-reward-end-date';

test('it should return a timestamp 1 month in advance', () => {
  const data = {
    locktime: 1626275885,
    height: 2479656,
  };
  expect(getRewardEndDate(data)).toBe(1628954285000);
});

test('it should return a timestamp 17 days in advance', () => {
  const data = {
    locktime: 1625141885,
    height: 2479656,
  };
  expect(getRewardEndDate(data)).toBe(1627820285000);
});

test('it should return a timestamp Jul 02, 2021', () => {
  const data = {
    locktime: 1622549885,
    height: 2479656,
  };
  expect(getRewardEndDate(data)).toBe(1625228285000);
});