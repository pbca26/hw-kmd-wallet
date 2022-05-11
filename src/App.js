import 'babel-polyfill';
import React from 'react';
import {hot} from 'react-hot-loader';
import BetaWarning from './BetaWarning';
import Accounts from './Accounts';
import WarnBrowser from './WarnBrowser';
import ConnectionError from './ConnectionError';
import FirmwareCheckModal from './FirmwareCheckModal';
import appInfo from '../package.json';
import './App.scss';
import hw from './lib/hw';
import {
  getLocalStorageVar,
  setLocalStorageVar,
  resetLocalStorage,
  setLocalStoragePW,
  decodeStoredData,
} from './lib/localstorage-util';
import {
  voteCoin,
  testCoins,
} from './constants';
import blockchain, {setBlockchainAPI, blockchainAPI} from './lib/blockchain';
import {isMobile} from 'react-device-detect';
import {
  isElectron,
  appData,
  ipcRenderer,
  helpers,
} from './Electron';
import {writeLog} from './Debug';
import initSettings from './lib/init-settings';
import CoinsSelector from './CoinsSelector';
import DashboardOperations from './DashboardOperations';
import DashboardPrices from './DashboardPrices';
import HWFirmwareRequirements from './HWFirmwareRequirementsModal';
import Sidebar from './Sidebar';
import LoginModal from './LoginModal';
import {DesktopDownloadButton, HeaderNonAuth, HeaderAuth, VendorSelector, VendorImage} from './AppFragments';
import {getPrices} from './lib/prices';
import {checkTipTime, handleScanData, emptyAccountState, removeCoin, scanCoins, getAppInitState} from './app-helpers';

// TODO: receive modal, tos modal, move api end point conn test to blockchain module
let syncDataInterval, autoLogoutTimer;

class App extends React.Component {
  state = this.initialState;

  get initialState() {
    this.addCoins = this.addCoins.bind(this);
    this.setActiveCoin = this.setActiveCoin.bind(this);
    this.setActiveAccount = this.setActiveAccount.bind(this);
    this.removeCoin = this.removeCoin.bind(this);
    this.isCoinData = this.isCoinData.bind(this);
    this.closeLoginModal = this.closeLoginModal.bind(this);
    this.enableAccount = this.enableAccount.bind(this);
    this.addAccount = this.addAccount.bind(this);
    this.triggerSidebarSizeChange = this.triggerSidebarSizeChange.bind(this);
    this.updateExplorerEndpoint = this.updateExplorerEndpoint.bind(this);

    return getAppInitState();
  }

  triggerSidebarSizeChange() {
    this.setState({
      sidebarSizeChanged: !this.state.sidebarSizeChanged,
    });
  }

