import React from 'react';
import {sortTransactions} from './lib/sort';
import TransactionViewModal from './TransactionViewModal';
import {
  isElectron,
  shell,
} from './Electron';

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

  console.warn('activeAccount activeAccount', activeAccount);
  
  if (activeAccount === null) {
    for (let i = 0; i < accounts.length; i++) {
      console.warn(accounts[i]);
      for (let a = 0; a < accounts[i].history.historyParsed.length; a++) {
        const {
          type,
          date,
          amount,
          txid,
          confirmations,
          timestamp,
        } = accounts[i].history.historyParsed[a];

        lastOperations.push({
          type,
          date,
          amount,
          txid,
          confirmations,
          timestamp,
          accountIndex: i,
        });
      }
    }
  } else {
    console.warn('accounts[activeAccount].history.historyParsed', accounts[activeAccount].history.historyParsed);
    lastOperations = lastOperations.concat(accounts[activeAccount].history.historyParsed);
  }

  lastOperations = sortTransactions(lastOperations, 'timestamp');

  console.warn('lastOperations', lastOperations);

  return lastOperations;
};

class Transactions extends React.Component {
  state = {
    txDetails: null,
  };

  openTransactionDetails(txDetails) {
    this.setState({
      txDetails,
    });
    document.getElementById('transactionDetailsModal').click();
  }

  render() {
    const {accounts, coin, activeAccount} = this.props;

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
                      onClick={() => this.openTransactionDetails(tx)}>
                      <td className="cap--first">
                        <span className="direction">
                          <i className={`fa fa-long-arrow-alt-${tx.type === 'sent' ? 'up' : 'down'}`}></i>
                          {Number(tx.height) === -1 || Number(tx.height) === 0 || Number(tx.confirmations) === 0 ? 'pending' : tx.type}
                        </span>
                        <span className="date">{Number(tx.height) === -1 || Number(tx.height) === 0 ? '' : tx.date === 'pending' ? 'Awaiting confirmations' : tx.date}</span>
                      </td>
                      {activeAccount === null &&
                        <td className="ws--nowrap">
                          {coin} {tx.accountIndex + 1}
                        </td>
                      }
                      <td className={tx.type === 'received' ? 'amount-increase' : 'amount-decrease'}>{tx.type === 'received' ? '+' + tx.amount : '-' + tx.amount}</td>
                      {/*<td>{tx.confirmations}</td>*/}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TransactionViewModal
              coin={coin}
              tx={this.state.txDetails}
              />
          </div>
        }
      </React.Fragment>
    );
  }
};

export default Transactions;
