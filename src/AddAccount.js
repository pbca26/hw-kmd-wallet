import React, {useState} from 'react';
import hw from './lib/hw';
import {getAccountXpub} from './lib/account-discovery';
import blockchain, {blockchainAPI} from './lib/blockchain';
import updateActionState from './lib/update-action-state';
import {VENDOR} from './constants';
import ActionListModal from './ActionListModal';
import {writeLog} from './Debug';

const AddAccount = props => {
  const initialState = {
    isCheckingRewards: false,
    error: false,
    actions: {
      connect: {
        icon: 'fab fa-usb',
        description: props.vendor === 'ledger' ? <div>Connect and unlock your Ledger, then open the Komodo app on your device.</div> : <div>Connect and unlock your Trezor.</div>,
        state: null
      },
      approve: {
        icon: 'fas fa-microchip',
        description: <div>Approve all public key export requests on your device. <strong>There will be multiple requests</strong>.</div>,
        state: null
      }
    }
  };
  const [state, setState] = useState(initialState);

  const resetState = () => setState(initialState);

  scanAddresses = async () => {
    setState(prevState => ({
      ...prevState,
      ...initialState,
      isCheckingRewards: true,
    }));

    const {vendor, accounts, addAccount};
    let currentAction;
    try {
      currentAction = 'connect';
      updateActionState({setState}, currentAction, 'loading');
      const hwIsAvailable = await hw[vendor].isAvailable();
      if (!hwIsAvailable) {
        throw new Error(`${VENDOR[vendor]} device is unavailable!`);
      }
      updateActionState({setState}, currentAction, true);

      currentAction = 'approve';
      updateActionState({setState}, currentAction, 'loading');
      writeLog('add acc', accounts.length);

      const xpub = await getAccountXpub(accounts.length, vendor);
      writeLog('xpub', xpub);
      updateActionState({setState}, currentAction, true);
      addAccount(accounts.length, xpub);

      setState(prevState => ({
        ...prevState,
        ...initialState
      }));
    } catch (error) {
      writeLog(error);
      updateActionState({setState}, currentAction, false);
      setState(prevState => ({
        ...prevState,
        error: error.message
      }));
    }
  };

  const render = () => {
    const {
      isCheckingRewards,
      actions,
      error,
    } = state;
    const {
      activeAccount,
      coin,
      vendor,
    } = props;

    return (
      <React.Fragment>
        <span
          className={`coin-add-account-modal-trigger ${activeAccount !== null ? ' single' : ''}`}
          onClick={scanAddresses}>
          <i className="fa fa-plus"></i>
        </span>
        <ActionListModal
          title={`Add ${coin} account`}
          actions={actions}
          error={error}
          handleClose={resetState}
          show={isCheckingRewards}
          className="Scan-balances-modal">
          <p>
            Exporting a public key from your {VENDOR[vendor]} device. Please approve the public key export request on your device.
          </p>
        </ActionListModal>
      </React.Fragment>
    );
  }

  return render();
}

export default AddAccount;
