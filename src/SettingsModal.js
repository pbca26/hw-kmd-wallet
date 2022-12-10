import React, {useState} from 'react';
import Modal from './Modal';
import './SettingsModal.scss';
import {
  getLocalStorageVar,
  setLocalStorageVar,
} from './lib/localstorage-util';
import apiEndpoints from './lib/coins';
import {setConfigVar, clearPubkeysCache} from './lib/account-discovery';
import {isElectron} from './Electron';
import {writeLog} from './Debug';
import Dropdown from './Dropdown';
import Toggle from './Toggle';
import dropdownItems from './SettingsModalHelpers';
import {LangContext} from './ContextProviders';
import Translate, {t} from './Translate';

// TODO: individual settings for each coin

const SettingsModal = props => {
  const initialState = {
    isClosed: true,
    theme: getLocalStorageVar('settings').theme,
    discoveryGapLimit: getLocalStorageVar('settings').discoveryGapLimit,
    discoveryAddressConcurrency: getLocalStorageVar('settings').discoveryAddressConcurrency,
    accountIndex: getLocalStorageVar('settings').accountIndex,
    explorerEndpoint: 'default',
    fwCheck: getLocalStorageVar('settings').fwCheck,
    enableDebugTools: getLocalStorageVar('settings').enableDebugTools,
    vendor: getLocalStorageVar('settings').vendor,
    sidebarSize: getLocalStorageVar('settings').sidebarSize,
    autolock: getLocalStorageVar('settings').autolock && Number(getLocalStorageVar('settings').autolock),      
    historyLength: getLocalStorageVar('settings').historyLength && Number(getLocalStorageVar('settings').historyLength),
    resetAppData: false,
    enableImportAppData: false,
    importAppDataStr: null,
    importAppDataError: false,
  };
  const [state, setState] = useState(initialState);

  const setAutoLock = e => {
    setLocalStorageVar('settings', {autolock: Number(e.target.value)});
    setState(prevState => ({
      ...prevState,
      [e.target.name]: Number(e.target.value),
    }));
  }

  const setDiscoveryConfigVar = (e, name) => {
    setState(prevState => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));

    if (name !== 'historyLength') {
      setConfigVar(e.target.name, Number(e.target.value));
    }
    setLocalStorageVar('settings', {[e.target.name]: Number(e.target.value)});
  }

  const setVendor = e => {
    setState(prevState => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));

    props.setVendor(e.target.value);
  }

  const setFwCheck = () => {
    setLocalStorageVar('settings', {fwCheck: !state.fwCheck});
    setState(prevState => ({
      ...prevState,
      fwCheck: !state.fwCheck,
    }));
  }

  const setEnableDebugTools = () => {
    setLocalStorageVar('settings', {enableDebugTools: !state.enableDebugTools});
    setState(prevState => ({
      ...prevState,
      enableDebugTools: !state.enableDebugTools,
    }));
  }

  const setExplorerEndpoint = e => {
    setState(prevState => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));

    props.updateExplorerEndpoint(e);
  }

  /*const setTheme = name => {
    document.getElementById('body').className = name;
    setLocalStorageVar('settings', {theme: name});
    setState(prevState => ({
      ...prevState,
      theme: name,
    }));
  }*/

  const setSidebarSize = e => {
    setLocalStorageVar('settings', {sidebarSize: e.target.value});
    setState(prevState => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));

    props.triggerSidebarSizeChange();
  }

  const triggerModal = () => {
    if (state.resetAppData) {
      clearPubkeysCache();
      localStorage.setItem('hw-wallet', null);
      props.resetState(true);
    }

    setState(prevState => ({
      ...prevState,
      isClosed: !state.isClosed,
      explorerEndpoint: props.explorerEndpoint,
      resetAppData: false,
      enableImportAppData: false,
      importAppDataStr: null,
      importAppDataError: false,
    }));

    props.triggerSidebarSizeChange();
  }

  const setResetAppData = () => {
    setState(prevState => ({
      ...prevState,
      resetAppData: !state.resetAppData,
    }));
  }

  const setImportAppData = () => {
    setState(prevState => ({
      ...prevState,
      enableImportAppData: !state.enableImportAppData,
    }));
  }

  const importAppData = () => {
    const checkImportFormat = state.importAppDataStr.indexOf('$250000$cbc') > -1;

    setState(prevState => ({
      ...prevState,
      importAppDataError: checkImportFormat ? false : true,
    }));

    if (checkImportFormat) {
      localStorage.setItem('hw-wallet', state.importAppDataStr);
      props.resetState('logout');
      triggerModal();
    }
  }

  const exportAppData = () => {
    const a = document.getElementById('saveModalImage');
    const appData = localStorage.getItem('hw-wallet');

    a.href = 'data:text/plain;charset=UTF-8;base64,' + btoa(appData);
    a.download = 'hw-kmd-wallet-export-app-data';
  }

  const updateInput = e => {
    setState(prevState => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  }

  const render = () => {
    const {coin, isAuth} = props;
    writeLog(coin);

    const dropdownExplorerItems = apiEndpoints[coin].api.map((val, index) => (
      {
        value: val,
        label: val,
      }
    ));

    return (
      <React.Fragment>
        <div
          className="settings-modal-trigger-block"
          onClick={triggerModal}>
          <i className="fa fa-cogs"></i>
          {props.sidebarSize === 'full' &&
            <span className="sidebar-item-title"><Translate name="settings_settings" /></span>
          }
        </div>
        <Modal
          title={t('settings_settings')}
          show={state.isClosed === false}
          handleClose={triggerModal}
          isCloseable={true}
          className="settings-modal">
          <ul>
            <li>
              <LangContext.Consumer>
                {({value, setLang}) => (
                  <React.Fragment>
                    <Translate name="settings_lang" />
                    <Dropdown
                      value={value}
                      name="lang"
                      className="explorer-selector"
                      items={dropdownItems.languages}
                      cb={(e) => setLang(e.target.value)} />
                  </React.Fragment>
                )}
              </LangContext.Consumer>
            </li>
            {isAuth &&
              <li>
                <Translate name="settings_sidebar" />
                <Dropdown
                  value={state.sidebarSize}
                  name="sidebarSize"
                  className="explorer-selector"
                  items={dropdownItems.sidebar}
                  cb={setSidebarSize} />
              </li>
            }
            {isAuth &&
              <li>
                <Translate name="settings_autolock" />
                <Dropdown
                  value={state.autolock}
                  name="autolock"
                  className="explorer-selector"
                  items={dropdownItems.autolock}
                  cb={setAutoLock} />
              </li>
            }
            {!isElectron &&
              <li>
                <Toggle
                  label={t('settings_check_fw')}
                  name="fwCheck"
                  value={state.fwCheck}
                  cb={setFwCheck} />
              </li>
            }
            <li>
              <Translate name="settings_vendor" />
              <Dropdown
                value={state.vendor}
                name="vendor"
                className="explorer-selector"
                items={dropdownItems.vendor}
                cb={setVendor} />
            </li>
            <li>
              <Toggle
                label={t('settings_enable_debug')}
                name="enableDebugTools"
                value={state.enableDebugTools}
                cb={setEnableDebugTools} />
            </li>
            <li>
              <Translate name="settings_address_discovery_gap" />
              <Dropdown
                value={state.discoveryGapLimit}
                name="discoveryGapLimit"
                className="explorer-selector"
                items={dropdownItems.discoveryGapLimit}
                cb={setDiscoveryConfigVar}
                cbArgs="discoveryGapLimit" />
            </li>
            <li>
              <Translate name="settings_address_concurrency" />
              <Dropdown
                value={state.discoveryAddressConcurrency}
                name="discoveryAddressConcurrency"
                className="explorer-selector"
                items={dropdownItems.discoveryAddressConcurrency}
                cb={setDiscoveryConfigVar}
                cbArgs="discoveryAddressConcurrency" />
            </li>
            <li>
              <Translate name="settings_account_index" />
              <Dropdown
                value={state.accountIndex}
                name="accountIndex"
                className="explorer-selector"
                items={dropdownItems.accountIndex}
                cb={setDiscoveryConfigVar}
                cbArgs="accountIndex" />
            </li>
            <li>
              <Translate name="settings_account_history" />
              <Dropdown
                value={state.historyLength}
                name="historyLength"
                className="explorer-selector"
                items={dropdownItems.historyLength}
                cb={setDiscoveryConfigVar}
                cbArgs="historyLength" />
            </li>
            {apiEndpoints[coin].api.length > 1 &&
              <li>
                <Translate name="settings_explorer_api" />
                <Dropdown
                  value={state.explorerEndpoint}
                  name="explorerEndpoint"
                  className="explorer-selector"
                  items={dropdownExplorerItems}
                  cb={setExplorerEndpoint} />
              </li>
            }
            <li>
              <Toggle
                style={{'paddingRight': '20px'}}
                label={t('settings_reset_data')}
                name="resetAppData"
                value={state.resetAppData}
                cb={setResetAppData} />
                {state.resetAppData &&
                  <p>
                    <small>
                      <strong><Translate name="settings_warning" />:</strong> <Translate name="settings_reset_data_warning" />
                    </small>
                  </p>
                }
            </li>
            <li>
              <Toggle
                style={{'paddingRight': '20px'}}
                label={t('settings_import_data')}
                name="enableImportAppData"
                value={state.enableImportAppData}
                cb={setImportAppData} />
              {state.enableImportAppData &&
                <React.Fragment>
                  <textarea
                    className="settings-modal-import-area"
                    rows="5"
                    cols="33"
                    name="importAppDataStr"
                    placeholder={t('settings_paste_import_data')}
                    value={state.importAppDataStr}
                    onChange={updateInput}></textarea>
                  <p>
                    <small>
                      <strong><Translate name="settings_warning" />:</strong> <Translate name="settings_pressing_on_import" />
                    </small>
                  </p>
                  {state.importAppDataError &&
                    <p>
                      <small>
                        <strong><Translate name="settings_error" />:</strong> <Translate name="settings_import_data_error" />
                      </small>
                    </p>
                  }
                  <button
                    className="button"
                    onClick={importAppData}
                    disabled={!state.importAppDataStr}>
                    <Translate name="settings_import_data" />
                  </button>
                </React.Fragment>
              }
            </li>
            {!state.enableImportAppData &&
              <li>
                <a
                  href="!#"
                  id="saveModalImage"
                  onClick={exportAppData}>
                  <button className="button"><Translate name="settings_export_data" /></button>
                </a>
              </li>
            }
          </ul>
          <div className="modal-action-block right">
            <button
              onClick={triggerModal}
              className="button is-primary">
              <Translate name="settings_ok" />
            </button>
          </div>
        </Modal>
      </React.Fragment>
    );
  }

  return render();
}

export default SettingsModal;