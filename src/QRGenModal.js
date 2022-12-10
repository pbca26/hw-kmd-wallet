import React, {useState} from 'react';
import Modal from './Modal';
import QRModal from './QR';
import {t} from './Translate';

const QRGenModal = props => {
  const initialState = {
    isClosed: true,
  };
  const [state, setState] = useState(initialState);

  const triggerModal = () => {
    setState(prevState => ({
      ...prevState,
      isClosed: !state.isClosed,
    }));
  }

  const render = () => {
    const {coin, address} = props;

    return (
      <React.Fragment>
        <i
          className="fa fa-qrcode"
          onClick={triggerModal}></i>
        <Modal
          title={t('qr_gen_modal', coin)}
          show={state.isClosed === false}
          handleClose={triggerModal}
          isCloseable={true}
          className="qr-gen-modal">
          <QRModal content={address} />
        </Modal>
      </React.Fragment>
    );
  }

  return render();
}

export default QRGenModal;