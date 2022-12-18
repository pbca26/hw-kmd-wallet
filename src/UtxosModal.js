import React, {useState} from 'react';
import Modal from './Modal';
import getKomodoRewards from './lib/get-komodo-rewards';
import humanReadableSatoshis from './lib/human-readable-satoshis';
import humanRewardEndDate from './lib/human-reward-end-date';
import blockchain, {blockchainAPI} from './lib/blockchain';
import Boolean from './Boolean';
import './UtxosModal.scss';
import {t} from './Translate';

// TODO: display warning sign if one or several utxos are not accruing rewards

const headings = [
  t('utxo_modal_addres'),
  t('utxo_modal_value'),
  t('utxo_modal_locktime'),
  t('utxo_modal_rewards'),
  t('utxo_modal_rewards_stop')
];

const UtxosModal = props => {
  const initialState = {
    isClosed: true,
    tiptime: 0,
  };
  const [state, setState] = useState(initialState);

  const close = () => {
    setState(prevState => ({
      ...prevState,
      isClosed: true
    }));
  }

  const open = async() => {
    setState(prevState => ({
      ...prevState,
      isClosed: false
    }));

    const tiptime = await blockchain[blockchainAPI].getTipTime();
    setState(prevState => ({
      ...prevState,
      isClosed: false,
      tiptime,
    }));
  }

  const render = () => {
    const {utxos} = props;
    const {tiptime, isClosed} = state;

    return (
      <React.Fragment>
        <button
          className="button del-btn check-utxos-btn"
          onClick={() => open()}>
          <i className="fa fa-wrench"></i>
        </button>
        <Modal
          title={t('utxo_modal_check_kmd_utxo')}
          show={isClosed === false}
          handleClose={() => close()}
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

  return render();
}

export default UtxosModal;