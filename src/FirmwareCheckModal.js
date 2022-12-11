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
import Translate, {t} from './Translate';

const FirmwareCheckModal = props => {
  const initialState = {
    updateLedgerKMDApp: false,
    show: false,
    error: false,
    actions: {
      connect: {
        icon: 'fab fa-usb',
        description: <div><Translate name="fw_check_modal_connect_ledger" /></div>,
        state: null
      },
      komodoApp: {
        icon: 'fas fa-search-dollar',
        description: <div><Translate name="fw_check_modal_open_kmd_app" /></div>,
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
        error: updateLedgerKMDApp ? t('fw_check_modal_update_ledger_apps') : false,
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
          title={t('fw_check_modal_warning_trezor')}
          show={state.show}>
          <p><Translate name="fw_check_modal_your_trezor" /> <a target="_blank" rel="noopener noreferrer" href="https://trezor.io"><Translate name="fw_check_modal_update_fw" /></a> <Translate name="fw_check_modal_to_latest" />.</p>
        </Modal>
      );
    } else {
      return (
        <ActionListModal
          {...state}
          isCloseable={true}
          handleClose={handleClose}
          title={t('fw_check_modal_ledger_fw_check')}
          show={state.show}>
          <p><Translate name="fw_check_modal_ledger_info" /></p>
          <p className="text-center fw-check-modal-padding-bottom">
            <a
              href="!#"
              onClick={handleClose}><Translate name="fw_check_modal_skip" /></a>
          </p>
        </ActionListModal>
      );
    }
  }

  return render();
}

export default FirmwareCheckModal;
