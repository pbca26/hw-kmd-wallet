import React from 'react';
import Modal from './Modal';
import getKomodoRewards from './lib/get-komodo-rewards';
import humanReadableSatoshis from './lib/human-readable-satoshis';
import humanRewardEndDate from './lib/human-reward-end-date';
import blockchain, {blockchainAPI} from './lib/blockchain';
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
    isClosed: true,
    tiptime: 0,
  };

  close() {
    this.setState({
      isClosed: true
    });
  }

  open = async() => {
    this.setState({
      isClosed: false
    });

    const tiptime = await blockchain[blockchainAPI].getTipTime();
    this.setState({
      isClosed: false,
      tiptime,
    });
  }

  render() {
    const {utxos} = this.props;
    const {tiptime} = this.state;

    return (
      <React.Fragment>
        <button
          className="button del-btn check-utxos-btn"
          onClick={() => this.open()}>
          <i className="fa fa-wrench"></i>
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