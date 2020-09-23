import React from 'react';
import hw from './lib/hw';
import updateActionState from './lib/update-action-state';
import {
  TX_FEE,
  FAUCET_URL,
  VENDOR,
} from './constants';
import ActionListModal from './ActionListModal';
import getAddress from './lib/get-address';
import {
  isElectron,
  shell,
} from './Electron';

class ReceiveCoinButton extends React.Component {
  state = this.initialState;

  get initialState() {
    return {
      isExtractingNewAddress: false,
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
      }
    };
  }

  resetState = () => this.setState(this.initialState);

  getUnusedAddressIndex = () => this.props.account.addresses.filter(address => !address.isChange).length;
  
  getUnusedAddress = () => this.props.address.length ? this.props.address : getAddress(this.props.account.externalNode.derive(this.getUnusedAddressIndex()).publicKey);

  getNewAddress = async () => {
    this.setState({
      ...this.initialState,
      address: null,
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

      const {accountIndex} = this.props.account;

      const unusedAddress = this.getUnusedAddress();
      const derivationPath = `44'/141'/${accountIndex}'/0/${this.getUnusedAddressIndex()}`;
      const verify = true;
      const hwUnusedAddress = this.props.address.length ? this.props.address : await hw[this.props.vendor].getAddress(derivationPath, verify);
      if (hwUnusedAddress !== unusedAddress) {
        throw new Error(`${VENDOR[this.props.vendor]} derived address "${hwUnusedAddress}" doesn't match browser derived address "${unusedAddress}"`);
      }
      updateActionState(this, currentAction, true);

      this.setState({
        success: 
          <React.Fragment>
            <span style={{
              'padding': '10px 0',
              'display': 'block'
            }}>
              This your new {this.props.coin} deposit address <strong>{unusedAddress}</strong>
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
                    <a
                      href="#"
                      onClick={() => shell.openExternal(`${FAUCET_URL[this.props.coin]}${unusedAddress}`)}>Get funds from a faucet</a>
                  }
                </strong>
              </span>
            }
            </span>
          </React.Fragment>
      });
    } catch (error) {
      console.warn(error);
      updateActionState(this, currentAction, false);
      this.setState({error: error.message});
    }
  };

  render() {
    const {
      isExtractingNewAddress,
      actions,
      error,
      success
    } = this.state;

    return (
      <React.Fragment>
        <button
          className="button is-primary receive-btn"
          onClick={this.getNewAddress}>
          {this.props.children}
        </button>
        <ActionListModal
          title="Receive coin"
          actions={actions}
          error={error}
          success={success}
          handleClose={this.resetState}
          show={isExtractingNewAddress}>
          <p>
            Exporting a public key from your {VENDOR[this.props.vendor]} device. Please approve public key export request on your device.
          </p>
        </ActionListModal>
      </React.Fragment>
    );
  }
}

export default ReceiveCoinButton;
