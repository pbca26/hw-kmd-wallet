import 'babel-polyfill';
import React from 'react';
import {hot} from 'react-hot-loader';
import {isEqual} from 'lodash';
import Header from './Header';
import BetaWarning from './BetaWarning';
import CheckBalanceButton from './CheckBalanceButton';
import CheckAllBalancesButton from './CheckAllBalancesButton';
import Accounts from './Accounts';
import WarnU2fCompatibility from './WarnU2fCompatibility';
import WarnBrowser from './WarnBrowser';
import ConnectionError from './ConnectionError';
import Footer from './Footer';
import FirmwareCheckModal from './FirmwareCheckModal';
import SettingsModal from './SettingsModal';
import {
  repository,
  version,
} from '../package.json';
import './App.scss';
import hw from './lib/hw';
import {
  getLocalStorageVar,
  setLocalStorageVar,
} from './localstorage-util';
import {
  LEDGER_FW_VERSIONS,
  voteCoin,
  testCoins,
  TX_FEE,
  VENDOR,
} from './constants';
import accountDiscovery from './lib/account-discovery';
import blockchain, {setBlockchainAPI, blockchainAPI} from './lib/blockchain';
import apiEndpoints from './lib/coins';
import getKomodoRewards from './lib/get-komodo-rewards';
//import {osName} from 'react-device-detect';
import {
  isElectron,
  appData,
  ipcRenderer,
} from './Electron';
import initSettings from './lib/init-settings';

// TODO: receive modal, tos modal, move api end point conn test to blockchain module
const MAX_TIP_TIME_DIFF = 3600 * 24;

class App extends React.Component {
  state = this.initialState;

  get initialState() {
    return {
      accounts: [],
      tiptime: null,
      explorerEndpoint: 'default',
      vendor: null,
      isFirstRun: true,
      ledgerDeviceType: null,
      ledgerFWVersion: 'webusb',
      coin: 'KMD',
      theme: getLocalStorageVar('settings') && getLocalStorageVar('settings').theme ? getLocalStorageVar('settings').theme : 'tdark',
    };
  }

  componentWillMount() {
    document.title = `Komodo Hardware Wallet (v${version})`;
    if (isElectron && !appData.isNspv) {
      setInterval(() => {
        if (!this.state.syncInProgress) {
          console.warn('auto sync called');
          this.syncData();
        }
      }, 300 * 1000);
    }

    /*setTimeout(() => {
      console.warn('run recheck');
      ipcRenderer.send('nspvRunRecheck', {coin: 'rick'});
    }, 2000);*/

    initSettings();
    hw.trezor.init();

    if (!getLocalStorageVar('settings')) {
      setLocalStorageVar('settings', {theme: 'tdark'});
      document.getElementById('body').className = 'tdark';
    } else {
      document.getElementById('body').className = getLocalStorageVar('settings').theme;
    }

    if (isElectron && appData.blockchainAPI === 'spv'/*&& isElectron.blockchainAPI*/) {
      blockchain[blockchainAPI].setCoin(this.state.coin);
      setBlockchainAPI('spv');
    }

    if (!isElectron || (isElectron && appData.blockchainAPI === 'insight')) this.checkExplorerEndpoints();
    
    if (isElectron && appData.isNspv) {
      ipcRenderer.on('nspvRecheck', (event, arg) => {
        console.warn('nspvRecheck arg', arg);
        if (!arg.isFirstRun) console.warn('schedule next sync update in 5 min');
        else console.warn('run sync update immediately (first run)');
        
        if (arg.coin === this.state.coin.toLowerCase()) {
          setTimeout(() => {
            console.warn('auto sync called');
            this.syncData();
          }, arg.isFirstRun === true ? 1000 : 300 * 1000);
        }
      });
    }
  }

  checkTipTime(tiptime) {
    if (!tiptime || Number(tiptime) <= 0) return tiptime;

    const currentTimestamp = Date.now() / 1000;
    const secondsDiff = Math.floor(Number(currentTimestamp) - Number(tiptime));

    if (Math.abs(secondsDiff) < MAX_TIP_TIME_DIFF) {      
      return tiptime;
    } else {
      console.warn('tiptime vs local time is too big, use local time to calc rewards!');
      return currentTimestamp;
    }
  }

