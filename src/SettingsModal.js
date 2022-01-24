import React from 'react';
import Modal from './Modal';
import './SettingsModal.scss';
import {
  getLocalStorageVar,
  setLocalStorageVar,
} from './lib/localstorage-util';
import {SETTINGS, VENDOR} from './constants';
import apiEndpoints from './lib/coins';
import {setConfigVar} from './lib/account-discovery';
import {isElectron} from './Electron';
import {writeLog} from './Debug';

// TODO: individual settings for each coin

class SettingsModal extends React.Component {
  state = this.initialState;
  
  get initialState() {
    this.triggerModal = this.triggerModal.bind(this);
    this.setFwCheck = this.setFwCheck.bind(this);
    this.setEnableDebugTools = this.setEnableDebugTools.bind(this);
    this.setResetAppData = this.setResetAppData.bind(this);
    this.exportAppData = this.exportAppData.bind(this);
    this.setImportAppData = this.setImportAppData.bind(this);
    this.importAppData = this.importAppData.bind(this);
    this.updateInput = this.updateInput.bind(this);
    
    return {
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
      resetAppData: false,
      enableImportAppData: false,
      importAppDataStr: null,
      importAppDataError: false,
    };
  }

  setAutoLock(e) {
    setLocalStorageVar('settings', {autolock: Number(e.target.value)});
    this.setState({
      [e.target.name]: Number(e.target.value),
    });
  }

  setDiscoveryConfigVar(e, name) {
    this.setState({
      [e.target.name]: e.target.value,
    });

    setConfigVar(e.target.name, Number(e.target.value));
  }

  setVendor(e) {
    this.setState({
      [e.target.name]: e.target.value,
    });

    this.props.setVendor(e.target.value);
  }

  setFwCheck() {
    setLocalStorageVar('settings', {fwCheck: !this.state.fwCheck});
    this.setState({
      fwCheck: !this.state.fwCheck,
    });
  }

  setEnableDebugTools() {
    setLocalStorageVar('settings', {enableDebugTools: !this.state.enableDebugTools});
    this.setState({
      enableDebugTools: !this.state.enableDebugTools,
    });
  }

  setExplorerEndpoint(e) {
    this.setState({
      [e.target.name]: e.target.value,
    });

    this.props.updateExplorerEndpoint(e);
  }

  setTheme(name) {
    document.getElementById('body').className = name;
    setLocalStorageVar('settings', {theme: name});
    this.setState({
      theme: name,
    });
  }

  setSidebarSize(e) {
    setLocalStorageVar('settings', {sidebarSize: e.target.value});
    this.setState({
      [e.target.name]: e.target.value,
    });

    this.props.triggerSidebarSizeChange();
  }

  triggerModal() {
    if (this.state.resetAppData) {
      localStorage.setItem('hw-wallet', null);
      this.props.resetState(true);
    }

    this.setState({
      isClosed: !this.state.isClosed,
      explorerEndpoint: this.props.explorerEndpoint,
      resetAppData: false,
      enableImportAppData: false,
      importAppDataStr: null,
      importAppDataError: false,
    });

    this.props.triggerSidebarSizeChange();
  }

  setResetAppData() {
    this.setState({
      resetAppData: !this.state.resetAppData,
    });
  }

  setImportAppData() {
    this.setState({
      enableImportAppData: !this.state.enableImportAppData,
    });
  }

  importAppData() {
    const checkImportFormat = this.state.importAppDataStr.indexOf('$250000$cbc') > -1;

    this.setState({
      importAppDataError: checkImportFormat ? false : true,
    });

    if (checkImportFormat) {
      localStorage.setItem('hw-wallet', this.state.importAppDataStr);
      this.props.resetState('logout');
      this.triggerModal();
    }
  }

  exportAppData() {
    const a = document.getElementById('saveModalImage');
    const appData = localStorage.getItem('hw-wallet');

    a.href = 'data:text/plain;charset=UTF-8;base64,' + btoa(appData);
    a.download = 'hw-wallet-export-app-data';
  }

