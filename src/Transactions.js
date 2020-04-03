import React from 'react';
import Boolean from './Boolean';
import explorerLink from './lib/explorer-link';

const Transactions = ({transactions, coin}) => {
  const headings = ['Type', 'Amount', 'Confirmations', 'Date', 'Transaction ID'];

  return (
    <table className="table is-striped">
      <thead>
        <tr>
          {headings.map(heading => <th key={heading}>{heading}</th>)}
        </tr>
      </thead>
      <tfoot>
        <tr>
          {headings.map(heading => <th key={heading}>{heading}</th>)}
        </tr>
      </tfoot>
      <tbody>
        {transactions.map(tx => (
          <tr key={tx.txid} className="utxo">
            <td className="cap--first">{Number(tx.height) === -1 || Number(tx.height) === 0 || Number(tx.confirmations) === 0 ? 'pending' : tx.type}</td>
            <td>{tx.amount}</td>
            <td>{tx.confirmations}</td>
            <td className="ws--nowrap">{Number(tx.height) === -1 || Number(tx.height) === 0 ? '' : tx.date}</td>
            <td className="wb--all">
              <a
                target="_blank"
                href={`${explorerLink[coin]}tx/${tx.txid}`}>{tx.txid}</a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default Transactions;
