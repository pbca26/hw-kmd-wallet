import React, {useState} from 'react';
import {sortTransactions} from './lib/sort';
import TransactionViewModal from './TransactionViewModal';
import {writeLog} from './Debug';
import useScrollPosition from './scrollPosHook';

const headings = {
  many: [
    'Direction',
    'Account',
    'Amount',
  ],
  one: [
    'Direction',
    'Amount',
  ],
};

const getTransactionsHistory = (accounts, activeAccount) => {
  let lastOperations = [];

  writeLog('activeAccount activeAccount', activeAccount);
  
  if (activeAccount === null) {
    for (let i = 0; i < accounts.length; i++) {
      writeLog(accounts[i]);

      lastOperations = lastOperations.concat(accounts[i].history.historyParsed.map(item => {
        return {
          type: item.type,
          date: item.date,
          amount: item.amount,
          txid: item.txid,
          confirmations: item.confirmations,
          timestamp: item.timestamp,
          accountIndex: accounts[i].accountIndex,
        };
      }));
    }
  } else {
    writeLog('accounts[activeAccount].history.historyParsed', accounts[activeAccount].history.historyParsed);
    lastOperations = lastOperations.concat(accounts[activeAccount].history.historyParsed);
  }

  lastOperations = sortTransactions(lastOperations, 'timestamp');

  writeLog('lastOperations', lastOperations);

  return lastOperations;
};

const Transactions = props => {
  const scrollPosition = useScrollPosition();
  const initialState = {
    isClosed: true,
    tiptime: 0,
  };
  const [state, setState] = useState(initialState);

  const openTransactionDetails = txDetails => {
    setState(prevState => ({
      ...prevState,
      txDetails,
    }));
    document.getElementById('transactionDetailsModal').click();
  }

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const render = () => {
    const {accounts, coin, activeAccount} = props;

    return (
      <React.Fragment>
        {getTransactionsHistory(accounts, activeAccount).length > 0 &&
          <div className="transactions-block">
            <h4>Operations</h4>
            <div className="accounts">
              <table className="table is-striped">
                <thead>
                  <tr>
                    {headings[activeAccount === null ? 'many' : 'one'].map(heading => <th key={heading}>{heading}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {getTransactionsHistory(accounts, activeAccount).map(tx => (
                    <tr
                      key={tx.txid}
                      className="utxo"
                      onClick={() => openTransactionDetails(tx)}>
                      <td className="cap--first">
                        <span className="direction">
                          <i className={`fa fa-long-arrow-alt-${tx.type === 'sent' ? 'up' : 'down'}`}></i>
                          {Number(tx.height) === -1 || Number(tx.height) === 0 || Number(tx.confirmations) === 0 ? 'pending' : tx.type}
                        </span>
                        <span className="date">
                          {Number(tx.height) === -1 || Number(tx.height) === 0 ? '' : tx.date === 'pending' ? 'Awaiting confirmations' : tx.date}
                        </span>
                      </td>
                      {activeAccount === null &&
                        <td className="ws--nowrap">
                          {coin} {tx.accountIndex + 1}
                        </td>
                      }
                      <td className={tx.type === 'received' || tx.type === 'rewards' ? 'amount-increase' : 'amount-decrease'}>
                        {tx.type === 'received' || tx.type === 'rewards' ? '+' + tx.amount : '-' + tx.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TransactionViewModal
              coin={coin}
              tx={state.txDetails}
              activeAccount={activeAccount} />
            <div
              className={`back-to-top-button ${scrollPosition < 600 ? 'invisible': ''}`}
              onClick={scrollToTop}>
              <i className="fa fa-chevron-up"></i>
            </div>
          </div>
        }
      </React.Fragment>
    );
  }

  return render();
};

export default Transactions;
