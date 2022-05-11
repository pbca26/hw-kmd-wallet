import React from 'react';
import hw from './lib/hw';
import {getAccountXpub} from './lib/account-discovery';
import blockchain, {blockchainAPI} from './lib/blockchain';
import updateActionState from './lib/update-action-state';
import {VENDOR} from './constants';
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

    const {vendor, accounts, addAccount};
    let currentAction;
    try {
      currentAction = 'connect';
      updateActionState(this, currentAction, 'loading');
      const hwIsAvailable = await hw[vendor].isAvailable();
      if (!hwIsAvailable) {
        throw new Error(`${VENDOR[vendor]} device is unavailable!`);
      }
      updateActionState(this, currentAction, true);

      currentAction = 'approve';
      updateActionState(this, currentAction, 'loading');
      writeLog('add acc', accounts.length);

      const xpub = await getAccountXpub(accounts.length, vendor);
      writeLog('xpub', xpub);
      updateActionState(this, currentAction, true);
      addAccount(accounts.length, xpub);

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
    const {
      activeAccount,
      coin,
      vendor,
    } = this.props;

    return (
      <React.Fragment>
        <span
          className={`coin-add-account-modal-trigger ${activeAccount !== null ? ' single' : ''}`}
          onClick={this.scanAddresses}>
          <i className="fa fa-plus"></i>
        </span>
        <ActionListModal
          title={`Add ${coin} account`}
          actions={actions}
          error={error}
          handleClose={this.resetState}
          show={isCheckingRewards}
          className="Scan-balances-modal">
          <p>
            Exporting a public key from your {VENDOR[vendor]} device. Please approve the public key export request on your device.
          </p>
        </ActionListModal>
      </React.Fragment>
    );
  }
}

export default AddAccount;
