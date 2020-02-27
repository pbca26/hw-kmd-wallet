import React from 'react';
import Boolean from './Boolean';

const Transactions = ({transactions}) => {
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
            <td>{tx.type}</td>
            <td>{tx.amount}</td>
            <td>{tx.confirmations}</td>
            <td>{tx.date}</td>
            <td>{tx.txid}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default Transactions;
