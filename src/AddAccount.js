import React from 'react';
import hw from './lib/hw';
import accountDiscovery, {getAccountXpub} from './lib/account-discovery';
import blockchain, {blockchainAPI} from './lib/blockchain';
import updateActionState from './lib/update-action-state';
import {TX_FEE, VENDOR} from './constants';
import ActionListModal from './ActionListModal';
import {writeLog} from './Debug';

class AddAccount extends React.Component {
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
        }
      }
    };
  }

  resetState = () => this.setState(this.initialState);

  scanAddresses = async () => {
    this.setState({
      ...this.initialState,
      isCheckingRewards: true,
    });

    let currentAction;
    try {
      currentAction = 'connect';
      updateActionState(this, currentAction, 'loading');
      const hwIsAvailable = await hw[this.props.vendor].isAvailable();
      if (!hwIsAvailable) {
        throw new Error(`${VENDOR[this.props.vendor]} device is unavailable!`);
      }
      updateActionState(this, currentAction, true);

      currentAction = 'approve';
      updateActionState(this, currentAction, 'loading');

      writeLog('add acc', this.props.accounts.length);

      const xpub = await getAccountXpub(this.props.accounts.length, this.props.vendor);

      writeLog('xpub', xpub);

      updateActionState(this, currentAction, true);

      this.props.addAccount(this.props.accounts.length, xpub);

      this.setState({...this.initialState});
    } catch (error) {
      writeLog(error);
      updateActionState(this, currentAction, false);
      this.setState({error: error.message});
    }
  };

  render() {
    const {
      isCheckingRewards,
      actions,
      error,
    } = this.state;

    return (
      <React.Fragment>
        <span
          className={`coin-add-account-modal-trigger ${this.props.activeAccount !== null ? ' single' : ''}`}
          onClick={this.scanAddresses}>
          <i className="fa fa-plus"></i>
        </span>
        <ActionListModal
          title={`Add ${this.props.coin} account`}
          actions={actions}
          error={error}
          handleClose={this.resetState}
          show={isCheckingRewards}
          className="Scan-balances-modal">
          <p>
            Exporting a public key from your {VENDOR[this.props.vendor]} device. Please approve the public key export request on your device.
          </p>
        </ActionListModal>
      </React.Fragment>
    );
  }

}

export default AddAccount;
