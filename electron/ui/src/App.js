import 'babel-polyfill';
import React from 'react';
import {hot} from 'react-hot-loader';
import {isEqual} from 'lodash';
import Header from './Header';
import CheckRewardsButton from './CheckRewardsButton';
import Accounts from './Accounts';
import WarnU2fCompatibility from './WarnU2fCompatibility';
import FirmwareCheckModal from './FirmwareCheckModal';
import Footer from './Footer';
import {repository} from '../package.json';
import './App.scss';
import TrezorConnect from 'trezor-connect';
import hw from './lib/hw';
import {
  getLocalStorageVar,
  setLocalStorageVar,
} from './localstorage-util';
import {
  INSIGHT_API_URL,
  LEDGER_FW_VERSIONS,
  VENDOR,
} from './constants';
import {
  setExplorerUrl,
  getInfo,
} from './lib/blockchain';
import {isMobile} from 'react-device-detect';

const MAX_TIP_TIME_DIFF = 3600 * 24;

class App extends React.Component {
  state = this.initialState;

  get initialState() {
    return {
      accounts: [],
      tiptime: null,
      explorerEndpoint: 'default',
      vendor: null,
      ledgerDeviceType: null,
      ledgerFWVersion: 'default',
      theme: getLocalStorageVar('settings') && getLocalStorageVar('settings').theme ? getLocalStorageVar('settings').theme : 'tdark',
    };
  }

  componentWillMount() {
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
      setLocalStorageVar('settings', {theme: 'tdark'});
      document.getElementById('body').className = 'tdark';
    } else {
      document.getElementById('body').className = getLocalStorageVar('settings').theme;
    }

    this.checkExplorerEndpoints();

