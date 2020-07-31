import React from 'react';
import Modal from './Modal';
import getKomodoRewards from './lib/get-komodo-rewards';
import humanReadableSatoshis from './lib/human-readable-satoshis';
import humanRewardEndDate from './lib/human-reward-end-date';
import Boolean from './Boolean';
import './UtxosModal.scss';

// TODO: display warning sign if one or several utxos are not accruing rewards

const headings = [
  'Address',
  'Value',
  'Locktime',
  'Rewards',
  'Rewards Stop Accruing'
];

class UtxosModal extends React.Component {
  state = {
    isClosed: true
  };

  close() {
    this.setState({
      isClosed: true
    });
  }

  open() {
    this.setState({
      isClosed: false
    });
  }

  render() {
    const {utxos, tiptime} = this.props;

    return (
      <React.Fragment>
        <button
          className="button is-primary check-utxos-btn"
          onClick={() => this.open()}>
          Check UTXOs
        </button>
        <Modal
          title="Check KMD UTXOs"
          show={this.state.isClosed === false}
          handleClose={() => this.close()}
          isCloseable={true}
          className="Modal-utxos">
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
        </Modal>
      </React.Fragment>
    );
  }
}

export default UtxosModal;