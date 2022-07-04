import formatValue from '../lib/format-value';

test('it should format integer number', () => {  
  expect(formatValue(1)).toBe(1);
  expect(formatValue(1.0)).toBe(1);
});

test('it should format/truncate float number', () => {  
  expect(formatValue(1.1)).toBe(1.1);
  expect(formatValue(1.2000)).toBe(1.2);
  expect(formatValue(1.123456789)).toBe(1.1235);
});