import React from 'react';
import hw from './lib/hw';
import updateActionState from './lib/update-action-state';
import {
  FAUCET_URL,
  VENDOR,
  SETTINGS,
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

class ReceiveCoinButton extends React.Component {
  state = this.initialState;

  get initialState() {
    this.open = this.open.bind(this);
    this.close = this.close.bind(this);

    return {
      isExtractingNewAddress: false,
      error: false,
      success: false,
      accountIndex: 0,
      isClosed: true,
      actions: {
        connect: {
          icon: 'fab fa-usb',
          description: this.props.vendor === 'ledger' ? <div>Connect and unlock your Ledger, then open the Komodo app on your device.</div> : <div>Connect and unlock your Trezor.</div>,
          state: null
        },
        confirmAddress: {
          icon: 'fas fa-microchip',
          description: <div>Approve a public key export request on your device.</div>,
          state: null
        }
      }
    };
  }

  triggerCopyToClipboard = (text) => copyToClipboard(text);

  close() {
    this.setState({
      ...this.initialState,
      isClosed: true
    });
  }

  open() {
    this.setState({
      ...this.initialState,
      isClosed: false
    });
  }

  updateAccountIndex(e) {
    this.setState({
      [e.target.name]: e.target.value,
    });
  }

  resetState = () => this.setState(this.initialState);

  getUnusedAddressIndex = () => this.props.accounts[this.state.accountIndex].addresses.filter(address => !address.isChange).length;
  
  getUnusedAddress = () => getAddress(getAccountNode(this.props.accounts[this.state.accountIndex].xpub).externalNode.derive(this.getUnusedAddressIndex()).publicKey);

  getNewAddress = async () => {
    this.setState({
      error: false,
      success: false,
      actions: {
        connect: {
          icon: 'fab fa-usb',
          description: this.props.vendor === 'ledger' ? <div>Connect and unlock your Ledger, then open the Komodo app on your device.</div> : <div>Connect and unlock your Trezor.</div>,
          state: null
        },
        confirmAddress: {
          icon: 'fas fa-microchip',
          description: <div>Approve a public key export request on your device.</div>,
          state: null
        }
      },
      isExtractingNewAddress: true,
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

      currentAction = 'confirmAddress';
      updateActionState(this, currentAction, 'loading');

      const accountIndex = this.state.accountIndex;

      const unusedAddress = this.getUnusedAddress();
      const derivationPath = `44'/141'/${accountIndex}'/0/${this.getUnusedAddressIndex()}`;
      const verify = true;
      const hwUnusedAddress = await hw[this.props.vendor].getAddress(derivationPath, verify);
      if (hwUnusedAddress !== unusedAddress) {
        throw new Error(`${VENDOR[this.props.vendor]} derived address "${hwUnusedAddress}" doesn't match browser derived address "${unusedAddress}"`);
      }
      updateActionState(this, currentAction, true);

      this.setState({
        isExtractingNewAddress: false,
        success: 
          <React.Fragment>
            <span style={{
              'padding': '10px 0',
              'display': 'block'
            }}>
              This your new <strong>{this.props.coin} {accountIndex + 1}</strong> deposit address
              <span className="new-address">
                <strong>{unusedAddress}</strong>
                <QRGenModal
                  coin={this.props.coin}
                  address={unusedAddress}/>
                <button
                  className="button is-light copy-btn"
                  onClick={() => this.triggerCopyToClipboard(unusedAddress)}>
                  <i className="fa fa-copy"></i> <span className="copy-btn-text">Copy</span>
                </button>
              </span>
            {FAUCET_URL[this.props.coin] &&
              <span style={{
                'padding': '15px 0 0',
                'display': 'block'
              }}>
                <strong>
                  {!isElectron &&
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      href={`${FAUCET_URL[this.props.coin]}${unusedAddress}`}>Get funds from a faucet</a>
                  }
                  {isElectron &&
                    <a onClick={() => shell.openExternal(`${FAUCET_URL[this.props.coin]}${unusedAddress}`)}>Get funds from a faucet</a>
                  }
                </strong>
              </span>
            }
            </span>
          </React.Fragment>
      });
    } catch (error) {
      writeLog(error);
      updateActionState(this, currentAction, false);
      this.setState({
        error: error.message,
        isExtractingNewAddress: false,
      });
    }
  };

  render() {
    const {
      isExtractingNewAddress,
      actions,
      error,
      success
    } = this.state;
    let style;

    writeLog(this.props);

    if (error) {
      style = {
        'paddingBottom': '50px',
      };
    }

    return (
      <React.Fragment>
        <li onClick={this.open}>
          <i className="fa fa-paper-plane plane-icon-invert"></i>
        </li>
        <ActionListModal
          title="Receive coin"
          isCloseable={!this.state.isExtractingNewAddress}
          actions={actions}
          error={error}
          success={success}
          handleClose={this.resetState}
          show={this.state.isClosed === false}
          display={this.state.isExtractingNewAddress}
          className="Receive-modal">
          {!isExtractingNewAddress && !success &&
            <React.Fragment>
              <p>
                Select an account to get a new address for.
              </p>
              <div
                className="receive-account-selector-block"
                style={style}>
                Account
                <select
                  className="account-selector minimal"
                  name="accountIndex"
                  value={this.state.accountIndex}
                  onChange={(event) => this.updateAccountIndex(event)}>
                  {this.props.accounts.map((account, index) => (
                    <option
                      key={`account-${account}-${index}`}
                      value={index}>
                      {this.props.coin} {index + 1}
                    </option>
                  ))}
                </select>
                <button
                  className="button is-primary"
                  onClick={this.getNewAddress}>
                  {error ? 'Try again' : 'Confirm'}
                </button>
              </div>
            </React.Fragment>
          }
          {isExtractingNewAddress &&
            <p>
              Exporting a public key from your {VENDOR[this.props.vendor]} device. Please approve public key export request on your device.
            </p>
          }
        </ActionListModal>
      </React.Fragment>
    );
  }
}

export default ReceiveCoinButton;
