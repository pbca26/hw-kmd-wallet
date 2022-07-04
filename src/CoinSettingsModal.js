import React, {useState} from 'react';
import Modal from './Modal';
import copyToClipboard from './lib/copy-to-clipboard';

const CoinSettingsModal = props => {
  const initialState = {
    isClosed: true,
    showXpub: {},
  };
  const [state, setState] = useState(initialState);

  const close = () => {
    setState(prevState => ({
      ...prevState,
      isClosed: true,
      showXpub: {},
    }));
  }

  const open = () => {
    setState(prevState => ({
      ...prevState,
      isClosed: false,
      showXpub: {},
    }));
  }

  const deleteCoin = () => {
    props.removeCoin(props.activeCoin);
    close();
  }

  const syncData = () => {
    props.syncData(props.activeCoin);
    close();
  }

  const triggerCopyToClipboard = text => copyToClipboard(text);

  const toggleShowXpub = index => {
    setState(prevState => ({
      ...prevState,
      showXpub: Object.assign(
        {},
        state.showXpub,
        !state.showXpub[index] ? {[index]: true} : {[index]: !state.showXpub[index]}
      ),
    }));
  }

  const renderAccountList = () => {
    return (
      <div className="coin-settings-accounts-block">
        <h4>Accounts</h4>
        <div className="coin-settings-accounts">
          {props.accounts.map((item, index) => (
            <div
              className="item"
              key={`coin-settings-accounts-${index}`}>
              <span className="item-label">Account {item.accountIndex + 1}</span>
              <button
                className="button"
                onClick={() => props.enableAccount(item.accountIndex)}>
                <i className={`fa fa-${item.enabled ? 'eye' : 'eye-slash'}`}></i>
              </button>
              <button
                className="button"
                onClick={() => toggleShowXpub(item.accountIndex)}>
                XPUB <i className={`fa fa-${state.showXpub && state.showXpub[item.accountIndex] ? 'eye' : 'eye-slash'} coin-settings-margin-left`}></i>
              </button>
              {state.showXpub &&
               state.showXpub[item.accountIndex] &&
                <div className="xpub-string">
                  {item.xpub}
                  <button
                    className="button is-light copy-btn"
                    onClick={() => triggerCopyToClipboard(item.xpub)}>
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

  const render = () => {
    const {activeCoin} = props;

    return (
      <React.Fragment>
        <span
          className="coin-actions-modal-trigger"
          onClick={() => open()}>
          <i className="fa fa-wrench"></i>
        </span>
        <Modal
          title="Coin Settings"
          show={state.isClosed === false}
          handleClose={() => close()}
          isCloseable={true}
          className="Modal-coin-settings">
          <button
            className="button del-btn"
            onClick={syncData}>
            Resync {activeCoin} <i className="fa fa-history"></i>
          </button>
          <button
            className="button del-btn"
            onClick={deleteCoin}>
            Remove {activeCoin} <i className="fa fa-trash"></i>
          </button>
          {renderAccountList()}
        </Modal>
      </React.Fragment>
    );
  }

  return render();
}

export default CoinSettingsModal;