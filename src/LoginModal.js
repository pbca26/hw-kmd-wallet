import React, {useState} from 'react';
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

const LoginModal = props => {
  const initialState = {
    isClosed: false,
    password: '',
    error: false,
  };
  const [state, setState] = useState(initialState);

 const updateInput = e => {
    setState(prevState => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  }

  /*useEffect(() => {
    writeLog('login state', state);
  });*/

  const close = () => {
    setLocalStoragePW(state.password);
    
    if (!localStorage.getItem('hw-wallet') ||
        localStorage.getItem('hw-wallet') === 'null') {
      props.closeLoginModal(state.password);
      
      setState(prevState => ({
        ...prevState,
        password: '',
        error: false,
      }));
    } else {
      decodeStoredData()
      .then((res) => {
        if (res) {          
          setState(prevState => ({
            ...prevState,
            password: '',
            error: false,
          }));

          props.closeLoginModal(state.password);
        } else {
          setState(prevState => ({
            ...prevState,
            error: true,
          }));
        }
      });
    }
  }

  const reset = () => {
    setState(prevState => ({
      ...prevState,
      password: '',
      error: false,
    }));

    clearPubkeysCache();
    resetLocalStorage();
  }

  const render = () => {
    const firstTimeUse = !localStorage.getItem('hw-wallet') || localStorage.getItem('hw-wallet') === 'null';

    return (
      <React.Fragment>
        <Modal
          title={firstTimeUse ? 'Create password' :  'Authorization'}
          show={props.isClosed === false}
          isCloseable={false}
          className="settings-modal login-modal">
          <SettingsModal
            resetState={props.resetState}
            isAuth={state.isAuth}
            triggerSidebarSizeChange={props.triggerSidebarSizeChange}
            setVendor={props.setVendor}
            coin="KMD" />
          Password <input
            type="password"
            className="form-control edit login-modal-input-pw"
            name="password"
            onChange={updateInput}
            value={state.password}
            placeholder={firstTimeUse ? 'Create a password to encrypt app data' : 'Enter a password to unlock the app'}
            autoComplete="off"
            required />
          <p className="login-modal-padding-top">Password is required in order to safely store and recover sensitive data such as XPUB keys, cached address transactions and balances.</p>
          {state.error &&
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
              disabled={!state.password}
              onClick={close}>
              OK
            </button>
            {state.error &&
              <button
                className="button del-btn login-modal-float-right"
                onClick={reset}>
                Reset password <i className="fa fa-trash"></i>
              </button>
            }
          </div>
        </Modal>
      </React.Fragment>
    );
  }

  return render();
}

export default LoginModal;