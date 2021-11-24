import getAddress from '../lib/get-address';

test('it should derive KMD public address from pubkey', () => {
  expect(getAddress(Buffer.from('03f1439b4d4c30ceba89947ba2753a9b668079e6110a7821e9d2f517b8a9fef5e8', 'hex'))).toBe('RSF8yaZ6wVWXANPqEaRL7zpq9YBnntBgnj');
});