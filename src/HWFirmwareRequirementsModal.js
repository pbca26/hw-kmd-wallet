import React from 'react';
import {VENDOR} from './constants';

class HWFirmwareRequirements extends React.Component {
  state = this.initialState;
  
  get initialState() {
    return {
    };
  };

  render() {
    return (
      <React.Fragment>
        <h2>Manage your coins from {VENDOR[this.props.vendor]} device.</h2>
        {this.props.vendor === 'ledger' &&
          <p>Make sure the KMD app and firmware on your Ledger are up to date, close any apps that might be using connection to your device such as Ledger Live, then connect your Ledger, open the KMD app, and click the "Check Balance" button.</p>
        }
        {this.props.vendor === 'trezor' &&
          <p>Make sure the firmware on your Trezor are up to date, then connect your Trezor and click the "Check Balance" button. Please be aware that you'll need to allow popup windows for Trezor to work properly.</p>
        }
        <p>Also, make sure that your {VENDOR[this.props.vendor]} is initialized prior using <strong>KMD wallet</strong>.</p>
        {this.props.vendor === 'ledger' &&
          <p>Have trouble accessing your Ledger device? Read here about <a target="_blank" rel="noopener noreferrer" href="https://github.com/pbca26/hw-kmd-reward-claim/wiki/First-time-using-Ledger-Nano-S-(firmware-v1.6)---Nano-X">first time use</a>.</p>
        }
      </React.Fragment>
    );
  }
}

export default HWFirmwareRequirements;