import 'babel-polyfill';
import React, {useState, useEffect} from 'react';
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
import {checkTipTime, handleScanData, emptyAccountState, removeCoin, scanCoins, getAppInitState, filterEnabledCoins} from './app-helpers';

// TODO: receive modal, tos modal, move api end point conn test to blockchain module
let syncDataInterval, autoLogoutTimer;

const App = props => {
  const initialState = getAppInitState();
  const [state, setState] = useState(initialState);

  const triggerSidebarSizeChange = () => {
    setState(prevState => ({
      ...prevState,
      sidebarSizeChanged: !state.sidebarSizeChanged,
    }));
  }

  const isCoinData = () => {
    const coins = state.coins;

    for (let coin in coins) {
      if (coins[coin].accounts.length) {
        return true;
      }
    }

    return false;
  };

  const processDiscoveryData = ({coins, tiptime}) => {
    const {lastOperations, updatedCoins} = handleScanData(coins, tiptime, state.coins);

    tiptime = checkTipTime(tiptime);
    
    setState(prevState => ({
      ...prevState,
      coins: updatedCoins,
      lastOperations,
      tiptime,
      isFirstRun: false,
      syncInProgress: false,
    }));

    setLocalStorageVar('coins', updatedCoins, true);
    setLocalStorageVar('lastOperations', lastOperations);
  }

  const syncData = async _coin => {
    const coinTickers = _coin ? [_coin] : Object.keys(state.coins);
    
    getPrices(coinTickers)
    .then((prices) => {
      setState(prevState => ({
        ...prevState,
        prices,
      }));
    });

    if (!state.isFirstRun || isCoinData()) {
      writeLog('sync data called');
      setState(prevState => ({
        ...prevState,
        syncInProgress: true,
      }));      

      const {balances, tiptime} = await scanCoins(
        coinTickers,
        blockchain[blockchainAPI],
        state.explorerEndpointOverride,
        state.vendor,
        state.coins,
        getLocalStorageVar('settings') && getLocalStorageVar('settings').historyLength
      );

      writeLog('coin data sync finished', balances);
      
      processDiscoveryData({
        coins: balances,
        tiptime,
      });
    }
  }

  const closeLoginModal = pw => {
    setState(prevState => ({
      ...prevState,
      loginModalClosed: true,
    }));

    initSettings();

    if (!getLocalStorageVar('settings')) {
      setLocalStorageVar('settings', {theme: 'tdark'});
      document.getElementById('body').className = 'tdark';
    } else {
      document.getElementById('body').className = getLocalStorageVar('settings').theme;
    }
    
    setState(prevState => ({
      ...prevState,
      isAuth: true,
      coins: getLocalStorageVar('coins') ? filterEnabledCoins(getLocalStorageVar('coins')) : {},
      lastOperations: getLocalStorageVar('lastOperations') && Array.isArray(getLocalStorageVar('lastOperations')) ? getLocalStorageVar('lastOperations') : [],
      theme: getLocalStorageVar('settings') && getLocalStorageVar('settings').theme ? getLocalStorageVar('settings').theme : 'tdark',
      vendor: getLocalStorageVar('settings') && getLocalStorageVar('settings').vendor ? getLocalStorageVar('settings').vendor : null,
    }));
    
    setupAutoLock();
    document.getElementById('body')
    .addEventListener('click', function() {
      //writeLog('add global click event to handle autolock');
      
      setupAutoLock();
    });

    setState(prevState => ({
      ...prevState,
      syncRunNum: prevState.syncRunNum + 1,
    }));

    writeLog('coins', getLocalStorageVar('coins'));
  }

  const setupAutoLock = () => {
    if (autoLogoutTimer) {
      clearTimeout(autoLogoutTimer);
    } else {
      if (getLocalStorageVar('settings') &&
          getLocalStorageVar('settings').autolock) {
        writeLog(`set autolock to ${getLocalStorageVar('settings').autolock}s`);
        autoLogoutTimer = setTimeout(() => {
          writeLog('autolock triggered');
          resetState('logout');
        }, getLocalStorageVar('settings').autolock * 1000);
      }
    }
  }

  const removeCoinHandler = coin => {
    const {lastOperations, coins} = removeCoin(coin, state.coins);

    setState(prevState => ({
      ...prevState,
      coins,
      lastOperations,
      activeAccount: null,
      activeCoin: null,
    }));

    setLocalStorageVar('coins', coins, true);
    setLocalStorageVar('lastOperations', lastOperations);
  }

  const setActiveCoin = activeCoin => {
    setState(prevState => ({
      ...prevState,
      activeCoin,
      activeAccount: null,
    }));

    writeLog(activeCoin ? 'none' : state.coins[activeCoin]);
  }

  const setActiveAccount = activeAccount => {
    writeLog('activeAccount', activeAccount);

    setState(prevState => ({
      ...prevState,
      activeAccount,
    }));

    if (activeAccount !== null) writeLog(state.coins[state.activeCoin].accounts[activeAccount])
  }

  const onMount = () => {
    // init app data decryption and login if PW is set
    if (isElectron &&
        helpers.getPW()) {
      const _pw = helpers.getPW();
      setLocalStoragePW(_pw);
      decodeStoredData()
      .then(() => {
        closeLoginModal(_pw);
      });
    }

    document.title = `Komodo Hardware Wallet (v${appInfo.version})`;
    if (!isElectron || (isElectron && !appData.isNspv)) {
      syncDataInterval = setInterval(() => {
        if (!state.syncInProgress) {
          writeLog('auto sync called');
          writeLog('state', state);
          setState(prevState => ({
            ...prevState,
            syncRunNum: prevState.syncRunNum + 1,
          }));
          syncData();
        }
      }, 300 * 1000);
    }

    // limit mobile support to ledger webusb only
    if (isMobile) {
      hw.ledger.setLedgerFWVersion('webusb');

      setState(prevState => ({
        ...prevState,
        vendor: 'ledger',
        ledgerDeviceType: 's',
        ledgerFWVersion: 'webusb', 
      }));
    }

    if (!hw.trezor.getInitStatus()) {
      hw.trezor.init();
    }

    if (isElectron && appData.blockchainAPI === 'spv'/*&& isElectron.blockchainAPI*/) {
      blockchain[blockchainAPI].setCoin(state.coin);
      setBlockchainAPI('spv');
    }
    
    if (isElectron && appData.isNspv) {
      ipcRenderer.on('nspvRecheck', (event, arg) => {
        writeLog('nspvRecheck arg', arg);
        if (!arg.isFirstRun) writeLog('schedule next sync update in 5 min');
        else writeLog('run sync update immediately (first run)');
        
        if (arg.coin === state.coin.toLowerCase()) {
          setTimeout(() => {
            writeLog('auto sync called');
            syncData();
          }, arg.isFirstRun === true ? 1000 : 300 * 1000);
        }
      });
    }
  }

  useEffect(() => {
    onMount();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    syncData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.syncRunNum]);

  /*const updateCoin = e => {
    setState(prevState => ({
      ...prevState,
      accounts: [],
      tiptime: null,
      explorerEndpoint: isElectron && appData.blockchainAPI === 'spv' ? 'default' : null,
      [e.target.name]: e.target.value,
    }));

    setTimeout(() => {
      if (!isElectron || (isElectron && appData.blockchainAPI === 'insight')) checkExplorerEndpoints();
      if (isElectron && appData.blockchainAPI === 'spv') {
        blockchain[blockchainAPI].setCoin(state.coin);
      }
    }, 50);
  }*/

  const updateLedgerDeviceType = type => {
    setState(prevState => ({
      ...prevState,
      'ledgerDeviceType': type,
    }));

    hw.ledger.setLedgerFWVersion('webusb');
  }

  const updateLedgerFWVersion = e => {
    setState(prevState => ({
      ...prevState,
      'ledgerFWVersion': e.hasOwnProperty('target') ? e.target.value : e,
    }));

    hw.ledger.setLedgerFWVersion(e.hasOwnProperty('target') ? e.target.value : e);
  }

  const updateExplorerEndpoint = e => {
    writeLog(`set ${state.coin} api endpoint to ${e.target.value}`);

    let explorerEndpointOverride = state.explorerEndpointOverride;
    explorerEndpointOverride[state.coin] = e.target.value;

    setState(prevState => ({
      ...prevState,
      explorerEndpointOverride,
    }));
  }

  const resetState = clearData => {
    clearInterval(syncDataInterval);
    setVendor();

    if (clearData &&
        clearData !== 'logout') {
      resetLocalStorage();
      document.getElementById('body').removeEventListener('click', null);
    } else if (
      clearData &&
      clearData === 'logout') {
      setLocalStoragePW();
    }
    setState(Object.assign({}, initialState, {loginModalClosed: false}));
    // TODO: auto-close connection after idle time
    hw.ledger.resetTransport();

    // limit mobile support to ledger webusb only
    if (isMobile) {
      setTimeout(() => {
        hw.ledger.setLedgerFWVersion('webusb');

        setState(prevState => ({
          ...prevState,
          vendor: 'ledger',
          ledgerDeviceType: 's',
          ledgerFWVersion: 'webusb',
        }));
      }, 50);
    }
  }

  const enableAccount = accountIndex => {
    let coins = JSON.parse(JSON.stringify(state.coins));

    if (!coins[state.activeCoin].accounts[accountIndex].hasOwnProperty('enabled')) coins[state.activeCoin].accounts[accountIndex].enabled = true;

    coins[state.activeCoin].accounts[accountIndex].enabled = !coins[state.activeCoin].accounts[accountIndex].enabled;

    setState(prevState => ({
      ...prevState,
      coins,
    }));

    setLocalStorageVar('coins', coins, true);

    setTimeout(() => {
      writeLog('enableAccount', state.coins);
    }, 100);
  }

  const addAccount = (accountIndex, xpub) => {
    let coins = JSON.parse(JSON.stringify(state.coins));
    coins[state.activeCoin].accounts[accountIndex] = emptyAccountState(accountIndex, xpub);

    setState(prevState => ({
      ...prevState,
      coins,
    }));

    setLocalStorageVar('coins', coins, true);

    setTimeout(() => {
      writeLog('addAccount', state.coins);
    }, 100);
  }

  const addCoins = coins => {
    writeLog('main addCoins', coins);

    let currentCoins = state.coins;
    for (let i = 0; i < coins.length; i++) {
      currentCoins[coins[i]] = {
        accounts: [],
      };
    }

    setState(prevState => ({
      ...prevState,
      coins: currentCoins,
    }));

    setLocalStorageVar('coins', currentCoins, true);

    setTimeout(() => {
      writeLog(state);
    }, 1000);
  }

  /*const handleRewardClaim = () => {
    // stub
  }*/

  const setVendor = async vendor => {
    if (!isElectron || (isElectron && vendor !== 'ledger')) {
      setState(prevState => ({
        ...prevState,
        vendor
      }));
    } else if (vendor === 'ledger') {
      setState(prevState => ({
        ...prevState,
        vendor: 'ledger',
        ledgerDeviceType: 's',
        ledgerFWVersion: 'webusb',
      }));
    }

    if (vendor) setLocalStorageVar('settings', {vendor});
  }

  const loginStateRender = () => {
    return (
      <div className={`App isPristine${!isElectron && window.location.href.indexOf('disable-mobile') === -1 ? ' Responsive' : ''}`}>
        <LoginModal
          closeLoginModal={closeLoginModal}
          resetState={resetState}
          isClosed={state.loginModalClosed}
          isAuth={state.isAuth}
          triggerSidebarSizeChange={triggerSidebarSizeChange}
          setVendor={setVendor} />
        <HeaderNonAuth coin={state.coin} />
        <input
          type="text"
          id="js-copytextarea" />
        <Sidebar
          isCoinData={isCoinData}
          activeCoin={state.activeCoin}
          activeAccount={state.activeAccount}
          setActiveCoin={setActiveCoin}
          setActiveAccount={setActiveAccount}
          vendor={state.vendor}
          loginModalClosed={state.loginModalClosed}
          setVendor={state.setVendor}
          resetState={resetState}
          isAuth={state.isAuth}
          triggerSidebarSizeChange={triggerSidebarSizeChange}
          updateExplorerEndpoint={updateExplorerEndpoint} />
        <section className={'main main-' + (getLocalStorageVar('settings').sidebarSize || 'short')}>
          <React.Fragment>
            <div className="container content text-center">
              <h2>{state.coin === voteCoin ? 'Cast your VOTEs' : 'Manage your coins'} from a hardware wallet device.</h2>
            </div>
            <VendorSelector setVendor={setVendor} />
          </React.Fragment>
        </section>

        {!isElectron &&
          <WarnBrowser />
        }
      </div>
    );
  }

  const render = () => {
    if (!state.isAuth || (state.isAuth && !state.vendor)) {
      return loginStateRender();
    } else {
      return (
        <div className={`App dashboard ${testCoins.indexOf(state.coin) > -1 ? ' testcoins-warning-fix' : ''}${!isElectron && window.location.href.indexOf('disable-mobile') === -1 ? ' Responsive' : ''}`}>
          <HeaderAuth
            coin={state.coin}
            vendor={state.vendor}
            syncInProgress={state.syncInProgress} />
          <input
            type="text"
            id="js-copytextarea" />
          <Sidebar
            isCoinData={isCoinData}
            activeCoin={state.activeCoin}
            activeAccount={state.activeAccount}
            setActiveCoin={setActiveCoin}
            setActiveAccount={setActiveAccount}
            vendor={state.vendor}
            accounts={state.activeCoin ? state.coins[state.activeCoin].accounts : []}
            syncData={syncData}
            loginModalClosed={state.loginModalClosed}
            setVendor={setVendor}
            isAuth={state.isAuth}
            resetState={resetState}
            triggerSidebarSizeChange={triggerSidebarSizeChange}
            updateExplorerEndpoint={updateExplorerEndpoint}
            coins={state.coins}
            checkTipTime={checkTipTime} />

          {state.explorerEndpoint === false &&
            <ConnectionError />
          }

          {getLocalStorageVar('settings') && getLocalStorageVar('settings').fwCheck &&
            (!isElectron || (isElectron && !appData.noFWCheck)) &&
            <FirmwareCheckModal
              vendor={state.vendor}
              updateLedgerDeviceType={updateLedgerDeviceType}
              updateLedgerFWVersion={updateLedgerFWVersion} />
          }

          <section className={`main${testCoins.indexOf(state.coin) === -1 ? ' beta-warning-fix' : ''}${' main-' + (getLocalStorageVar('settings').sidebarSize || 'short')}`}>
            <div className="container content text-center">
              {testCoins.indexOf(state.coin) === -1 &&
                <BetaWarning />
              }
              {!state.activeCoin &&
                <React.Fragment>
                  <CoinsSelector
                    coins={state.coins}
                    addCoins={addCoins}
                    setActiveCoin={setActiveCoin}
                    handleScanData={processDiscoveryData}
                    checkTipTime={checkTipTime}
                    vendor={state.vendor}
                    explorerEndpoint={state.explorerEndpoint} />
                  {isCoinData() &&
                   window.location.href.indexOf('devmode') > -1 &&
                    <button onClick={() => syncData()}>Sync coin data</button>
                  }
                  {isCoinData() &&
                    <div className="bottom-blocks">
                      <DashboardPrices
                        prices={state.prices}
                        coins={state.coins} />
                      <DashboardOperations lastOperations={state.lastOperations} />
                    </div>
                  }
                  {!isCoinData() &&
                    <div className="container content content-init-hw-vendor">
                      <HWFirmwareRequirements vendor={state.vendor} />
                      <VendorImage vendor={state.vendor} />
                    </div>
                  }
                  {!isElectron &&
                    <DesktopDownloadButton />
                  }
                </React.Fragment>
              }
            </div>
            {!isCoinData() ? (
              <div className="trezor-webusb-container"></div>
            ) : (
              <React.Fragment>
                {state.coins &&
                 state.activeCoin &&
                 state.coins[state.activeCoin] &&
                 state.coins[state.activeCoin].accounts &&
                  <Accounts
                    {...state}
                    setActiveAccount={setActiveAccount}
                    syncData={syncData}
                    removeCoin={removeCoinHandler}
                    enableAccount={enableAccount}
                    addAccount={addAccount}
                    checkTipTime={checkTipTime} />
                }
              </React.Fragment>
            )}
          </section>
        </div>
      );
    }
  }

  return render();
}

export default hot(module)(App);