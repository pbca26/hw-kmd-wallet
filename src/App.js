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
} from './lib/localstorage-util';
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
import {isMobile, osName} from 'react-device-detect';
import {
  isElectron,
  appData,
  ipcRenderer,
} from './Electron';
import initSettings from './lib/init-settings';
import asyncForEach from './lib/async';
import {sortTransactions} from './lib/sort';
import CoinsSelector from './CoinsSelector';
import DashboardOperations from './DashboardOperations';
import DashboardPrices from './DashboardPrices';
import HWFirmwareRequirements from './HWFirmwareRequirementsModal';
import Sidebar from './Sidebar';
import LoginModal from './LoginModal';

// TODO: receive modal, tos modal, move api end point conn test to blockchain module
const MAX_TIP_TIME_DIFF = 3600 * 24;

class App extends React.Component {
  state = this.initialState;

  get initialState() {
    this.addCoins = this.addCoins.bind(this);
    this.setActiveCoin = this.setActiveCoin.bind(this);
    this.setActiveAccount = this.setActiveAccount.bind(this);
    this.removeCoin = this.removeCoin.bind(this);
    this.isCoinData = this.isCoinData.bind(this);
    this.closeLoginModal = this.closeLoginModal.bind(this);

    return {
      accounts: [],
      tiptime: null,
      explorerEndpoint: 'default',
      vendor: null,
      isFirstRun: true,
      ledgerDeviceType: null,
      ledgerFWVersion: 'webusb',
      coin: 'KMD',
      activeCoin: null,
      activeAccount: null,
      loginModalClosed: false,
      coins: {},
      lastOperations: [],
      theme: 'tdark',
      //coins: getLocalStorageVar('coins') ? getLocalStorageVar('coins') : {},
      //lastOperations: getLocalStorageVar('lastOperations') ? getLocalStorageVar('lastOperations') : [],
      //theme: getLocalStorageVar('settings') && getLocalStorageVar('settings').theme ? getLocalStorageVar('settings').theme : 'tdark',
    };
  }

  closeLoginModal(pw) {
    this.setState({
      loginModalClosed: true,
    });

    initSettings();

    if (!getLocalStorageVar('settings')) {
      setLocalStorageVar('settings', {theme: 'tdark'});
      document.getElementById('body').className = 'tdark';
    } else {
      document.getElementById('body').className = getLocalStorageVar('settings').theme;
    }

    this.setState({
      coins: getLocalStorageVar('coins') ? getLocalStorageVar('coins') : {},
      lastOperations: getLocalStorageVar('lastOperations') ? getLocalStorageVar('lastOperations') : [],
      theme: getLocalStorageVar('settings') && getLocalStorageVar('settings').theme ? getLocalStorageVar('settings').theme : 'tdark',
    });

    setTimeout(() => {
      this.syncData();
    });
  }

  removeCoin(coin) {
    let lastOperations = [];
    let coins = this.state.coins;
    delete coins[coin];

    for (let coin in coins) {
      for (let j = 0; j < coins[coin].accounts.length; j++) {
        for (let a = 0; a < coins[coin].accounts[j].history.historyParsed.length; a++) {
          lastOperations.push({
            coin: coin,
            type: coins[coin].accounts[j].history.historyParsed[a].type,
            date: coins[coin].accounts[j].history.historyParsed[a].date,
            amount: coins[coin].accounts[j].history.historyParsed[a].amount,
            txid: coins[coin].accounts[j].history.historyParsed[a].txid,
            timestamp: coins[coin].accounts[j].history.historyParsed[a].timestamp,
          });
        }
      }
    }

    lastOperations = sortTransactions(lastOperations, 'timestamp').slice(0, 3);

    this.setState({
      coins,
      lastOperations,
      activeAccount: null,
      activeCoin: null,
    });

    setLocalStorageVar('coins', coins);
    setLocalStorageVar('lastOperations', lastOperations);
  }

  setActiveCoin(activeCoin) {
    this.setState({
      activeCoin,
      activeAccount: null,
    });

    console.warn(this.state.coins[activeCoin])
  }

  setActiveAccount(activeAccount) {
    console.warn('activeAccount', activeAccount);

    this.setState({
      activeAccount,
    });

    if (activeAccount) console.warn(this.state.coins[this.state.activeCoin][activeAccount])
  }

  isCoinData() {
    const coins = this.state.coins;

    for (let coin in coins) {
      if (coins[coin].accounts.length) {
        return true;
      }
    }

    return false;
  }

