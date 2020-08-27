import React from 'react';
import compareVersions from 'compare-versions';
import trezorCheckFW from './lib/trezor-hw-version';
import ledgerVersion from './lib/ledger-version';
import {
  TREZOR_FW_MIN_VERSION,
  LEDGER_MIN_APP_VERSION,
  LEDGER_DEVICE_HEX_ENUM,
} from './constants';
import ActionListModal from './ActionListModal';
import updateActionState from './lib/update-action-state';
import Modal from './Modal';

class FirmwareCheckModal extends React.Component {
  state = {
    updateLedgerKMDApp: false,
    show: false,
    error: false,
    actions: {
      connect: {
        icon: 'fab fa-usb',
        description: <div>Connect and unlock your Ledger, then open the dashboard on your device.</div>,
        state: null
      },
      komodoApp: {
        icon: 'fas fa-search-dollar',
        description: <div>Open Komodo app on your device</div>,
        state: null
      },
    },
  };

  async componentDidMount() {
    if (this.props.vendor === 'trezor') {
      const trezorFw = await trezorCheckFW();
      const updateTrezorFw = compareVersions.compare(`${trezorFw.major_version}.${trezorFw.minor_version}.${trezorFw.patch_version}`, TREZOR_FW_MIN_VERSION[trezorFw.model], '>=');

      this.setState({
        show: !updateTrezorFw,
      });
    } else if (this.props.vendor === 'ledger') {
      updateActionState(this, 'connect', 'loading');

      this.setState({
        show: true,
      });
      const ledgerFw = await ledgerVersion.getLedgerDeviceInfo();
      const ledgerNanoSFWVersion = compareVersions.compare(ledgerFw.fwVersion, '1.6.0', '>=');
      
      updateActionState(this, 'connect', true);
      this.props.updateLedgerDeviceType(LEDGER_DEVICE_HEX_ENUM[ledgerFw.targetId.toString(16)]);

      if (ledgerNanoSFWVersion && LEDGER_DEVICE_HEX_ENUM[ledgerFw.targetId.toString(16)] === 's') this.props.updateLedgerFWVersion('webusb');

      updateActionState(this, 'komodoApp', 'loading');

      const ledgerKMDApp = await ledgerVersion.getLedgerAppInfo();
      const updateLedgerKMDApp = !compareVersions.compare(ledgerKMDApp.version, LEDGER_MIN_APP_VERSION, '>=');
      updateActionState(this, 'komodoApp', true);
      this.setState({
        updateLedgerKMDApp,
        show: updateLedgerKMDApp,
        error: updateLedgerKMDApp ? 'Please update Bitcoin and Komodo apps to version 1.4.0 or greater.' : false,
      });
    }
  }

  handleClose = () => {
    ledgerVersion.cancelIntervals();

    this.setState({
      show: false,
    });
  }

  render() {
    if (this.props.vendor === 'trezor') {
      return (
        <Modal
          {...this.state}
          isCloseable={true}
          handleClose={this.handleClose}
          title="Warning: Trezor is not up to date"
          show={this.state.show}>
          <p>Your Trezor is not up to date. Please <a target="_blank" rel="noopener noreferrer" href="https://trezor.io">update firmware</a> to the latest available.</p>
        </Modal>
      );
    } else {
      return (
        <ActionListModal
          {...this.state}
          isCloseable={true}
          handleClose={this.handleClose}
          title="Ledger firmware and app version check"
          show={this.state.show}>
          <p>Please follow steps below to validate your Ledger device firmware and Komodo app version.</p>
          <p className="text-center" style={{'paddingBottom': '10px'}}>
            <a onClick={this.handleClose}>Skip this step</a>
          </p>
        </ActionListModal>
      );
    }
  }
}

export default FirmwareCheckModal;
