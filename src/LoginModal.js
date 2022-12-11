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
import Translate, {t} from './Translate';

//import {writeLog} from './Debug';

const LoginModal = props => {
  const initialState = {
    isClosed: false,
    password: '1',
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
          title={firstTimeUse ? t('login_create_password') : t('login_auth')}
          show={props.isClosed === false}
          isCloseable={false}
          className="settings-modal login-modal">
          <SettingsModal
            resetState={props.resetState}
            isAuth={state.isAuth}
            triggerSidebarSizeChange={props.triggerSidebarSizeChange}
            setVendor={props.setVendor}
            coin="KMD" />
          <Translate name="login_password" /> <input
            type="password"
            className="form-control edit login-modal-input-pw"
            name="password"
            onChange={updateInput}
            value={state.password}
            placeholder={firstTimeUse ? t('login_create_a_password') : t('login_enter_a_password')}
            autoComplete="off"
            required />
          <p className="login-modal-padding-top">
            <Translate name="login_password_is_required" />
          </p>
          {state.error &&
            <React.Fragment>
              <p className="login-error">
                <Translate name="login_unable_to_decrypt" />
              </p>
              <p>
                <strong><Translate name="login_warning" />:</strong> <Translate name="login_reset_password_button" />
              </p>
            </React.Fragment>
          }
          <div className="modal-action-block left">
            <button
              className="button is-primary"
              disabled={!state.password}
              onClick={close}>
              <Translate name="login_ok" />
            </button>
            {state.error &&
              <button
                className="button del-btn login-modal-float-right"
                onClick={reset}>
                <Translate name="login_reset_password" /> <i className="fa fa-trash"></i>
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