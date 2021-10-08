import React from 'react';
import Modal from './Modal';
//import './CoinSettingsModal.scss';

class CoinSettingsModal extends React.Component {
  state = this.initialState;
  
  get initialState() {
    this.deleteCoin = this.deleteCoin.bind(this);
    this.syncData = this.syncData.bind(this);

    return {
      isClosed: true,
    };
  };

  close() {
    this.setState({
      isClosed: true
    });
  }

  open() {
    this.setState({
      isClosed: false
    });
  }

  deleteCoin() {
    this.props.removeCoin(this.props.activeCoin);
    this.close();
  }

  syncData() {
    this.props.syncData(this.props.activeCoin);
    this.close();
  }

  render() {
    return (
      <React.Fragment>
        <span
          className="coin-actions-modal-trigger"
          onClick={() => this.open()}>
          <i className="fa fa-wrench"></i>
        </span>
        <Modal
          title="Coin Settings"
          show={this.state.isClosed === false}
          handleClose={() => this.close()}
          isCloseable={true}
          className="Modal-coin-settings">
          <button
            className="button del-btn"
            onClick={this.syncData}>
            Resync {this.props.activeCoin} <i className="fa fa-history"></i>
          </button>
          <button
            className="button del-btn"
            onClick={this.deleteCoin}>
            Remove {this.props.activeCoin} <i className="fa fa-trash"></i>
          </button>
        </Modal>
      </React.Fragment>
    );
  }
}

export default CoinSettingsModal;