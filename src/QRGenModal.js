import React from 'react';
import Modal from './Modal';
import QRModal from './QR';

class QRGenModal extends React.Component {
  state = this.initialState;
  
  get initialState() {
    this.triggerModal = this.triggerModal.bind(this);
    
    return {
      isClosed: true,
    };
  }

  triggerModal() {
    this.setState({
      isClosed: !this.state.isClosed,
    });
  }

  render() {
    return (
      <React.Fragment>
        <i
          className="fa fa-qrcode"
          onClick={this.triggerModal}></i>
        <Modal
          title={`QR code for your ${this.props.coin} address`}
          show={this.state.isClosed === false}
          handleClose={this.triggerModal}
          isCloseable={true}
          className="qr-gen-modal">
          <QRModal content={this.props.address} />
        </Modal>
      </React.Fragment>
    );
  }
}

export default QRGenModal;