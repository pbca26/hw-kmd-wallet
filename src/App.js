import 'babel-polyfill';
import React from 'react';
import {hot} from 'react-hot-loader';
import {isEqual} from 'lodash';
import Header from './Header';
import CheckRewardsButton from './CheckRewardsButton';
import Accounts from './Accounts';
import WarnU2fCompatibility from './WarnU2fCompatibility';
import Footer from './Footer';
import {repository} from '../package.json';
import './App.scss';
import TrezorConnect from 'trezor-connect';
import ledger from './lib/ledger';
import {getLocalStorageVar, setLocalStorageVar} from './localstorage-util';
import {INSIGHT_API_URL} from './constants';
import {setExplorerUrl, getInfo} from './lib/blockchain';

class App extends React.Component {
  state = this.initialState;

  get initialState() {
    return {
      accounts: [],
      tiptime: null,
      explorerEndpoint: 'default',
      vendor: null,
      theme: getLocalStorageVar('settings') && getLocalStorageVar('settings').theme ? getLocalStorageVar('settings').theme : 'tdark',
    };
  }

  componentWillMount() {
    TrezorConnect.manifest({
      email: 'developer@xyz.com',
      appUrl: 'http://your.application.com',
    });

    if (!getLocalStorageVar('settings')) {
      setLocalStorageVar('settings', { theme: 'tdark' });
      document.getElementById('body').className = 'tdark';
    } else {
      document.getElementById('body').className = getLocalStorageVar('settings').theme;
    }

    this.checkExplorerEndpoints();
  }

  updateExplorerEndpoint(e) {
    this.setState({
      [e.target.name]: e.target.value,
    });

    setExplorerUrl(e.target.value);
  }

  checkExplorerEndpoints = async () => {
    const getInfoRes = await Promise.all([
      getInfo(INSIGHT_API_URL.default),
      getInfo(INSIGHT_API_URL.komodoplatform),
      getInfo(INSIGHT_API_URL.dexstats)
    ]);

    console.warn('checkExplorerEndpoints', getInfoRes);
    
    for (let i = 0; i < 3; i++) {
      if (getInfoRes[i] && getInfoRes[i].hasOwnProperty('info') && getInfoRes[i].info.hasOwnProperty('version')) {
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
    ledger.setVendor();
    this.setVendor();
    this.setState(this.initialState);
  }

  handleRewardData = ({accounts, tiptime}) => {
    this.setState({accounts, tiptime});
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
                <img className="vendor-ledger" src="ledger-logo.png" alt="Ledger" onClick={() => this.setVendor('ledger')} />
                <img className="vendor-trezor" src="trezor-logo.png" alt="Trezor" onClick={() => this.setVendor('trezor')} />
              </div>
            </div>
          </React.Fragment>
        </section>

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
                  <strong>HW KMD Rewards Claim</strong>
                }
                {this.state.vendor &&
                  <strong>{this.state.vendor === 'ledger' ? 'Ledger' : 'Trezor'} KMD Rewards Claim</strong>
                }
                <span className="explorer-selector-block">
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
                </span>
              </h1>
            </div>
            <div className="navbar-menu">
              <div className="navbar-end">
                <div className="navbar-item">
                  <div className="buttons">
                    <CheckRewardsButton handleRewardData={this.handleRewardData} vendor={this.state.vendor}>
                      <strong>Check Rewards</strong>
                    </CheckRewardsButton>
                    <button className="button is-light" disabled={isEqual(this.state, this.initialState)} onClick={this.resetState}>
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Header>

          <section className="main">
            {this.state.accounts.length === 0 ? (
              <React.Fragment>
                <div className="container content">
                  <h2>Claim your KMD rewards on your {this.state.vendor === 'ledger' ? 'Ledger' : 'Trezor'} device.</h2>
                  {this.state.vendor === 'ledger' &&
                    <p>Make sure the KMD app and firmware on your Ledger are up to date, then connect your Ledger, open the KMD app, and click the "Check Rewards" button.</p>
                  }
                  {this.state.vendor === 'trezor' &&
                    <p>Make sure the firmware on your Trezor are up to date, then connect your Trezor and click the "Check Rewards" button. Please be aware that you'll need to allow popup windows for Trezor to work properly.</p>
                  }
                  <p>Also, make sure that your {this.state.vendor === 'ledger' ? 'Ledger' : 'Trezor'} is initialized prior using <strong>KMD Rewards Claim tool</strong>.</p>
                </div>
                <img className="hw-graphic" src={`${this.state.vendor}-logo.png`} alt={this.state.vendor === 'ledger' ? 'Ledger' : 'Trezor'} />
              </React.Fragment>
            ) : (
              <Accounts {...this.state} />
            )}
          </section>

          <WarnU2fCompatibility vendor={this.state.vendor} />

          <Footer>
            <p>
              <strong>{this.state.vendor === 'ledger' ? 'Ledger' : 'Trezor'} KMD Rewards Claim</strong> by  and <a target="_blank" rel="noopener noreferrer" href="https://github.com/komodoplatform">Komodo Platform</a>.
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
