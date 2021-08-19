import React from 'react';
import Modal from './Modal';
import QRModal from './QR';

class QRReaderModal extends React.Component {
  state = this.initialState;
  
  get initialState() {
    this.triggerModal = this.triggerModal.bind(this);
    this.setRecieverFromScan = this.setRecieverFromScan.bind(this);
    
    return {
      isClosed: true,
    };
  }

  triggerModal() {
    this.setState({
      isClosed: !this.state.isClosed,
    });
  }

  setRecieverFromScan(data) {
    this.props.setRecieverFromScan(data);
    this.triggerModal();
  }

  render() {
    return (
      <React.Fragment>
        <i
          className="fa fa-qrcode"
          onClick={this.triggerModal}></i>
        <Modal
          title="QR code scan"
          show={this.state.isClosed === false}
          handleClose={this.triggerModal}
          isCloseable={true}
          className="qr-reader-modal">
          {!this.state.isClosed &&
            <QRModal
              setRecieverFromScan={this.setRecieverFromScan}
              mode="scan" />
          }
        </Modal>
      </React.Fragment>
    );
  }
}

export default QRReaderModal;