  updateCoin(e) {
    this.setState({
      accounts: [],
      tiptime: null,
      explorerEndpoint: isElectron && appData.blockchainAPI === 'spv' ? 'default' : null,
      [e.target.name]: e.target.value,
    });

    setTimeout(() => {
      if (!isElectron || (isElectron && appData.blockchainAPI === 'insight')) this.checkExplorerEndpoints();
      if (isElectron && appData.blockchainAPI === 'spv') {
        blockchain[blockchainAPI].setCoin(this.state.coin);
      }
    }, 50);
  }

  updateLedgerDeviceType = (type) => {
    this.setState({
      'ledgerDeviceType': type,
    });

    if (type === 'x') hw.ledger.setLedgerFWVersion('webusb');
  }

  updateLedgerFWVersion = (e) => {
    this.setState({
      'ledgerFWVersion': e.hasOwnProperty('target') ? e.target.value : e,
    });

    hw.ledger.setLedgerFWVersion(e.hasOwnProperty('target') ? e.target.value : e);
  }

  updateExplorerEndpoint(e) {
    this.setState({
      [e.target.name]: e.target.value,
    });

    console.warn('set api endpoint to ' + e.target.value);

    blockchain[blockchainAPI].setExplorerUrl(e.target.value);
  }

  checkExplorerEndpoints = async () => {
    const getInfoRes =  await Promise.all(apiEndpoints[this.state.coin].api.map((value, index) => {
      return blockchain[blockchainAPI].getInfo(value);
    }));
    let isExplorerEndpointSet = false;
    let longestBlockHeight = 0;
    let apiEndPointIndex = 0;

    console.warn('checkExplorerEndpoints', getInfoRes);
    
    for (let i = 0; i < apiEndpoints[this.state.coin].api.length; i++) {
      if (getInfoRes[i] &&
          getInfoRes[i].hasOwnProperty('info') &&
          getInfoRes[i].info.hasOwnProperty('version')) {
        if (getInfoRes[i].info.blocks > longestBlockHeight) {
          longestBlockHeight = getInfoRes[i].info.blocks;
          apiEndPointIndex = i;
        }
      }
    }

    console.warn('set api endpoint to ' + apiEndpoints[this.state.coin].api[apiEndPointIndex]);
    blockchain[blockchainAPI].setExplorerUrl(apiEndpoints[this.state.coin].api[apiEndPointIndex]);    
    isExplorerEndpointSet = true;
    
    this.setState({
      explorerEndpoint: apiEndpoints[this.state.coin].api[apiEndPointIndex],
    });

    setTimeout(() => {
      if (!isExplorerEndpointSet) {
        this.setState({
          explorerEndpoint: false,
        });
      }
    }, 50);
  };

  resetState = () => {
    this.setVendor();
    this.setState(this.initialState);
    // TODO: auto-close connection after idle time
    hw.ledger.resetTransport();
  }

  syncData = async () => {
    if (!this.state.isFirstRun) {
      console.warn('sync data called');

      let [accounts, tiptime] = await Promise.all([
        accountDiscovery(this.state.vendor, this.state.coin.toLowerCase()),
        blockchain[blockchainAPI].getTipTime()
      ]);

      tiptime = this.checkTipTime(tiptime);

      accounts.map(account => {
        account.balance = account.utxos.reduce((balance, utxo) => balance + utxo.satoshis, 0);
        account.rewards = account.utxos.reduce((rewards, utxo) => rewards + getKomodoRewards({tiptime, ...utxo}), 0);
        account.claimableAmount = account.rewards - TX_FEE;

        return account;
      });

      console.warn('syncData accounts', accounts);

      this.setState({accounts, tiptime});
    }
  }

  handleRewardData = ({accounts, tiptime}) => {
    tiptime = this.checkTipTime(tiptime);
    
    this.setState({accounts, tiptime, isFirstRun: false});
  }

