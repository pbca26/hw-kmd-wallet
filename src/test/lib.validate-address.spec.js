import checkPublicAddress from '../lib/validate-address';

test('it should validate a proper KMD public address', () => {
  expect(checkPublicAddress('RSF8yaZ6wVWXANPqEaRL7zpq9YBnntBgnj')).toBe(true);
});

test('it should invalidate a wrong KMD public address', () => {
  expect(checkPublicAddress('1RSF8yaZ6wVWXANPqEaRL7zpq9YBnntBgnj')).toBe(false);
});

test('it should invalidate a BTC public address', () => {
  expect(checkPublicAddress('15K5spF7woSF4rzGsQWSLVttmCF1nGGDXe')).toBe(false);
});