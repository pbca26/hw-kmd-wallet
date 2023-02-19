import React, {useState} from 'react';
import hw from './lib/hw';
import {getAccountXpub} from './lib/account-discovery';
import blockchain, {blockchainAPI} from './lib/blockchain';
import updateActionState from './lib/update-action-state';
import {VENDOR} from './constants';
import ActionListModal from './ActionListModal';
import {writeLog} from './Debug';
import Translate, {t} from './Translate';

const AddAccount = props => {
  const initialState = {
    isCheckingRewards: false,
    error: false,
    actions: {
      connect: {
        icon: 'fab fa-usb',
        description: props.vendor === 'ledger' ? <div><Translate name="common_connect_and_unlock_ledger" /></div> : <div><Translate name="common_connect_and_unlock_trezor" /></div>,
        state: null
      },
      approve: {
        icon: 'fas fa-microchip',
        description: <div><Translate name="common_approve_public_key" /> <strong><Translate name="common_multiple_req" /></strong>.</div>,
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
        throw new Error(t('common_error_device', VENDOR[vendor]));
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
            <Translate name="common_exporting_public_key" template={VENDOR[vendor]} />
          </p>
        </ActionListModal>
      </React.Fragment>
    );
  }

  return render();
}

export default AddAccount;