  closeLoginModal(pw) {
    const self = this;

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
      isAuth: true,
      coins: getLocalStorageVar('coins') ? getLocalStorageVar('coins') : {},
      lastOperations: getLocalStorageVar('lastOperations') && Array.isArray(getLocalStorageVar('lastOperations')) ? getLocalStorageVar('lastOperations') : [],
      theme: getLocalStorageVar('settings') && getLocalStorageVar('settings').theme ? getLocalStorageVar('settings').theme : 'tdark',
      vendor: getLocalStorageVar('settings') && getLocalStorageVar('settings').vendor ? getLocalStorageVar('settings').vendor : null,
    });
    
    this.setupAutoLock();
    document.getElementById('body')
    .addEventListener('click', function() {
      //writeLog('add global click event to handle autolock');
      
      self.setupAutoLock();
    });

    setTimeout(() => {
      this.syncData();
    });

    writeLog('coins', getLocalStorageVar('coins'));
  }

  setupAutoLock() {
    if (autoLogoutTimer) {
      clearTimeout(autoLogoutTimer);
    } else {
      if (getLocalStorageVar('settings') &&
          getLocalStorageVar('settings').autolock) {
        writeLog(`set autolock to ${getLocalStorageVar('settings').autolock}s`);
        autoLogoutTimer = setTimeout(() => {
          writeLog('autolock triggered');
          this.resetState('logout');
        }, getLocalStorageVar('settings').autolock * 1000);
      }
    }
  }

  removeCoin(coin) {
    const {lastOperations, coins} = removeCoin(coin, this.state.coins);

    this.setState({
      coins,
      lastOperations,
      activeAccount: null,
      activeCoin: null,
    });

    setLocalStorageVar('coins', coins, true);
    setLocalStorageVar('lastOperations', lastOperations);
  }

  setActiveCoin(activeCoin) {
    this.setState({
      activeCoin,
      activeAccount: null,
    });

    writeLog(activeCoin ? 'none' : this.state.coins[activeCoin]);
  }

  setActiveAccount(activeAccount) {
    writeLog('activeAccount', activeAccount);

    this.setState({
      activeAccount,
    });

    if (activeAccount) writeLog(this.state.coins[this.state.activeCoin][activeAccount])
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

  componentDidMount() {
    // init app data decryption and login if PW is set
    if (isElectron &&
        helpers.getPW()) {
      const _pw = helpers.getPW();
      setLocalStoragePW(_pw);
      decodeStoredData()
      .then(() => {
        this.closeLoginModal(_pw);
      });
    }

    document.title = `Komodo Hardware Wallet (v${appInfo.version})`;
    if (!isElectron || (isElectron && !appData.isNspv)) {
      syncDataInterval = setInterval(() => {
        if (!this.state.syncInProgress) {
          writeLog('auto sync called');
          this.syncData();
        }
      }, 300 * 1000);
    }

    // limit mobile support to ledger webusb only
    if (isMobile) {
      hw.ledger.setLedgerFWVersion('webusb');

      this.setState({
        vendor: 'ledger',
        ledgerDeviceType: 's',
        ledgerFWVersion: 'webusb', 
      });
    }

    if (!hw.trezor.getInitStatus()) {
      hw.trezor.init();
    }

    if (isElectron && appData.blockchainAPI === 'spv'/*&& isElectron.blockchainAPI*/) {
      blockchain[blockchainAPI].setCoin(this.state.coin);
      setBlockchainAPI('spv');
    }
    
    if (isElectron && appData.isNspv) {
      ipcRenderer.on('nspvRecheck', (event, arg) => {
        writeLog('nspvRecheck arg', arg);
        if (!arg.isFirstRun) writeLog('schedule next sync update in 5 min');
        else writeLog('run sync update immediately (first run)');
        
        if (arg.coin === this.state.coin.toLowerCase()) {
          setTimeout(() => {
            writeLog('auto sync called');
            this.syncData();
          }, arg.isFirstRun === true ? 1000 : 300 * 1000);
        }
      });
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
    writeLog(`set ${this.state.coin} api endpoint to ${e.target.value}`);

    let explorerEndpointOverride = this.state.explorerEndpointOverride;
    explorerEndpointOverride[this.state.coin] = e.target.value;

    this.setState({
      explorerEndpointOverride,
    });
  }

  resetState = (clearData) => {
    clearInterval(syncDataInterval);
    this.setVendor();

    if (clearData &&
        clearData !== 'logout') {
      resetLocalStorage();
      document.getElementById('body').removeEventListener('click', null);
    } else if (
      clearData &&
      clearData === 'logout') {
      setLocalStoragePW();
    }
    this.setState(Object.assign({}, this.initialState, {loginModalClosed: false}));
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

  enableAccount(accountIndex) {
    let coins = JSON.parse(JSON.stringify(this.state.coins));

    if (!coins[this.state.activeCoin].accounts[accountIndex].hasOwnProperty('enabled')) coins[this.state.activeCoin].accounts[accountIndex].enabled = true;

    coins[this.state.activeCoin].accounts[accountIndex].enabled = !coins[this.state.activeCoin].accounts[accountIndex].enabled;

    this.setState({
      coins,
    });

    setLocalStorageVar('coins', coins, true);

    setTimeout(() => {
      writeLog('enableAccount', this.state.coins);
    }, 100);
  }

  addAccount(accountIndex, xpub) {
    let coins = JSON.parse(JSON.stringify(this.state.coins));
    coins[this.state.activeCoin].accounts[accountIndex] = emptyAccountState(accountIndex, xpub);

    this.setState({
      coins,
    });

    setLocalStorageVar('coins', coins, true);

    setTimeout(() => {
      writeLog('addAccount', this.state.coins);
    }, 100);
  }

  syncData = async (_coin) => {
    const coinTickers = _coin ? [_coin] : Object.keys(this.state.coins);
    
    getPrices(coinTickers)
    .then((prices) => {
      this.setState({
        prices,
      });
    });

    if (!this.state.isFirstRun || this.isCoinData()) {
      writeLog('sync data called');
      this.setState({
        syncInProgress: true,
      });      

      const {balances, tiptime} = await scanCoins(
        coinTickers,
        blockchain[blockchainAPI],
        this.state.explorerEndpointOverride,
        this.state.vendor,
        this.state.coins,
        getLocalStorageVar('settings') && getLocalStorageVar('settings').historyLength
      );

      writeLog('coin data sync finished', balances);
      
      this.handleScanData({
        coins: balances,
        tiptime,
      });
    }
  }

  handleScanData = ({coins, tiptime}) => {
    const {lastOperations, updatedCoins} = handleScanData(coins, tiptime, this.state.coins);

    tiptime = checkTipTime(tiptime);
    
    this.setState({
      coins: updatedCoins,
      lastOperations,
      tiptime,
      isFirstRun: false,
      syncInProgress: false,
    });

    setLocalStorageVar('coins', updatedCoins, true);
    setLocalStorageVar('lastOperations', lastOperations);
  }

  addCoins(coins) {
    writeLog('main addCoins', coins);

    let currentCoins = this.state.coins;
    for (let i = 0; i < coins.length; i++) {
      currentCoins[coins[i]] = {
        accounts: [],
      };
    }

    this.setState({
      coins: currentCoins,
    });

    setLocalStorageVar('coins', currentCoins, true);

    setTimeout(() => {
      writeLog(this.state)
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

    if (vendor) setLocalStorageVar('settings', {vendor});
  }

  loginStateRender() {
    return (
      <div className={`App isPristine${!isElectron && window.location.href.indexOf('disable-mobile') === -1 ? ' Responsive' : ''}`}>
        <LoginModal
          closeLoginModal={this.closeLoginModal}
          resetState={this.resetState}
          isClosed={this.state.loginModalClosed}
          isAuth={this.state.isAuth}
          triggerSidebarSizeChange={this.triggerSidebarSizeChange}
          setVendor={this.setVendor} />
        <HeaderNonAuth coin={this.state.coin} />
        <input
          type="text"
          id="js-copytextarea" />
        <Sidebar
          isCoinData={this.isCoinData}
          activeCoin={this.state.activeCoin}
          activeAccount={this.state.activeAccount}
          setActiveCoin={this.setActiveCoin}
          setActiveAccount={this.setActiveAccount}
          vendor={this.state.vendor}
          loginModalClosed={this.state.loginModalClosed}
          setVendor={this.state.setVendor}
          resetState={this.resetState}
          isAuth={this.state.isAuth}
          triggerSidebarSizeChange={this.triggerSidebarSizeChange}
          updateExplorerEndpoint={this.updateExplorerEndpoint} />
        <section className={'main main-' + (getLocalStorageVar('settings').sidebarSize || 'short')}>
          <React.Fragment>
            <div className="container content text-center">
              <h2>{this.state.coin === voteCoin ? 'Cast your VOTEs' : 'Manage your coins'} from a hardware wallet device.</h2>
            </div>
            <VendorSelector setVendor={this.setVendor} />
          </React.Fragment>
        </section>

        {!isElectron &&
          <WarnBrowser />
        }
      </div>
    );
  }

  render() {
    if (!this.state.isAuth || (this.state.isAuth && !this.state.vendor)) {
      return this.loginStateRender();
    } else {
      return (
        <div className={`App dashboard ${testCoins.indexOf(this.state.coin) > -1 ? ' testcoins-warning-fix' : ''}${!isElectron && window.location.href.indexOf('disable-mobile') === -1 ? ' Responsive' : ''}`}>
          <HeaderAuth
            coin={this.state.coin}
            vendor={this.state.vendor}
            syncInProgress={this.state.syncInProgress} />
          <input
            type="text"
            id="js-copytextarea" />
          <Sidebar
            isCoinData={this.isCoinData}
            activeCoin={this.state.activeCoin}
            activeAccount={this.state.activeAccount}
            setActiveCoin={this.setActiveCoin}
            setActiveAccount={this.setActiveAccount}
            vendor={this.state.vendor}
            accounts={this.state.activeCoin ? this.state.coins[this.state.activeCoin].accounts : []}
            syncData={this.syncData}
            loginModalClosed={this.state.loginModalClosed}
            setVendor={this.setVendor}
            isAuth={this.state.isAuth}
            resetState={this.resetState}
            triggerSidebarSizeChange={this.triggerSidebarSizeChange}
            updateExplorerEndpoint={this.updateExplorerEndpoint}
            coins={this.state.coins}
            checkTipTime={checkTipTime} />

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

          <section className={`main${testCoins.indexOf(this.state.coin) === -1 ? ' beta-warning-fix' : ''}${' main-' + (getLocalStorageVar('settings').sidebarSize || 'short')}`}>
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
                    checkTipTime={checkTipTime}
                    vendor={this.state.vendor}
                    explorerEndpoint={this.state.explorerEndpoint} />
                  {this.isCoinData() &&
                   window.location.href.indexOf('devmode') > -1 &&
                    <button onClick={() => this.syncData()}>Sync coin data</button>
                  }
                  {this.isCoinData() &&
                    <div className="bottom-blocks">
                      <DashboardPrices
                        prices={this.state.prices}
                        coins={this.state.coins} />
                      <DashboardOperations lastOperations={this.state.lastOperations} />
                    </div>
                  }
                  {!this.isCoinData() &&
                    <div className="container content content-init-hw-vendor">
                      <HWFirmwareRequirements vendor={this.state.vendor} />
                      <VendorImage vendor={this.state.vendor} />
                    </div>
                  }
                  {!isElectron &&
                    <DesktopDownloadButton />
                  }
                </React.Fragment>
              }
            </div>
            {!this.isCoinData() ? (
              <div className="trezor-webusb-container"></div>
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
                    removeCoin={this.removeCoin}
                    enableAccount={this.enableAccount}
                    addAccount={this.addAccount}
                    checkTipTime={checkTipTime} />
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