// ref: https://github.com/pbca26/agama-wallet-lib/blob/master/src/utils.js#L1
const sortTransactions = (transactions, sortBy='height') => {
  return transactions.sort((b, a) => {
    if (a[sortBy] < b[sortBy] &&
        a[sortBy] &&
        b[sortBy]) {
      return -1;
    }

    if (a[sortBy] > b[sortBy] &&
        a[sortBy] &&
        b[sortBy]) {
      return 1;
    }

    if (!a[sortBy] &&
        b[sortBy]) {
      return 1;
    }

    if (!b[sortBy] &&
        a[sortBy]) {
      return -1;
    }

    return 0;
  });
}

// ref: https://github.com/pbca26/agama-wallet-lib/blob/master/src/utils.js#L152
const sortObject = o => Object.keys(o).sort().reduce((r, k) => (r[k] = o[k], r), {});

module.exports = {
  sortTransactions,
  sortObject
};