  setVendor = async (vendor) => {
    if (!isElectron || (isElectron && vendor !== 'ledger')) {
      this.setState({vendor});
    } else if (vendor === 'ledger') {
      this.setState({
        vendor: 'ledger',
        ledgerDeviceType: 's',
        ledgerFWVersion: 'webusb',
      });
    }
  }

  setTheme(name) {
    document.getElementById('body').className = name;
    setLocalStorageVar('settings', {theme: name});
    this.setState({
      theme: name,
    });
  }

  vendorSelectorRender() {
    return (
      <div className={`App isPristine${!isElectron && window.location.href.indexOf('disable-mobile') === -1 ? ' Responsive' : ''}`}>
        <Header>
          <div className="navbar-brand">
            <div className="navbar-item">
              <img
                src="favicon.png"
                className="KmdIcon"
                alt="Komodo logo" />
            </div>
            <h1 className="navbar-item">
              <strong>HW KMD {this.state.coin === voteCoin ? 'Notary Elections' : ' wallet'}</strong>
              <SettingsModal
                updateExplorerEndpoint={this.updateExplorerEndpoint}
                coin={this.state.coin}
                explorerEndpoint={this.state.explorerEndpoint} />
            {/*<button
              className="button is-primary add-pwa-button"
              style={{'display': 'none'}}>Add to home screen</button>*/}
            </h1>
          </div>
        </Header>

        <section className="main">
          <React.Fragment>
            <div className="container content text-center">
              <h2>{this.state.coin === voteCoin ? 'Cast your VOTEs' : 'Manage your coins'} from a hardware wallet device.</h2>
            </div>
            <div className="vendor-selector">
              <h3>Choose your vendor</h3>
              <div className="vendor-selector-items">
                <img
                  className="vendor-ledger"
                  src="ledger-logo.png"
                  alt="Ledger"
                  onClick={() => this.setVendor('ledger')} />
                <img
                  className="vendor-trezor"
                  src="trezor-logo.png"
                  alt="Trezor"
                  onClick={() => this.setVendor('trezor')} />
              </div>
            </div>
          </React.Fragment>
        </section>

        {!isElectron &&
          process.env.HTTPS &&
          <WarnU2fCompatibility />
        }
        {!isElectron &&
          <WarnBrowser />
        }

        <Footer>
          {!isElectron &&
            <div className="download-desktop-block">
              <a
                href="https://github.com/pbca26/hw-kmd-wallet/releases"
                target="_blank">
                <button
                  className="button is-light">
                  <i className="fa fa-download"></i>Download for desktop
                </button>
              </a>
            </div>
          }
          <p>
            <strong>{this.state.coin === voteCoin ? 'Hardware wallet KMD Notary Elections' : 'KMD hardware wallet'}</strong> by <a target="_blank" rel="noopener noreferrer" href="https://github.com/atomiclabs">Atomic Labs</a> and <a target="_blank" rel="noopener noreferrer" href="https://github.com/komodoplatform">Komodo Platform</a>.
          </p>
          <p>
            The <a target="_blank" rel="noopener noreferrer" href={`https://github.com/${repository}`}>source code</a> is licensed under <a target="_blank" rel="noopener noreferrer" href={`https://github.com/${repository}/blob/master/LICENSE`}>MIT</a>.
            <br />
            View the <a target="_blank" rel="noopener noreferrer" href={`https://github.com/${repository}#usage`}>README</a> for usage instructions.
          </p>
          {/*<div className="theme-selector">
            Theme
            <div
              onClick={() => this.setTheme('tdark')}
              className={'item black' + (this.state.theme === 'tdark' ? ' active' : '')}></div>
            <div
              onClick={() => this.setTheme('tlight') }
              className={'item light' + (this.state.theme === 'tlight' ? ' active' : '')}></div>
          </div>*/}
        </Footer>
      </div>
    );
  }

