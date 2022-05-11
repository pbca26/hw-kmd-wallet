import asyncForEach from '../lib/async';

const remoteCall = a => {
  return new Promise((resolve, reject) => {
    resolve(a + 1);
  });
};

const fn = async a => {
  let res = 0;

  await asyncForEach(a, async (item, index) => {
    res += await remoteCall(item);
  });

  return res;
};

test('it should run async series on array of elements and return 9', async () => {
  expect(await fn([1, 2, 3])).toBe(9);
});