import React, {useState} from 'react';
import Modal from './Modal';
import QRModal from './QR';

const QRReaderModal = props => {
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

  const setRecieverFromScan = data => {
    props.setRecieverFromScan(data);
    triggerModal();
  }

  return (
    <React.Fragment>
      <i
        className="fa fa-qrcode"
        onClick={triggerModal}></i>
      <Modal
        title="QR code scan"
        show={state.isClosed === false}
        handleClose={triggerModal}
        isCloseable={true}
        className="qr-reader-modal">
        {!state.isClosed &&
          <QRModal
            setRecieverFromScan={setRecieverFromScan}
            mode="scan" />
        }
      </Modal>
    </React.Fragment>
  );
}

export default QRReaderModal;