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
      </tbody>
    </table>
  );
};

export default Transactions;
