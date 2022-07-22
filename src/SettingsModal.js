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
            <span className="sidebar-item-title">Settings</span>
          }
        </div>
        <Modal
          title="Settings"
          show={state.isClosed === false}
          handleClose={triggerModal}
          isCloseable={true}
          className="settings-modal">
          <ul>
            {isAuth &&
              <li>
                Sidebar
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
                Auto-lock
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
                  label="Always check firmware version"
                  name="fwCheck"
                  value={state.fwCheck}
                  cb={setFwCheck} />
              </li>
            }
            <li>
              Vendor
              <Dropdown
                value={state.vendor}
                name="vendor"
                className="explorer-selector"
                items={dropdownItems.vendor}
                cb={setVendor} />
            </li>
            <li>
              <Toggle
                label="Enable debug controls (display xpub, raw tx hex)"
                name="enableDebugTools"
                value={state.enableDebugTools}
                cb={setEnableDebugTools} />
            </li>
            <li>
              Address discovery gap limit
              <Dropdown
                value={state.discoveryGapLimit}
                name="discoveryGapLimit"
                className="explorer-selector"
                items={dropdownItems.discoveryGapLimit}
                cb={setDiscoveryConfigVar}
                cbArgs="discoveryGapLimit" />
            </li>
            <li>
              Address discovery concurrency limit
              <Dropdown
                value={state.discoveryAddressConcurrency}
                name="discoveryAddressConcurrency"
                className="explorer-selector"
                items={dropdownItems.discoveryAddressConcurrency}
                cb={setDiscoveryConfigVar}
                cbArgs="discoveryAddressConcurrency" />
            </li>
            <li>
              Account index
              <Dropdown
                value={state.accountIndex}
                name="accountIndex"
                className="explorer-selector"
                items={dropdownItems.accountIndex}
                cb={setDiscoveryConfigVar}
                cbArgs="accountIndex" />
            </li>
            <li>
              Account history max length
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
                Explorer API end point
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
                label="Reset app data"
                name="resetAppData"
                value={state.resetAppData}
                cb={setResetAppData} />
                {state.resetAppData &&
                  <p>
                    <small>
                      <strong>Warning:</strong> "Reset app data" will delete all cached data so you will have to go through setup process again!
                    </small>
                  </p>
                }
            </li>
            <li>
              <Toggle
                style={{'paddingRight': '20px'}}
                label="Import app data"
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
                    placeholder="Paste import data here"
                    value={state.importAppDataStr}
                    onChange={updateInput}></textarea>
                  <p>
                    <small>
                      <strong>Warning:</strong> pressing on "Import app data" button will override all cached data!
                    </small>
                  </p>
                  {state.importAppDataError &&
                    <p>
                      <small>
                        <strong>Error:</strong> app data import format is wrong!
                      </small>
                    </p>
                  }
                  <button
                    className="button"
                    onClick={importAppData}
                    disabled={!state.importAppDataStr}>
                    Import app data
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
                  <button className="button">Export app data</button>
                </a>
              </li>
            }
          </ul>
          <div className="modal-action-block right">
            <button
              onClick={triggerModal}
              className="button is-primary">
              OK
            </button>
          </div>
        </Modal>
      </React.Fragment>
    );
  }

  return render();
}

export default SettingsModal;