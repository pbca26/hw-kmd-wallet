import 'babel-polyfill';
import React from 'react';
import {hot} from 'react-hot-loader';
import {isEqual} from 'lodash';
import Header from './Header';
import BetaWarning from './BetaWarning';
import CheckBalanceButton from './CheckBalanceButton';
import Accounts from './Accounts';
import WarnU2fCompatibility from './WarnU2fCompatibility';
import WarnBrowser from './WarnBrowser';
import Footer from './Footer';
import {repository} from '../package.json';
import './App.scss';
import TrezorConnect from 'trezor-connect';
import ledger from './lib/ledger';
import {getLocalStorageVar, setLocalStorageVar} from './localstorage-util';
import {LEDGER_FW_VERSIONS, voteCoin, testCoins} from './constants';
import {setExplorerUrl, getInfo} from './lib/blockchain';
import accountDiscovery from './lib/account-discovery';
import blockchain from './lib/blockchain';
import apiEndpoints from './lib/insight-endpoints';

// TODO: receive modal, tos modal, move api end point conn test to blockchain module

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
      ledgerFWVersion: 'default',
      coin: 'RICK',
      theme: getLocalStorageVar('settings') && getLocalStorageVar('settings').theme ? getLocalStorageVar('settings').theme : 'tdark',
    };
  }

  componentWillMount() {
    setInterval(() => {
      console.warn('auto sync called');
      this.syncData();
    }, 300 * 1000);

    // this will work only on localhost
    if (window.location.href.indexOf('devmode') > -1) {
      TrezorConnect.init({
        webusb: true,
        popup: false,
        manifest: {
          email: 'developer@xyz.com',
          appUrl: 'http://your.application.com',
        },
      })
      .then((res) => {
        TrezorConnect.renderWebUSBButton('.trezor-webusb-container');
      });
    } else {
      TrezorConnect.manifest({
        email: 'developer@xyz.com',
        appUrl: 'http://your.application.com',
      });
    }

    if (!getLocalStorageVar('settings')) {
      setLocalStorageVar('settings', { theme: 'tdark' });
      document.getElementById('body').className = 'tdark';
    } else {
      document.getElementById('body').className = getLocalStorageVar('settings').theme;
    }

    this.checkExplorerEndpoints();
  }

  updateCoin(e) {
    this.setState({
      accounts: [],
      tiptime: null,
      [e.target.name]: e.target.value,
    });

    setTimeout(() => {
      this.checkExplorerEndpoints();
    }, 50);
  }

  updateLedgerDeviceType(type) {
    this.setState({
      'ledgerDeviceType': type,
    });
  }

  updateLedgerFWVersion(e) {
    this.setState({
      [e.target.name]: e.target.value,
    });

    ledger.setLedgerFWVersion(e.target.value);
  }

  updateExplorerEndpoint(e) {
    this.setState({
      [e.target.name]: e.target.value,
    });

    setExplorerUrl(e.target.value);
  }

  checkExplorerEndpoints = async () => {
    const endPoint = apiEndpoints[this.state.coin][0];

    const getInfoRes = await Promise.all([
      getInfo(endPoint),
    ]);

    console.warn('checkExplorerEndpoints', getInfoRes);
    
    for (let i = 0; i < 3; i++) {
      if (getInfoRes[i] && getInfoRes[i].hasOwnProperty('info') && getInfoRes[i].info.hasOwnProperty('version')) {
        console.warn(`set api endpoint to ${endPoint}`);
        setExplorerUrl(endPoint);
        
        this.setState({
          explorerEndpoint: endPoint,
        });

        break;
      }
    }
  };

  resetState = () => {
    ledger.setVendor();
    this.setVendor();
    this.setState(this.initialState);
  }

  syncData = async () => {
    if (!this.state.isFirstRun) {
      console.warn('sync data called');

      let [accounts, tiptime] = await Promise.all([
        accountDiscovery(),
        blockchain.getTipTime()
      ]);

      accounts.map(account => {
        account.balance = account.utxos.reduce((balance, utxo) => balance + utxo.satoshis, 0);
    
        return account;
      });

      console.warn('syncData accounts', accounts);

      this.setState({accounts, tiptime});
    }
  }

  handleRewardData = ({accounts, tiptime}) => {
    this.setState({accounts, tiptime, isFirstRun: false});
  }

  setVendor = (vendor) => {
    this.setState({vendor});
  }

  setTheme(name) {
    document.getElementById('body').className = name;
    setLocalStorageVar('settings', { theme: name });
    this.setState({
      theme: name,
    });
  }

  vendorSelectorRender() {
    return (
      <div className="App">
        <Header>
          <div className="navbar-brand">
            <div className="navbar-item">
              <img src="favicon.png" className="KmdIcon" alt="Komodo logo" />
            </div>
            <h1 className="navbar-item">
              <strong>HW KMD {this.state.coin === voteCoin ? 'Notary Elections' : ' wallet'}</strong>
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
                <img className="vendor-ledger" src="ledger-logo.png" alt="Ledger" onClick={() => this.setVendor('ledger')} />
                <img className="vendor-trezor" src="trezor-logo.png" alt="Trezor" onClick={() => this.setVendor('trezor')} />
              </div>
            </div>
          </React.Fragment>
        </section>

        <WarnU2fCompatibility />
        <WarnBrowser />

        <Footer>
          <p>
            <strong>{this.state.coin === voteCoin ? 'Hardware wallet KMD Notary Elections' : 'KMD hardware wallet'}</strong> by <a target="_blank" rel="noopener noreferrer" href="https://github.com/atomiclabs">Atomic Labs</a> and <a target="_blank" rel="noopener noreferrer" href="https://github.com/komodoplatform">Komodo Platform</a>.
          </p>
          <p>
            The <a target="_blank" rel="noopener noreferrer" href={`https://github.com/${repository}`}>source code</a> is licensed under <a target="_blank" rel="noopener noreferrer" href={`https://github.com/${repository}/blob/master/LICENSE`}>MIT</a>.
            <br />
            View the <a target="_blank" rel="noopener noreferrer" href={`https://github.com/${repository}#usage`}>README</a> for usage instructions.
          </p>
          <div className="theme-selector">
            Theme
            <div
              onClick={ () => this.setTheme('tdark') }
              className={ 'item black' + (this.state.theme === 'tdark' ? ' active' : '') }></div>
            <div
              onClick={ () => this.setTheme('tlight') }
              className={ 'item light' + (this.state.theme === 'tlight' ? ' active' : '') }></div>
          </div>
        </Footer>
      </div>
    );
  }

  render() {
    if (!this.state.vendor) {
      return this.vendorSelectorRender();
    } else {
      return (
        <div className="App">
          <Header>
            <div className="navbar-brand">
              <div className="navbar-item">
                <img src="favicon.png" className="KmdIcon" alt="Komodo logo" />
              </div>
              <h1 className="navbar-item">
                {!this.state.vendor &&
                  <strong>HW KMD {this.state.coin === voteCoin ? 'Notary Elections' : ' wallet'}</strong>
                }
                {this.state.vendor &&
                  <strong>{this.state.vendor === 'ledger' ? 'Ledger' : 'Trezor'} KMD HW {this.state.coin === voteCoin ? 'Notary Elections' : ' wallet'}</strong>
                }
                {/*<span className="explorer-selector-block">
                  <i className="fa fa-cog"></i>
                  <select
                    className="explorer-selector"
                    name="explorerEndpoint"
                    value={this.state.explorerEndpoint}
                    onChange={ (event) => this.updateExplorerEndpoint(event) }>
                    <option
                      key="explorer-selector-disabled"
                      disabled>
                      Select API endpoint
                    </option>
                    {Object.keys(INSIGHT_API_URL).map((val, index) => (
                      <option
                        key={`explorer-selector-${val}`}
                        value={val}>
                        {val}
                      </option>
                    ))}
                  </select>
                  </span>*/}
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
                      onChange={ (event) => this.updateCoin(event) }>
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
                      <CheckBalanceButton handleRewardData={this.handleRewardData} vendor={this.state.vendor}>
                        <strong>Check Balance</strong>
                      </CheckBalanceButton>
                    }
                    <button className="button is-light" disabled={isEqual(this.state, this.initialState)} onClick={this.resetState}>
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

          <section className={`main${testCoins.indexOf(this.state.coin) === -1 ? ' beta-warning-fix' : ''}`}>
            {this.state.accounts.length === 0 ? (
              <React.Fragment>
                <div className="container content">
                  <h2>{this.state.coin === voteCoin ? 'Cast your VOTEs' : 'Manage your coins'} from {this.state.vendor === 'ledger' ? 'Ledger' : 'Trezor'} device.</h2>
                  {this.state.vendor === 'ledger' &&
                    <p>Make sure the KMD app and firmware on your Ledger are up to date, then connect your Ledger, open the KMD app, and click the "Check Balance" button.</p>
                  }
                  {this.state.vendor === 'trezor' &&
                    <p>Make sure the firmware on your Trezor are up to date, then connect your Trezor and click the "Check Balance" button. Please be aware that you'll need to allow popup windows for Trezor to work properly.</p>
                  }
                  <p>Also, make sure that your {this.state.vendor === 'ledger' ? 'Ledger' : 'Trezor'} is initialized prior using <strong>KMD {this.state.coin === voteCoin ? 'Notary Elections tool' : 'wallet'}</strong>.</p>
                </div>
                <img className="hw-graphic" src={`${this.state.vendor}-logo.png`} alt={this.state.vendor === 'ledger' ? 'Ledger' : 'Trezor'} />
                <div className="trezor-webusb-container"></div>
                {this.state.vendor === 'ledger' && (!this.state.ledgerDeviceType || this.state.ledgerDeviceType === 's') &&
                  <div className="ledger-device-selector">
                    <div className="ledger-device-selector-buttons">
                      <button className="button is-light" disabled={this.state.ledgerDeviceType} onClick={() => this.updateLedgerDeviceType('s')}>
                        Nano S
                      </button>
                      <button className="button is-light" disabled={this.state.ledgerDeviceType} onClick={() => this.updateLedgerDeviceType('x')}>
                        Nano X
                      </button>
                    </div>
                    {this.state.ledgerDeviceType === 's' &&
                      <div className="ledger-fw-version-selector-block">
                        Mode
                        <select
                          className="ledger-fw-selector"
                          name="ledgerFWVersion"
                          value={this.state.ledgerFWVersion}
                          onChange={ (event) => this.updateLedgerFWVersion(event) }>
                          {Object.keys(LEDGER_FW_VERSIONS).map((val, index) => (
                            <option
                              key={`ledger-fw-selector-${val}`}
                              value={val}>
                              {LEDGER_FW_VERSIONS[val]}
                            </option>
                          ))}
                        </select>
                      </div>
                    }
                  </div>
                }
              </React.Fragment>
            ) : (
              <Accounts {...this.state} syncData={this.syncData} />
            )}
          </section>

          <Footer>
            <p>
              <strong>{this.state.vendor === 'ledger' ? 'Ledger' : 'Trezor'} KMD {this.state.coin === voteCoin ? 'Notary Elections' : 'HW wallet'}</strong> by  and <a target="_blank" rel="noopener noreferrer" href="https://github.com/komodoplatform">Komodo Platform</a>.
              The <a target="_blank" rel="noopener noreferrer" href={`https://github.com/${repository}`}>source code</a> is licensed under <a target="_blank" rel="noopener noreferrer" href={`https://github.com/${repository}/blob/master/LICENSE`}>MIT</a>.
              <br />
              View the <a target="_blank" rel="noopener noreferrer" href={`https://github.com/${repository}#usage`}>README</a> for usage instructions.
            </p>
            <div className="theme-selector">
              Theme
              <div
                onClick={ () => this.setTheme('tdark') }
                className={ 'item black' + (this.state.theme === 'tdark' ? ' active' : '') }></div>
              <div
                onClick={ () => this.setTheme('tlight') }
                className={ 'item light' + (this.state.theme === 'tlight' ? ' active' : '') }></div>
            </div>
          </Footer>
        </div>
      );
    }
  }
}

export default hot(module)(App);
