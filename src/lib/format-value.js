// ref: https://github.com/pbca26/komodolib-js/blob/interim/src/utils.js#L75
const formatValue = value => {
  if (value.toString().indexOf('.') === -1) {
    return value;
  }
  // ref: https://stackoverflow.com/questions/3612744/remove-insignificant-trailing-zeros-from-a-number
  const c = Math.pow(10, 8); // 8 decimal places
  const newVal = Math.trunc(value * c) / c;
  const str = newVal.toString();
  const splitNum = str.split('.');

  if (Number(splitNum[0]) !== 0) {
    return Number(newVal.toFixed(4));
  }
  return Number(newVal);
};

export default formatValue;