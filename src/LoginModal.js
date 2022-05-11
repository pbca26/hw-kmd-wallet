import React from 'react';
import Modal from './Modal';
import './SettingsModal.scss';
import SettingsModal from './SettingsModal';
import {
  setLocalStoragePW,
  decodeStoredData,
  resetLocalStorage,
} from './lib/localstorage-util';
import {clearPubkeysCache} from './lib/account-discovery';
//import {writeLog} from './Debug';

class LoginModal extends React.Component {
  state = this.initialState;
  
  get initialState() {
    this.updateInput = this.updateInput.bind(this);
    this.close = this.close.bind(this);
    this.reset = this.reset.bind(this);
    
    return {
      isClosed: false,
      password: '',
      error: false,
    };
  }

  updateInput(e) {
    this.setState({
      [e.target.name]: e.target.value,
    });

    /*setTimeout(() => {
      writeLog('this.state', this.state);
    }, 100);*/
  }

  close() {
    setLocalStoragePW(this.state.password);
    
    if (!localStorage.getItem('hw-wallet') ||
        localStorage.getItem('hw-wallet') === 'null') {
      this.props.closeLoginModal(this.state.password);
      
      this.setState({
        password: '',
        error: false,
      });
    } else {
      decodeStoredData()
      .then((res) => {
        if (res) {          
          this.setState({
            password: '',
            error: false,
          });

          this.props.closeLoginModal(this.state.password);
        } else {
          this.setState({
            error: true,
          });
        }
      });
    }
  }

  reset() {
    this.setState({
      password: '',
      error: false,
    });

    clearPubkeysCache();
    resetLocalStorage();
  }

  render() {
    const firstTimeUse = !localStorage.getItem('hw-wallet') || localStorage.getItem('hw-wallet') === 'null';

    return (
      <React.Fragment>
        <Modal
          title={firstTimeUse ? 'Create password' :  'Authorization'}
          show={this.props.isClosed === false}
          isCloseable={false}
          className="settings-modal login-modal">
          <SettingsModal
            resetState={this.props.resetState}
            isAuth={this.state.isAuth}
            triggerSidebarSizeChange={this.props.triggerSidebarSizeChange}
            setVendor={this.props.setVendor}
            coin="KMD" />
          Password <input
            type="password"
            className="form-control edit login-modal-input-pw"
            name="password"
            onChange={this.updateInput}
            value={this.state.password}
            placeholder={firstTimeUse ? 'Create a password to encrypt app data' : 'Enter a password to unlock the app'}
            autoComplete="off"
            required />
          <p className="login-modal-padding-top">Password is required in order to safely store and recover sensitive data such as XPUB keys, cached address transactions and balances.</p>
          {this.state.error &&
            <React.Fragment>
              <p className="login-error">Unable to decrypt, please try again or reset password.</p>
              <p>
                <strong>Warning:</strong> "Reset password" button will delete all cached data so you will have to go through KMD HW Wallet setup again!
              </p>
            </React.Fragment>
          }
          <div className="modal-action-block left">
            <button
              className="button is-primary"
              disabled={!this.state.password}
              onClick={this.close}>
              OK
            </button>
            {this.state.error &&
              <button
                className="button del-btn login-modal-float-right"
                onClick={this.reset}>
                Reset password <i className="fa fa-trash"></i>
              </button>
            }
          </div>
        </Modal>
      </React.Fragment>
    );
  }
}

export default LoginModal;