  render() {
    if (!this.state.vendor) {
      return this.vendorSelectorRender();
    } else {
      return (
        <div className={`App${testCoins.indexOf(this.state.coin) > -1 ? ' testcoins-warning-fix' : ''}${!isElectron && window.location.href.indexOf('disable-mobile') === -1 ? ' Responsive' : ''}`}>
          <Header>
            <div className="navbar-brand">
              <div className="navbar-item">
                <img
                  src="favicon.png"
                  className="KmdIcon"
                  alt="Komodo logo" />
              </div>
              <h1 className="navbar-item">
                {!this.state.vendor &&
                  <strong>HW KMD {this.state.coin === voteCoin ? 'Notary Elections' : ' wallet'}</strong>
                }
                {this.state.vendor &&
                  <strong>{VENDOR[this.state.vendor]} KMD HW {this.state.coin === voteCoin ? 'Notary Elections' : ' wallet'}</strong>
                }
                <SettingsModal
                  updateExplorerEndpoint={this.updateExplorerEndpoint}
                  coin={this.state.coin} 
                  explorerEndpoint={this.state.explorerEndpoint} />
                {/*apiEndpoints[this.state.coin].api.length > 1 &&
                  <span className="explorer-selector-block">
                    <i className="fa fa-cog"></i>
                    <select
                      className="explorer-selector"
                      name="explorerEndpoint"
                      value={this.state.explorerEndpoint}
                      onChange={(event) => this.updateExplorerEndpoint(event)}>
                      <option
                        key="explorer-selector-disabled"
                        disabled>
                        Select API endpoint
                      </option>
                      {apiEndpoints[this.state.coin].api.map((val, index) => (
                        <option
                          key={`explorer-selector-${val}`}
                          value={val}>
                          {val}
                        </option>
                      ))}
                    </select>
                  </span>
                */}
              </h1>
            </div>
            <div className="navbar-menu">
              <div className="navbar-end">
                <div className="navbar-item">
                  <div className="buttons">
                    <select
                      className="coin-selector"
                      name="coin"
                      value={this.state.coin}
                      onChange={(event) => this.updateCoin(event)}>
                      <option
                        key="coins-none"
                        value=""
                        disabled>
                        Select a coin
                      </option>
                      {Object.keys(apiEndpoints).map((coinTicker, index) => (
                        <option
                          key={`coins-${coinTicker}`}
                          value={coinTicker}>
                          {coinTicker}
                        </option>
                      ))}
                    </select>
                    {(this.state.vendor === 'trezor' || (this.state.vendor === 'ledger' && this.state.ledgerDeviceType)) &&
                     this.state.explorerEndpoint &&
                      <React.Fragment>
                        <CheckBalanceButton
                          handleRewardData={this.handleRewardData}
                          checkTipTime={this.checkTipTime}
                          vendor={this.state.vendor}
                          coin={this.state.coin}>
                          <strong>Check Balance</strong>
                        </CheckBalanceButton>
                        <CheckAllBalancesButton
                          handleRewardData={this.handleRewardData}
                          checkTipTime={this.checkTipTime}
                          vendor={this.state.vendor}
                          explorerEndpoint={this.state.explorerEndpoint}
                          coin={this.state.coin}>
                          <strong>Check All</strong>
                        </CheckAllBalancesButton>
                      </React.Fragment>
                    }
                    <button
                      className="button is-light"
                      disabled={isEqual(this.state, this.initialState)}
                      onClick={this.resetState}>
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Header>

          {testCoins.indexOf(this.state.coin) === -1 &&
            <BetaWarning />
          }

          {this.state.explorerEndpoint === false &&
            <ConnectionError />
          }

          {getLocalStorageVar('settings') && getLocalStorageVar('settings').fwCheck &&
            (!isElectron || (isElectron && !appData.noFWCheck)) &&
            <FirmwareCheckModal
              vendor={this.state.vendor}
              updateLedgerDeviceType={this.updateLedgerDeviceType}
              updateLedgerFWVersion={this.updateLedgerFWVersion} />
          }

          <section className={`main${testCoins.indexOf(this.state.coin) === -1 ? ' beta-warning-fix' : ''}`}>
            {this.state.accounts.length === 0 ? (
              <React.Fragment>
                <div className="container content">
                  <h2>{this.state.coin === voteCoin ? 'Cast your VOTEs' : 'Manage your coins'} from {VENDOR[this.state.vendor]} device.</h2>
                  {this.state.vendor === 'ledger' &&
                    <p>Make sure the KMD app and firmware on your Ledger are up to date, close any apps that might be using connection to your device such as Ledger Live, then connect your Ledger, open the KMD app, and click the "Check Balance" button.</p>
                  }
                  {this.state.vendor === 'trezor' &&
                    <p>Make sure the firmware on your Trezor are up to date, then connect your Trezor and click the "Check Balance" button. Please be aware that you'll need to allow popup windows for Trezor to work properly.</p>
                  }
                  <p>Also, make sure that your {VENDOR[this.state.vendor]} is initialized prior using <strong>KMD {this.state.coin === voteCoin ? 'Notary Elections tool' : 'wallet'}</strong>.</p>
                  {this.state.vendor === 'ledger' &&
                    <p>Have trouble accessing your Ledger device? Read here about <a target="_blank" rel="noopener noreferrer" href="https://github.com/pbca26/hw-kmd-reward-claim/wiki/First-time-using-Ledger-Nano-S-(firmware-v1.6)---Nano-X">first time use</a>.</p>
                  }
                </div>
                <img
                  className="hw-graphic"
                  src={`${this.state.vendor}-logo.png`}
                  alt={VENDOR[this.state.vendor]} />
                <div className="trezor-webusb-container"></div>
                {this.state.vendor === 'ledger' &&
                 !isElectron &&
                  <div className="ledger-device-selector">
                    <div className="ledger-device-selector-buttons">
                      <button
                        className="button is-light"
                        disabled={this.state.ledgerDeviceType}
                        onClick={() => this.updateLedgerDeviceType('s')}>
                        Nano S
                      </button>
                      <button
                        className="button is-light"
                        disabled={this.state.ledgerDeviceType}
                        onClick={() => this.updateLedgerDeviceType('x')}>
                        Nano X
                      </button>
                    </div>
                    {this.state.ledgerDeviceType &&
                      <div className="ledger-fw-version-selector-block">
                        Mode
                        <select
                          className="ledger-fw-selector"
                          name="ledgerFWVersion"
                          value={this.state.ledgerFWVersion}
                          onChange={(event) => this.updateLedgerFWVersion(event)}>
                          {Object.keys(LEDGER_FW_VERSIONS[`nano_${this.state.ledgerDeviceType}`]).map((val, index) => (
                            <option
                              key={`ledger-fw-selector-${val}-${this.state.ledgerDeviceType}`}
                              value={val}>
                              {LEDGER_FW_VERSIONS[`nano_${this.state.ledgerDeviceType}`][val]}
                            </option>
                          ))}
                        </select>
                      </div>
                    }
                  </div>
                }
              </React.Fragment>
            ) : (
              <Accounts
                {...this.state}
                syncData={this.syncData} />
            )}
          </section>

          <Footer>
            <p>
              <strong>{VENDOR[this.state.vendor]} KMD {this.state.coin === voteCoin ? 'Notary Elections' : 'HW wallet'}</strong> by <a target="_blank" rel="noopener noreferrer" href="https://github.com/atomiclabs">Atomic Labs</a> and <a target="_blank" rel="noopener noreferrer" href="https://github.com/komodoplatform">Komodo Platform</a>.<br />
              The <a target="_blank" rel="noopener noreferrer" href={`https://github.com/${repository}`}>source code</a> is licensed under <a target="_blank" rel="noopener noreferrer" href={`https://github.com/${repository}/blob/master/LICENSE`}>MIT</a>.
              <br />
              View the <a target="_blank" rel="noopener noreferrer" href={`https://github.com/${repository}#usage`}>README</a> for usage instructions.
            </p>
            {/*<div className="theme-selector">
              Theme
              <div
                onClick={() => this.setTheme('tdark')}
                className={'item black' + (this.state.theme === 'tdark' ? ' active' : '')}></div>
              <div
                onClick={() => this.setTheme('tlight') }
                className={'item light' + (this.state.theme === 'tlight' ? ' active' : '')}></div>
            </div>*/}
          </Footer>
        </div>
      );
    }
  }
}

export default hot(module)(App);