import humanReadableSatoshis from '../lib/human-readable-satoshis';

test('it should format satoshis to bitcoin', () => {
  expect(humanReadableSatoshis(1)).toBe('0.00000001');
  expect(humanReadableSatoshis(10)).toBe('0.0000001');
  expect(humanReadableSatoshis(100)).toBe('0.000001');
  expect(humanReadableSatoshis(1000)).toBe('0.00001');
  expect(humanReadableSatoshis(10000)).toBe('0.0001');
  expect(humanReadableSatoshis(100000)).toBe('0.001');
  expect(humanReadableSatoshis(1000000)).toBe('0.01');
  expect(humanReadableSatoshis(10000000)).toBe('0.1');
  expect(humanReadableSatoshis(100000000)).toBe('1');
});