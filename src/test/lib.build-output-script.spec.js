// ref: https://github.com/lukechilds/build-output-script/blob/master/test/unit.js

import buildOutputScript from '../lib/build-output-script';

test('Single address and value input returns valid output script', () => {
	const outputScipt = buildOutputScript([{address: '1LukeQU5jwebXbMLDVydeH4vFSobRV9rkj', value: 100000000}]);
	const expectedOutputScript = '0100e1f505000000001976a914da6473ed373e08f46dd8003fca7ba72fbe9c555e88ac';

  expect(outputScipt).toBe(expectedOutputScript);
});

test('Multiple address and value inputs returns valid output script', () => {
	const outputScipt = buildOutputScript([
		{address: '1LukeQU5jwebXbMLDVydeH4vFSobRV9rkj', value: 100000000},
		{address: '1BitcoinEaterAddressDontSendf59kuE', value: 100000000}
	]);
	const expectedOutputScript = '0200e1f505000000001976a914da6473ed373e08f46dd8003fca7ba72fbe9c555e88ac00e1f505000000001976a914759d6677091e973b9e9d99f19c68fbf43e3f05f988ac';

  expect(outputScipt).toBe(expectedOutputScript);
});

test('Altcoin P2PKH addresses with a different pubkey hash prefix returns valid ouput script', () => {
	const bitcoinOutputScipt = buildOutputScript([{address: '1LukeQU5jwebXbMLDVydeH4vFSobRV9rkj', value: 100000000}]);
	const litecoinOutputScipt = buildOutputScript([{address: 'Lf8hucmupbtenQ3VPdxvvJ8gTfAsaon2gf', value: 100000000}]);
	const expectedOutputScript = '0100e1f505000000001976a914da6473ed373e08f46dd8003fca7ba72fbe9c555e88ac';

  expect(bitcoinOutputScipt).toBe(litecoinOutputScipt);
  expect(bitcoinOutputScipt).toBe(expectedOutputScript);
});

test('Unsafe integer value throws error', () => {
	const MAX_SAFE_INTEGER = 9007199254740991;
  const outputScipt = buildOutputScript([{address: '1LukeQU5jwebXbMLDVydeH4vFSobRV9rkj', value: MAX_SAFE_INTEGER}]);
  const expectedOutputScript = '01ffffffffffff1f001976a914da6473ed373e08f46dd8003fca7ba72fbe9c555e88ac';
  
  expect(outputScipt).toBe(expectedOutputScript);
  expect(() => buildOutputScript([{address: '1LukeQU5jwebXbMLDVydeH4vFSobRV9rkj', value: (MAX_SAFE_INTEGER + 1)}])).toThrow();
});

test('Not passing an array throws error', () => {
  expect(() => buildOutputScript()).toThrow();
});

test('Passing an empty array throws error', () => {
  expect(() => buildOutputScript([])).toThrow();
});