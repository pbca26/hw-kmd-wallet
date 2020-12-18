import React from 'react';
import getKomodoRewards from './lib/get-komodo-rewards';
import hw from './lib/hw';
import accountDiscovery, {clearPubkeysCache} from './lib/account-discovery';
import blockchain, {setExplorerUrl, getInfo} from './lib/blockchain';
import updateActionState from './lib/update-action-state';
import {TX_FEE, VENDOR} from './constants';
import ActionListModal from './ActionListModal';
import asyncForEach from './lib/async';
import humanReadableSatoshis from './lib/human-readable-satoshis';

class CheckAllBalancesButton extends React.Component {
  state = this.initialState;
  
  get initialState() {
    return {
      isCheckingRewards: false,
      error: false,
      actions: {
        connect: {
          icon: 'fab fa-usb',
          description: this.props.vendor === 'ledger' ? <div>Connect and unlock your Ledger, then open the Komodo app on your device.</div> : <div>Connect and unlock your Trezor.</div>,
          state: null
        },
        approve: {
          icon: 'fas fa-microchip',
          description: <div>Approve all public key export requests on your device. <strong>There will be multiple requests</strong>.</div>,
          state: null
        },
      }
    };
  }

  resetState = () => {
    this.setState(this.initialState);
  }

  calculateRewardData = ({accounts, tiptime}) => accounts.map(account => {
    account.balance = account.utxos.reduce((balance, utxo) => balance + utxo.satoshis, 0);
    account.rewards = account.utxos.reduce((rewards, utxo) => rewards + getKomodoRewards({tiptime, ...utxo}), 0);
    account.claimableAmount = account.rewards - TX_FEE * 2;

    return account;
  });

  render() {
    const {
      isCheckingRewards,
      actions,
      error,
    } = this.state;

    return (
      <React.Fragment>
        <button
          className="button is-primary"
          onClick={this.scanAddresses}>
          {this.props.children}
        </button>
        <ActionListModal
          title={`Scanning Blockchain`}
          isCloseable={true}
          actions={actions}
          error={error}
          handleClose={this.resetState}
          show={isCheckingRewards}>
          <p>
            Exporting public keys from your {VENDOR[this.props.vendor]} device, scanning the blockchain for funds, and calculating any claimable rewards. Please approve any public key export requests on your device.
          </p>
        </ActionListModal>
      </React.Fragment>
    );
  }
}

export default CheckAllBalancesButton;
