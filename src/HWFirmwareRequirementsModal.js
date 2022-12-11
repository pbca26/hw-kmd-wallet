import React from 'react';
import {VENDOR} from './constants';
import Translate from './Translate';

const HWFirmwareRequirements = props => {
  const render = () => {
    const {vendor} = props;

    return (
      <React.Fragment>
        <h2><Translate name="hw_fw_req_modal_manage_coins" template={VENDOR[vendor]} /></h2>
        {vendor === 'ledger' &&
          <p><Translate name="hw_fw_req_modal_ledger_info" /></p>
        }
        {vendor === 'trezor' &&
          <p><Translate name="hw_fw_req_modal_trezor_info" /></p>
        }
        <p><Translate name="hw_fw_req_modal_vendor_info" template={VENDOR[vendor]} /> <strong><Translate name="hw_fw_req_modal_wallet" /></strong>.</p>
        {vendor === 'ledger' &&
          <p><Translate name="hw_fw_req_modal_have_trouble" /> <a target="_blank" rel="noopener noreferrer" href="https://github.com/pbca26/hw-kmd-reward-claim/wiki/First-time-using-Ledger-Nano-S-(firmware-v1.6)---Nano-X"><Translate name="hw_fw_req_modal_first_time" /></a>.</p>
        }
      </React.Fragment>
    );
  }

  return render();
}

export default HWFirmwareRequirements;