    // limit mobile support to ledger webusb only
    if (isMobile) {
      hw.ledger.setLedgerFWVersion('webusb');

      this.setState({
        vendor: 'ledger',
        ledgerDeviceType: 's',
        ledgerFWVersion: 'webusb',
      });
    }
  }

  updateLedgerDeviceType = (type) => {
    console.warn(type)
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

    setExplorerUrl(e.target.value);
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

  checkExplorerEndpoints = async () => {
    const getInfoRes =  await Promise.all(Object.keys(INSIGHT_API_URL).map((value, index) => {
      return getInfo(INSIGHT_API_URL[value]);
    }));

    console.warn('checkExplorerEndpoints', getInfoRes);
    
    for (let i = 0; i < Object.keys(INSIGHT_API_URL).length; i++) {
      if (getInfoRes[i] &&
          getInfoRes[i].hasOwnProperty('info') &&
          getInfoRes[i].info.hasOwnProperty('version')) {
        console.warn('set api endpoint to ' + Object.keys(INSIGHT_API_URL)[i]);
        setExplorerUrl(Object.keys(INSIGHT_API_URL)[i]);
        
        this.setState({
          explorerEndpoint: Object.keys(INSIGHT_API_URL)[i],
        });

        break;
      }
    }
  };

  resetState = () => {
    this.setVendor();
    this.setState(this.initialState);
    // TODO: auto-close connection after idle time
    hw.ledger.resetTransport();

    // limit mobile support to ledger webusb only
    if (isMobile) {
      setTimeout(() => {
        hw.ledger.setLedgerFWVersion('webusb');

        this.setState({
          vendor: 'ledger',
          ledgerDeviceType: 's',
          ledgerFWVersion: 'webusb',
        });
      }, 50);
    }
  }

  handleRewardData = ({accounts, tiptime}) => {
    tiptime = this.checkTipTime(tiptime);

    this.setState({accounts, tiptime});
  }

  setVendor = async (vendor) => {
    this.setState({vendor});
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
      <div className="App">
        <Header>
          <div className="navbar-brand">
            <div className="navbar-item">
              <img
                src="favicon.png"
                className="KmdIcon"
                alt="Komodo logo" />
            </div>
            <h1 className="navbar-item">
              <strong>HW KMD Rewards Claim</strong>
            </h1>
          </div>
        </Header>

        <section className="main">
          <React.Fragment>
            <div className="container content text-center">
              <h2>Claim your KMD rewards on your hardware wallet device.</h2>
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

        <WarnU2fCompatibility vendor={this.state.vendor} />

        <Footer>
          <p>
            <strong>Hardware wallet KMD Rewards Claim</strong> by <a target="_blank" rel="noopener noreferrer" href="https://github.com/atomiclabs">Atomic Labs</a> and <a target="_blank" rel="noopener noreferrer" href="https://github.com/komodoplatform">Komodo Platform</a>.
          </p>
          <p>
            The <a target="_blank" rel="noopener noreferrer" href={`https://github.com/${repository}`}>source code</a> is licensed under <a target="_blank" rel="noopener noreferrer" href={`https://github.com/${repository}/blob/master/LICENSE`}>MIT</a>.
            <br />
            View the <a target="_blank" rel="noopener noreferrer" href={`https://github.com/${repository}#usage`}>README</a> for usage instructions.
          </p>
          <div className="theme-selector">
            Theme
            <div
              onClick={() => this.setTheme('tdark')}
              className={'item black' + (this.state.theme === 'tdark' ? ' active' : '')}></div>
            <div
              onClick={() => this.setTheme('tlight')}
              className={'item light' + (this.state.theme === 'tlight' ? ' active' : '')}></div>
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
          <Header vendor={this.state.vendor}>
            <div className="navbar-brand">
              <div className="navbar-item">
                <img
                  src="favicon.png"
                  className="KmdIcon"
                  alt="Komodo logo" />
              </div>
              <h1 className="navbar-item">
                {!this.state.vendor &&
                  <strong>HW KMD Rewards Claim</strong>
                }
                {this.state.vendor &&
                  <strong>
                    <span className="ucfirst">{this.state.vendor}</span> KMD Rewards Claim
                  </strong>
                }
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
                    {Object.keys(INSIGHT_API_URL).map((val, index) => (
                      <option
                        key={`explorer-selector-${val}`}
                        value={val}>
                        {val}
                      </option>
                    ))}
                  </select>
                </span>
              </h1>
            </div>
            <div className="navbar-menu">
              <div className="navbar-end">
                <div className="navbar-item">
                  <div className="buttons">
                    {(this.state.vendor === 'trezor' || (this.state.vendor === 'ledger' && this.state.ledgerDeviceType)) &&
                      <CheckRewardsButton
                        handleRewardData={this.handleRewardData}
                        checkTipTime={this.checkTipTime}
                        vendor={this.state.vendor}>
                        <strong>Check Rewards</strong>
                      </CheckRewardsButton>
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

          <FirmwareCheckModal
            vendor={this.state.vendor}
            updateLedgerDeviceType={this.updateLedgerDeviceType}
            updateLedgerFWVersion={this.updateLedgerFWVersion} />

          <section className="main">
            {this.state.accounts.length === 0 ? (
              <React.Fragment>
                <div className="container content">
                  <h2>Claim KMD rewards on your <span className="ucfirst">{this.state.vendor}</span> device.</h2>
                  {this.state.vendor === 'ledger' &&
                    <p>Make sure the KMD app and firmware on your Ledger are up to date, close any apps that might be using connection to your device such as Ledger Live, then connect your Ledger, open the KMD app, and click the "Check Rewards" button.</p>
                  }
                  {this.state.vendor === 'trezor' &&
                    <p>Make sure the firmware on your Trezor are up to date, then connect your Trezor and click the "Check Rewards" button. Please be aware that you'll need to allow popup windows for Trezor to work properly.</p>
                  }
                  <p>Also, make sure that your <span className="ucfirst">{this.state.vendor}</span> is initialized prior using <strong>KMD Rewards Claim tool</strong>.</p>
                  {this.state.vendor === 'ledger' &&
                    <p>Have trouble accessing your Ledger device? Read here about <a target="_blank" rel="noopener noreferrer" href="https://github.com/pbca26/hw-kmd-reward-claim/wiki/First-time-using-Ledger-Nano-S-(firmware-v1.6)---Nano-X">first time use</a>.</p>
                  }
                </div>
                <img
                  className="hw-graphic"
                  src={`${this.state.vendor}-logo.png`}
                  alt={VENDOR[this.state.vendor]} />
                {!isMobile &&
                 this.state.vendor === 'ledger' &&
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
              <Accounts {...this.state} />
            )}
          </section>

          <Footer>
            <p>
              <strong><span className="ucfirst">{this.state.vendor}</span> KMD Rewards Claim</strong> by  and <a target="_blank" rel="noopener noreferrer" href="https://github.com/komodoplatform">Komodo Platform</a>.
              The <a target="_blank" rel="noopener noreferrer" href={`https://github.com/${repository}`}>source code</a> is licensed under <a target="_blank" rel="noopener noreferrer" href={`https://github.com/${repository}/blob/master/LICENSE`}>MIT</a>.
              <br />
              View the <a target="_blank" rel="noopener noreferrer" href={`https://github.com/${repository}#usage`}>README</a> for usage instructions.
            </p>
            <div className="theme-selector">
              Theme
              <div
                onClick={() => this.setTheme('tdark')}
                className={'item black' + (this.state.theme === 'tdark' ? ' active' : '')}></div>
              <div
                onClick={() => this.setTheme('tlight')}
                className={'item light' + (this.state.theme === 'tlight' ? ' active' : '')}></div>
            </div>
          </Footer>
        </div>
      );
    }
  }
}

export default hot(module)(App);
