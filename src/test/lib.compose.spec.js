import compose from '../lib/compose';

const fn1 = (a) => {
  return a + 1;
};

const fn2 = (a) => {
  return a + 2;
};

const fn3 = (a) => {
  return a + 3;
};

test('it should compose functions and return 7', () => {
  expect(compose(fn1, fn2, fn3)(1)).toBe(7);
});