  componentWillMount() {
    document.title = `Komodo Hardware Wallet (v${version})`;
    if (!isElectron || (isElectron && !appData.isNspv)) {
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

    // limit mobile support to ledger webusb only
    if (isMobile) {
      hw.ledger.setLedgerFWVersion('webusb');

      this.setState({
        vendor: 'ledger',
        ledgerDeviceType: 's',
        ledgerFWVersion: 'webusb',
      });
    }

    hw.trezor.init();

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

    hw.ledger.setLedgerFWVersion('webusb');
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

  calculateRewardData = ({accounts, tiptime}) => accounts.map(account => {
    account.balance = account.utxos.reduce((balance, utxo) => balance + utxo.satoshis, 0);
    account.rewards = account.utxos.reduce((rewards, utxo) => rewards + getKomodoRewards({tiptime, ...utxo}), 0);
    account.claimableAmount = account.rewards - TX_FEE * 2;

    return account;
  });

  syncData = async (_coin) => {
    if (!this.state.isFirstRun || this.isCoinData()) {
      console.warn('sync data called');

      const coinTickers = _coin ? [_coin] : Object.keys(this.state.coins);
      const coins = apiEndpoints;
      let balances = [];
      
      await asyncForEach(coinTickers, async (coin, index) => {
        console.warn(coin)
        const getInfoRes = await Promise.all(coins[coin].api.map((value, index) => {
          return blockchain[blockchainAPI].getInfo(value);
        }));
        let isExplorerEndpointSet = false;
        let longestBlockHeight = 0;
        let apiEndPointIndex = 0;
    
        console.warn('checkExplorerEndpoints', getInfoRes);
        
        for (let i = 0; i < coins[coin].api.length; i++) {
          if (getInfoRes[i] &&
              getInfoRes[i].hasOwnProperty('info') &&
              getInfoRes[i].info.hasOwnProperty('version')) {
            if (getInfoRes[i].info.blocks > longestBlockHeight) {
              longestBlockHeight = getInfoRes[i].info.blocks;
              apiEndPointIndex = i;
            }
          }
        }

        console.warn(`${coin} set api endpoint to ${coins[coin].api[apiEndPointIndex]}`);
        blockchain[blockchainAPI].setExplorerUrl(coins[coin].api[apiEndPointIndex]);
        isExplorerEndpointSet = true;
    
        this.setState({
          explorerEndpoint: coins[coin].api[apiEndPointIndex],
        });

        if (isExplorerEndpointSet) {
          console.warn('app vendor', this.state.vendor);
          let [accounts, tiptime] = await Promise.all([
            accountDiscovery(this.state.vendor, coin, this.state.coins[coin].accounts),
            blockchain[blockchainAPI].getTipTime()
          ]);

          tiptime = this.checkTipTime(tiptime);

          accounts = this.calculateRewardData({accounts, tiptime});

          let balanceSum = 0;
          let rewardsSum = 0;

          for (let i = 0; i < accounts.length; i++) {
            balanceSum += accounts[i].balance;
            rewardsSum += accounts[i].rewards; 
          }

          balances.push({
            coin,
            balance: balanceSum,
            rewards: rewardsSum,
            accounts,
          });

          if (index === coinTickers.length - 1) {
            console.warn('coin data sync finished', balances);
            
            this.handleScanData({
              coins: balances,
              tiptime,
            })
          }
        }
      });
    }
  }

  handleScanData = ({coins, tiptime}) => {
    let newCoins = coins;
    let lastOperations = [];
    coins = this.state.coins;

    for (var i = 0; i < newCoins.length; i++) {
      coins[newCoins[i].coin] = newCoins[i];
    }
    
    for (let coin in coins) {
      for (let j = 0; j < coins[coin].accounts.length; j++) {
        for (let a = 0; a < coins[coin].accounts[j].history.historyParsed.length; a++) {
          lastOperations.push({
            coin: coin,
            type: coins[coin].accounts[j].history.historyParsed[a].type,
            date: coins[coin].accounts[j].history.historyParsed[a].date,
            amount: coins[coin].accounts[j].history.historyParsed[a].amount,
            txid: coins[coin].accounts[j].history.historyParsed[a].txid,
            timestamp: coins[coin].accounts[j].history.historyParsed[a].timestamp,
          });
        }
      }
    }

    console.warn('lastops', lastOperations);
    console.warn(newCoins);
    console.warn(coins);  
    
    lastOperations = sortTransactions(lastOperations, 'timestamp').slice(0, 3);

    tiptime = this.checkTipTime(tiptime);
    
    this.setState({
      coins,
      lastOperations,
      tiptime,
      isFirstRun: false,
    });

    setLocalStorageVar('coins', coins);
    setLocalStorageVar('lastOperations', lastOperations);
  }

  addCoins(coins) {
    console.warn('main addCoins', coins);

    let currentCoins = this.state.coins;
    for (let i = 0; i < coins.length; i++) {
      currentCoins[coins[i]] = {
        accounts: [],
      };
    }

    this.setState({
      coins: currentCoins,
    });

    setLocalStorageVar('coins', currentCoins);

    setTimeout(() => {
      console.warn(this.state)
    }, 1000)
  }

  handleRewardClaim() {
    // stub
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
        <LoginModal
          closeLoginModal={this.closeLoginModal}
          isClosed={this.state.loginModalClosed} />
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
              {/*<SettingsModal
                updateExplorerEndpoint={this.updateExplorerEndpoint}
                coin={this.state.coin}
              explorerEndpoint={this.state.explorerEndpoint} />*/}
            {/*<button
              className="button is-primary add-pwa-button"
              style={{'display': 'none'}}>Add to home screen</button>*/}
            </h1>
          </div>
        </Header>
        <Sidebar
          isCoinData={this.isCoinData}
          activeCoin={this.state.activeCoin}
          activeAccount={this.state.activeAccount}
          setActiveCoin={this.setActiveCoin}
          setActiveAccount={this.setActiveAccount}
          vendor={this.state.vendor}
          loginModalClosed={this.state.loginModalClosed} />
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
      </div>
    );
  }

  render() {
    if (!this.state.vendor) {
      return this.vendorSelectorRender();
    } else {
      return (
        <div className={`App dashboard ${testCoins.indexOf(this.state.coin) > -1 ? ' testcoins-warning-fix' : ''}${!isElectron && window.location.href.indexOf('disable-mobile') === -1 ? ' Responsive' : ''}`}>
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
                {/*<SettingsModal
                  updateExplorerEndpoint={this.updateExplorerEndpoint}
                  coin={this.state.coin} 
                explorerEndpoint={this.state.explorerEndpoint} />*/}
              </h1>
            </div>
          </Header>
          <Sidebar
            isCoinData={this.isCoinData}
            activeCoin={this.state.activeCoin}
            activeAccount={this.state.activeAccount}
            setActiveCoin={this.setActiveCoin}
            setActiveAccount={this.setActiveAccount}
            vendor={this.state.vendor}
            accounts={this.state.activeCoin ? this.state.coins[this.state.activeCoin].accounts : []}
            syncData={this.syncData}
            handleRewardClaim={this.handleRewardClaim}
            loginModalClosed={this.state.loginModalClosed} />

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
            <div className="container content text-center">
              {testCoins.indexOf(this.state.coin) === -1 &&
                <BetaWarning />
              }
              {!this.state.activeCoin &&
                <React.Fragment>
                  <CoinsSelector
                    coins={this.state.coins}
                    addCoins={this.addCoins}
                    setActiveCoin={this.setActiveCoin}
                    handleScanData={this.handleScanData}
                    checkTipTime={this.checkTipTime}
                    vendor={this.state.vendor}
                    explorerEndpoint={this.state.explorerEndpoint} />
                  {this.isCoinData() &&
                   window.location.href.indexOf('devmode') > -1 &&
                    <button onClick={() => this.syncData()}>Sync coin data</button>
                  }
                  {this.isCoinData() &&
                    <div className="bottom-blocks">
                      <DashboardPrices />
                      <DashboardOperations lastOperations={this.state.lastOperations} />
                    </div>
                  }
                </React.Fragment>
              }
            </div>
            {!this.isCoinData() ? (
              <React.Fragment>
                <div className="container content">
                  <HWFirmwareRequirements vendor={this.state.vendor} />
                </div>
                <img
                  className="hw-graphic"
                  src={`${this.state.vendor}-logo.png`}
                  alt={VENDOR[this.state.vendor]} />
                <div className="trezor-webusb-container"></div>
                {/*!isMobile &&
                 this.state.vendor === 'ledger' &&
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
                  */}
              </React.Fragment>
            ) : (
              <React.Fragment>
                {this.state.coins &&
                this.state.activeCoin &&
                this.state.coins[this.state.activeCoin] &&
                this.state.coins[this.state.activeCoin].accounts &&
                  <Accounts
                    {...this.state}
                    setActiveAccount={this.setActiveAccount}
                    syncData={this.syncData}
                    removeCoin={this.removeCoin} />
                }
              </React.Fragment>
            )}
          </section>
        </div>
      );
    }
  }
}

export default hot(module)(App);