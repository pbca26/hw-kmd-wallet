import getRewardEndDate from '../lib/get-reward-end-date';

test('it should return a timestamp 1 month in advance', () => {
  expect(getRewardEndDate({locktime: 1626275885, height: 2479656})).toBe(1628954285000);
});

test('it should return a timestamp 17 days in advance', () => {
  expect(getRewardEndDate({locktime: 1625141885, height: 2479656})).toBe(1627820285000);
});

test('it should return a timestamp Jul 02, 2021', () => {
  expect(getRewardEndDate({locktime: 1622549885, height: 2479656})).toBe(1625228285000);
});