  updateInput(e) {
    this.setState({
      [e.target.name]: e.target.value,
    });
  }

  render() {
    writeLog(this.props.coin);

    return (
      <React.Fragment>
        <div
          className="settings-modal-trigger-block"
          onClick={this.triggerModal}>
          <i className="fa fa-cogs"></i>
          {this.props.sidebarSize === 'full' &&
            <span className="sidebar-item-title">Settings</span>
          }
        </div>
        <Modal
          title="Settings"
          show={this.state.isClosed === false}
          handleClose={this.triggerModal}
          isCloseable={true}
          className="settings-modal">
          <ul>
            {/*<li>
              <div className="theme-selector">
                Theme
                <div
                  onClick={() => this.setTheme('tdark')}
                  className={'item black' + (this.state.theme === 'tdark' ? ' active' : '')}></div>
                <div
                  onClick={() => this.setTheme('tlight')}
                  className={'item light' + (this.state.theme === 'tlight' ? ' active' : '')}></div>
              </div>
            </li>*/}
            {this.props.isAuth &&
              <li>
                Sidebar
                <select
                  name="sidebarSize"
                  className="explorer-selector minimal"
                  value={this.state.sidebarSize}
                  onChange={(event) => this.setSidebarSize(event)}>
                  {Object.keys(SETTINGS.SIDEBAR).map((item, index) => (
                    <option
                      key={`sidebar-size-${item}`}
                      value={item}>
                      {SETTINGS.SIDEBAR[item]}
                    </option>
                  ))}
                </select>
              </li>
            }
            {this.props.isAuth &&
              <li>
                Auto-lock
                <select
                  name="autolock"
                  className="explorer-selector minimal"
                  value={this.state.autolock}
                  onChange={(event) => this.setAutoLock(event)}>
                  {Object.keys(SETTINGS.AUTOLOCK).map((item, index) => (
                    <option
                      key={`autolock-timeout-${item}`}
                      value={item}>
                      {SETTINGS.AUTOLOCK[item]}
                    </option>
                  ))}
                </select>
              </li>
            }
            {!isElectron &&
              <li>
                <span className="slider-text">Always check firmware version</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    name="fwCheck"
                    value={this.state.fwCheck}
                    checked={this.state.fwCheck}
                    readOnly />
                  <span
                    className="slider round"
                    onClick={this.setFwCheck}></span>
                </label>
              </li>
            }
            <li>
              Vendor
              <select
                name="vendor"
                className="explorer-selector minimal"
                value={this.state.vendor}
                onChange={(event) => this.setVendor(event)}>
                {Object.keys(VENDOR).map((item, index) => (
                  <option
                    key={`vendor-${item}`}
                    value={item}>
                    {VENDOR[item]}
                  </option>
                ))}
              </select>
            </li>
            <li>
              <span className="slider-text">Enable debug controls (display xpub, raw tx hex)</span>
              <label className="switch">
                <input
                  type="checkbox"
                  name="enableDebugTools"
                  value={this.state.enableDebugTools}
                  checked={this.state.enableDebugTools}
                  readOnly />
                <span
                  className="slider round"
                  onClick={this.setEnableDebugTools}></span>
              </label>
            </li>
            <li>
              Address discovery gap limit
              <select
                name="discoveryGapLimit"
                className="explorer-selector minimal"
                value={this.state.discoveryGapLimit}
                onChange={(event) => this.setDiscoveryConfigVar(event, 'discoveryGapLimit')}>
                {Array.from({length: SETTINGS.DISCOVERY_GAP_LIMIT / 5}, (_, i) => i + 1).map((item, index) => (
                  <option
                    key={`discovery-account-index-${index}`}
                    value={(index + 1) * 5}>
                    {index === 3 ? (index + 1) * 5 + ' (default)' : (index + 1) * 5}
                  </option>
                ))}
              </select>
            </li>
            <li>
              Address discovery concurrency limit
              <select
                name="discoveryAddressConcurrency"
                className="explorer-selector minimal"
                value={this.state.discoveryAddressConcurrency}
                onChange={(event) => this.setDiscoveryConfigVar(event, 'discoveryAddressConcurrency')}>
                {Object.keys(SETTINGS.DISCOVERY_ADDRESS_CONCURRENCY).map((item, index) => (
                  <option
                    key={`discovery-address-concurrency-${item}`}
                    value={index}>
                    {SETTINGS.DISCOVERY_ADDRESS_CONCURRENCY[item]}
                  </option>
                ))}
              </select>
            </li>
            <li>
              Account index
              <select
                name="accountIndex"
                className="explorer-selector minimal"
                value={this.state.accountIndex}
                onChange={(event) => this.setDiscoveryConfigVar(event, 'accountIndex')}>
                {[...Array(SETTINGS.ACCOUNT_INDEX_LIMIT).keys()].map((item, index) => (
                  <option
                    key={`discovery-account-index-${item}`}
                    value={index}>
                    {index === 0 ? index + ' (default)' : index}
                  </option>
                ))}
              </select>
            </li>
            {apiEndpoints[this.props.coin].api.length > 1 &&
              <li>
                Explorer API end point
                <select
                  className="explorer-selector minimal"
                  name="explorerEndpoint"
                  value={this.state.explorerEndpoint}
                  onChange={(event) => this.setExplorerEndpoint(event)}>
                  {apiEndpoints[this.props.coin].api.map((val, index) => (
                    <option
                      key={`explorer-selector-${val}`}
                      value={val}>
                      {val}
                    </option>
                  ))}
                </select>
              </li>
            }
            <li>
              <span className="slider-text" style={{'paddingRight': '20px'}}>Reset app data</span>
              <label className="switch">
                <input
                  type="checkbox"
                  name="resetAppData"
                  value={this.state.resetAppData}
                  checked={this.state.resetAppData}
                  readOnly />
                <span
                  className="slider round"
                  onClick={this.setResetAppData}></span>
              </label>
              {this.state.resetAppData &&
                <p>
                  <small>
                    <strong>Warning:</strong> "Reset app data" will delete all cached data so you will have to go through KMD HW Wallet setup again!
                  </small>
                </p>
              }
            </li>
            <li>
              <span className="slider-text" style={{'paddingRight': '20px'}}>Import app data</span>
              <label className="switch">
                <input
                  type="checkbox"
                  name="enableImportAppData"
                  value={this.state.enableImportAppData}
                  checked={this.state.enableImportAppData}
                  readOnly />
                <span
                  className="slider round"
                  onClick={this.setImportAppData}></span>
              </label>
              {this.state.enableImportAppData &&
                <React.Fragment>
                  <textarea
                    className="settings-modal-import-area"
                    rows="5"
                    cols="33"
                    name="importAppDataStr"
                    placeholder="Paste import data here"
                    value={this.state.importAppDataStr}
                    onChange={this.updateInput}></textarea>
                  <p>
                    <small>
                      <strong>Warning:</strong> pressing on "Import app data" button will override all cached data!
                    </small>
                  </p>
                  {this.state.importAppDataError &&
                    <p>
                      <small>
                        <strong>Error:</strong> app data import format is wrong!
                      </small>
                    </p>
                  }
                  <button
                    className="button"
                    onClick={this.importAppData}
                    disabled={!this.state.importAppDataStr}>
                    Import app data
                  </button>
                </React.Fragment>
              }
            </li>
            {!this.state.enableImportAppData &&
              <li>
                <a
                  href="#"
                  id="saveModalImage"
                  onClick={this.exportAppData}>
                  <button className="button">
                    Export app data
                  </button>
                </a>
              </li>
            }
          </ul>
          <div className="modal-action-block right">
            <button
              onClick={this.triggerModal}
              className="button is-primary">
              OK
            </button>
          </div>
        </Modal>
      </React.Fragment>
    );
  }
}

export default SettingsModal;