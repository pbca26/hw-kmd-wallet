import React, {useState, useEffect} from 'react';
import compareVersions from 'compare-versions';
import trezorCheckFW from './lib/trezor-hw-version';
import ledgerVersion from './lib/ledger-version';
import hw from './lib/hw';
import {
  TREZOR_FW_MIN_VERSION,
  LEDGER_MIN_APP_VERSION,
  LEDGER_DEVICE_HEX_ENUM,
} from './constants';
import ActionListModal from './ActionListModal';
import updateActionState from './lib/update-action-state';
import Modal from './Modal';

const FirmwareCheckModal = props => {
  const initialState = {
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
  const [state, setState] = useState(initialState);

  const onMount = async() => {
    const {vendor} = props;

    if (vendor === 'trezor') {
      const trezorFw = await trezorCheckFW();
      const trezorFwVersion = `${trezorFw.major_version}.${trezorFw.minor_version}.${trezorFw.patch_version}`;
      const updateTrezorFw = compareVersions.compare(trezorFwVersion, TREZOR_FW_MIN_VERSION[trezorFw.model], '>=');

      setState(prevState => ({
        ...prevState,
        show: !updateTrezorFw,
      }));
    } else if (vendor === 'ledger') {
      updateActionState({setState}, 'connect', 'loading');

      setState(prevState => ({
        ...prevState,
        show: true,
      }));
      const ledgerFw = await ledgerVersion.getLedgerDeviceInfo();
      const ledgerNanoSFWVersion = compareVersions.compare(ledgerFw.fwVersion, '1.6.0', '>=');
      
      updateActionState({setState}, 'connect', true);
      props.updateLedgerDeviceType(LEDGER_DEVICE_HEX_ENUM[ledgerFw.targetId.toString(16)]);

      if (ledgerNanoSFWVersion &&
          LEDGER_DEVICE_HEX_ENUM[ledgerFw.targetId.toString(16)] === 's') {
        props.updateLedgerFWVersion('webusb');
      }

      updateActionState({setState}, 'komodoApp', 'loading');

      const ledgerKMDApp = await ledgerVersion.getLedgerAppInfo();
      const updateLedgerKMDApp = !compareVersions.compare(ledgerKMDApp.version, LEDGER_MIN_APP_VERSION, '>=');
      updateActionState({setState}, 'komodoApp', true);
      setState(prevState => ({
        ...prevState,
        updateLedgerKMDApp,
        show: updateLedgerKMDApp,
        error: updateLedgerKMDApp ? 'Please update Bitcoin and Komodo apps to version 1.4.0 or greater.' : false,
      }));
      hw.ledger.setLedgerTransport();
    }
  };

  useEffect(() => {
    onMount();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    ledgerVersion.cancelIntervals();
    hw.ledger.setLedgerTransport();

    setState(prevState => ({
      ...prevState,
      show: false,
    }));
  }

  const render = () => {
    if (props.vendor === 'trezor') {
      return (
        <Modal
          {...state}
          isCloseable={true}
          handleClose={handleClose}
          title="Warning: Trezor is not up to date"
          show={state.show}>
          <p>Your Trezor is not up to date. Please <a target="_blank" rel="noopener noreferrer" href="https://trezor.io">update firmware</a> to the latest available.</p>
        </Modal>
      );
    } else {
      return (
        <ActionListModal
          {...state}
          isCloseable={true}
          handleClose={handleClose}
          title="Ledger firmware and app version check"
          show={state.show}>
          <p>Please follow steps below to validate your Ledger device firmware and Komodo app version.</p>
          <p className="text-center fw-check-modal-padding-bottom">
            <a
              href="!#"
              onClick={handleClose}>Skip this step</a>
          </p>
        </ActionListModal>
      );
    }
  }

  return render();
}

export default FirmwareCheckModal;
