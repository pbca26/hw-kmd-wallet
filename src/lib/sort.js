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

module.exports = sortTransactions;