import React, {useState} from 'react';
import hw from './lib/hw';
import updateActionState from './lib/update-action-state';
import {
  FAUCET_URL,
  VENDOR,
  COIN_DERIVATION_PATH,
} from './constants';
import ActionListModal from './ActionListModal';
import getAddress from './lib/get-address';
import {getAccountNode} from './lib/account-discovery';
import {
  isElectron,
  shell,
} from './Electron';
import './ReceiveCoinModal.scss';
import {writeLog} from './Debug';
import copyToClipboard from './lib/copy-to-clipboard';
import QRGenModal from './QRGenModal';
import Dropdown from './Dropdown';
import Translate, {t} from './Translate';

const ReceiveCoinButton = props => {
  const initialState = {
    isExtractingNewAddress: false,
    error: false,
    success: false,
    accountIndex: 0,
    isClosed: true,
    actions: {
      connect: {
        icon: 'fab fa-usb',
        description: props.vendor === 'ledger' ? <div><Translate name="common_connect_and_unlock_ledger" /></div> : <div><Translate name="common_connect_and_unlock_trezor" /></div>,
        state: null
      },
      confirmAddress: {
        icon: 'fas fa-microchip',
        description: <div><Translate name="common_connect_and_unlock_ledger" /></div>,
        state: null
      }
    }
  };
  const [state, setState] = useState(initialState);

  const triggerCopyToClipboard = text => copyToClipboard(text);

  const open = () => {
    setState(prevState => ({
      ...prevState,
      isClosed: false
    }));
  }

  const updateAccountIndex = e => {
    setState(prevState => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  }

  const resetState = () => setState(initialState);

  const getUnusedAddressIndex = () => props.accounts[state.accountIndex].addresses.filter(address => !address.isChange).length;
  
  const getUnusedAddress = () => getAddress(getAccountNode(props.accounts[state.accountIndex].xpub).externalNode.derive(getUnusedAddressIndex()).publicKey);

  const getNewAddress = async () => {
    const {coin, vendor} = props;

    setState(prevState => ({
      ...prevState,
      error: false,
      success: false,
      actions: {
        connect: {
          icon: 'fab fa-usb',
          description: props.vendor === 'ledger' ? <div><Translate name="common_connect_and_unlock_ledger" /></div> : <div><Translate name="common_connect_and_unlock_trezor" /></div>,
          state: null
        },
        confirmAddress: {
          icon: 'fas fa-microchip',
          description: <div><Translate name="common_connect_and_unlock_ledger" /></div>,
          state: null
        }
      },
      isExtractingNewAddress: true,
    }));

    let currentAction;
    try {
      currentAction = 'connect';
      updateActionState({setState}, currentAction, 'loading');
      const hwIsAvailable = await hw[vendor].isAvailable();
      if (!hwIsAvailable) {
        throw new Error(t('common_error_device', VENDOR[vendor]));
      }
      updateActionState({setState}, currentAction, true);

      currentAction = 'confirmAddress';
      updateActionState({setState}, currentAction, 'loading');

      const accountIndex = state.accountIndex;

      const unusedAddress = getUnusedAddress();
      const derivationPath = `${COIN_DERIVATION_PATH}/${accountIndex}'/0/${getUnusedAddressIndex()}`;
      const verify = true;
      const hwUnusedAddress = await hw[vendor].getAddress(derivationPath, verify);
      if (hwUnusedAddress !== unusedAddress) {
        throw new Error(`${t('common_error_address', VENDOR[vendor])} ${t('common_error_address_match', hwUnusedAddress)} "${unusedAddress}"`);
      }
      updateActionState({setState}, currentAction, true);

      setState({
        isExtractingNewAddress: false,
        success: 
          <React.Fragment>
            <span className="receive-coin-modal-success">
              <Translate name="receive_this_is" /> <strong>{coin} {accountIndex + 1}</strong> <Translate name="receive_deposit_address" />
              <span className="new-address">
                <strong>{unusedAddress}</strong>
                <QRGenModal
                  coin={coin}
                  address={unusedAddress}/>
                <button
                  className="button is-light copy-btn"
                  onClick={() => triggerCopyToClipboard(unusedAddress)}>
                  <i className="fa fa-copy"></i> <span className="copy-btn-text"><Translate name="common_copy" /></span>
                </button>
              </span>
            {FAUCET_URL[coin] &&
              <span className="receive-coin-modal-faucet">
                <strong>
                  {!isElectron &&
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      href={`${FAUCET_URL[coin]}${unusedAddress}`}><Translate name="receive_faucet" /></a>
                  }
                  {isElectron &&
                    <a
                      href="!#"
                      onClick={() => shell.openExternal(`${FAUCET_URL[coin]}${unusedAddress}`)}><Translate name="receive_faucet" /></a>
                  }
                </strong>
              </span>
            }
            </span>
          </React.Fragment>
      });
    } catch (error) {
      writeLog(error);
      updateActionState({setState}, currentAction, false);
      setState(prevState => ({
        ...prevState,
        error: error.message,
        isExtractingNewAddress: false,
      }));
    }
  };

  const render = () => {
    const {
      isExtractingNewAddress,
      actions,
      error,
      success,
    } = state;
    const {coin, vendor, accounts, sidebarSize} = props;
    const dropdownAccountItems = accounts.map((account, index) => (
      {
        value: index,
        label: `${coin} ${index + 1}`,
      }
    ));

    writeLog(props);

    return (
      <React.Fragment>
        <li onClick={open}>
          <i className="fa fa-paper-plane plane-icon-invert"></i>
          {sidebarSize === 'full' &&
            <span className="sidebar-item-title"><Translate name="receive_receive" /></span>
          }
        </li>
        <ActionListModal
          title="Receive coin"
          isCloseable={!isExtractingNewAddress}
          actions={actions}
          error={error}
          success={success}
          handleClose={resetState}
          show={state.isClosed === false}
          display={isExtractingNewAddress}
          className="Receive-modal">
          {!isExtractingNewAddress && !success &&
            <React.Fragment>
              <p>
                <Translate name="receive_faucet" />
              </p>
              <div className={`receive-account-selector-block${error ? ' receive-coin-modal-padding-bottom' : ''}`}>
                <Translate name="receive_account" />
                <Dropdown
                  value={state.accountIndex}
                  name="accountIndex"
                  className="account-selector"
                  items={dropdownAccountItems}
                  cb={updateAccountIndex} />
                <button
                  className="button is-primary"
                  onClick={getNewAddress}>
                  {error ? t('receive_try_again') : t('receive_confirm')}
                </button>
              </div>
            </React.Fragment>
          }
          {isExtractingNewAddress &&
            <p>
              <Translate name="common_exporting_public_key" template={VENDOR[vendor]} />
            </p>
          }
        </ActionListModal>
      </React.Fragment>
    );
  }

  return render();
}

export default ReceiveCoinButton;
