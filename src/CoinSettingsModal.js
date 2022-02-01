import React from 'react';
import Modal from './Modal';
import copyToClipboard from './lib/copy-to-clipboard';

class CoinSettingsModal extends React.Component {
  state = this.initialState;
  
  get initialState() {
    this.deleteCoin = this.deleteCoin.bind(this);
    this.syncData = this.syncData.bind(this);

    return {
      isClosed: true,
      showXpub: {},
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

  triggerCopyToClipboard = (text) => copyToClipboard(text);

  toggleShowXpub(index) {
    this.setState({
      showXpub: Object.assign(
        {},
        this.state.showXpub,
        !this.state.showXpub[index] ? {[index]: true} : {[index]: !this.state.showXpub[index]}
      ),
    });
  }

  renderAccountList() {
    return (
      <div className="coin-settings-accounts-block">
        <h4>Accounts</h4>
        <div className="coin-settings-accounts">
          {this.props.accounts.map((item, index) => (
            <div
              className="item"
              key={`coin-settings-accounts-${index}`}>
              <span className="item-label">Account {item.accountIndex + 1}</span>
              <button
                className="button"
                onClick={() => this.props.enableAccount(item.accountIndex)}>
                <i className={`fa fa-${item.enabled ? 'eye' : 'eye-slash'}`}></i>
              </button>
              <button
                className="button"
                onClick={() => this.toggleShowXpub(item.accountIndex)}>
                XPUB <i className={`fa fa-${this.state.showXpub && this.state.showXpub[item.accountIndex] ? 'eye' : 'eye-slash'}`} style={{'marginLeft': '7px'}}></i>
              </button>
              {this.state.showXpub &&
                this.state.showXpub[item.accountIndex] &&
                <div className="xpub-string">
                  {item.xpub}
                  <button
                    className="button is-light copy-btn"
                    onClick={() => this.triggerCopyToClipboard(item.xpub)}>
                    <i className="fa fa-copy"></i> <span className="copy-btn-text">Copy</span>
                  </button>
                </div>
              }
            </div>
          ))}
        </div>
      </div>
    );
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
          {this.renderAccountList()}
        </Modal>
      </React.Fragment>
    );
  }
}

export default CoinSettingsModal;