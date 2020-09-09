import React from 'react';
import getKomodoRewards from './lib/get-komodo-rewards';
import humanReadableSatoshis from './lib/human-readable-satoshis';
import humanRewardEndDate from './lib/human-reward-end-date';
import Boolean from './Boolean';

const Utxos = ({utxos, tiptime}) => {
  const headings = [
    'Address',
    'Value',
    'Locktime',
    'Rewards',
    'Rewards Stop Accruing'
  ];

  return (
    <div className="table-scroll-wrapper">
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
          {utxos.map(utxo => (
            <tr
              key={utxo.id}
              className="utxo">
              <th>{utxo.address}</th>
              <td>{humanReadableSatoshis(utxo.satoshis)} KMD</td>
              <td className="text-center"><Boolean value={utxo.locktime} /></td>
              <td>{humanReadableSatoshis(getKomodoRewards({tiptime, ...utxo}))} KMD</td>
              <td>{humanRewardEndDate(utxo)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Utxos;
