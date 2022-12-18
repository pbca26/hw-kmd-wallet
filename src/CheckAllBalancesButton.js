import React, {useState, useEffect} from 'react';
import hw from './lib/hw';
import accountDiscovery, {clearPubkeysCache, setConfigVar} from './lib/account-discovery';
import blockchain, {blockchainAPI} from './lib/blockchain';
import updateActionState from './lib/update-action-state';
import {VENDOR, SETTINGS} from './constants';
import ActionListModal from './ActionListModal';
import asyncForEach from './lib/async';
import humanReadableSatoshis from './lib/human-readable-satoshis';
import {
  isElectron,
  appData,
} from './Electron';
import {writeLog} from './Debug';
import {getAvailableExplorerUrl} from './send-coin-helpers';
import {checkTipTime, calculateRewardData, calculateBalanceData, checkRewardsOverdue} from './app-helpers';
import {getLocalStorageVar, setLocalStorageVar} from './lib/localstorage-util';
import Translate, {t} from './Translate';

const headings = [
  t('check_balances_modal_coin'),
  t('check_balances_modal_balance'),
];

const CheckAllBalancesButton = props => {
  let cancel = false;
  const initialState = {
    isCheckingRewards: false,
    isInProgress: false,
    error: false,
    index: null,
    total: 0,
    coin: '',
    balances: [],
    progress: '',
    emptyBalances: false,
    actions: {
      connect: {
        icon: 'fab fa-usb',
        description: props.vendor === 'ledger' ? <div><Translate name="common_connect_and_unlock_ledger" /></div> : <div><Translate name="common_connect_and_unlock_trezor" /></div>,
        state: null
      },
      approve: {
        icon: 'fas fa-microchip',
        description: <div><Translate name="common_approve_public_key" /> <strong><Translate name="common_multiple_req" /></strong>.</div>,
        state: null
      },
      finished: {
        icon: 'fas fa-check',
        description: <div><Translate name="check_balances_modal_all_checked" /></div>,
        state: null
      },
    },
    isDebug: isElectron ? appData.isDev : window.location.href.indexOf('devmode') > -1,
  };
  const [state, setState] = useState(initialState);

  const resetState = () => {
    cancel = true;
    if (state.isInProgress) {
      setState(prevState => ({
        ...initialState,
        index: props.coins.length,
        total: props.coins.length,
        isCheckingRewards: false,
        isInProgress: false,
      }));
    } else {
      setState(initialState);
    }
  }

  useEffect(() => {
    if (state.error || cancel) processCancelAction();
  }, [state.error, cancel]);

  const processCancelAction = () => {
    if (!cancel) {
      if (!state.error ||
          (state.error && state.error.indexOf('Failed to fetch') > -1)) {
        updateActionState({setState}, 'connect', true);
        updateActionState({setState}, 'approve', true);
        updateActionState({setState}, 'finished', true);

        clearPubkeysCache();

        setState(prevState => ({
          ...prevState,
          isInProgress: false,
          error: false,
          progress: '',
          coin: '',
          isCheckingRewards: true,
          emptyBalances: !prevState.balances.length,
        }));
      } else {
        setState(prevState => ({
          ...prevState,
          isInProgress: false,
          isCheckingRewards: true,
        }));
      }
    }
  }

  const startScan = () => {
    setState(prevState => ({
      ...initialState,
      index: 0,
      total: props.coins.length,
    }));
  }

  useEffect(() => {
    if (state.index !== null) scanAddresses();
  }, [state.index]);

  const scanAddresses = async () => {
    const coinTickers = props.coins;
    const {vendor, enableAirdropDiscovery} = props;
    let balances = state.balances, currentAction;
    cancel = false;
    
    if (enableAirdropDiscovery) {
      setConfigVar('discoveryGapLimit', SETTINGS.DISCOVERY_GAP_LIMIT_AIRDROP);
      setLocalStorageVar('settings', {discoveryGapLimit: SETTINGS.DISCOVERY_GAP_LIMIT_AIRDROP});
    }

    if (state.index < props.coins.length) {
      const index = state.index;
      const coin = coinTickers[index];

      setState(prevState => ({
        ...prevState,
        isCheckingRewards: true,
        coin,
        progress: coinTickers.length > 1 ? ` (${index + 1}/${coinTickers.length})` : '',
      }));
      
      currentAction = 'connect';
      updateActionState({setState}, currentAction, 'loading');

      const explorerUrl = await getAvailableExplorerUrl(coin, blockchain[blockchainAPI]);
      let isExplorerEndpointSet = false;

      if (explorerUrl) {
        writeLog(`${coin} set api endpoint to ${explorerUrl}`);
        blockchain[blockchainAPI].setExplorerUrl(explorerUrl);
        isExplorerEndpointSet = true;
    
        setState(prevState => ({
          ...prevState,
          explorerEndpoint: explorerUrl,
        }));
      }

      if (isExplorerEndpointSet) {
        setState(prevState => ({
          ...prevState,
          isCheckingRewards: true,
          coin,
          progress: coinTickers.length > 1 ? ` (${index + 1}/${coinTickers.length})` : '',
          balances,
          isInProgress: true,
        }));

        let currentAction;
        try {
          currentAction = 'connect';
          updateActionState({setState}, currentAction, 'loading');
          const hwIsAvailable = await hw[vendor].isAvailable();
          if (!hwIsAvailable) {
            throw new Error(t('common_error_device', VENDOR[vendor]));
          }
          updateActionState({setState}, currentAction, true);

          currentAction = 'approve';
          updateActionState({setState}, currentAction, 'loading');
          let accounts = accountDiscovery(
            vendor,
            coin,
            null,
            getLocalStorageVar('settings') && getLocalStorageVar('settings').historyLength
          );

          updateActionState({setState}, currentAction, true);

          if (coin === 'KMD') {
            let tiptime = await blockchain[blockchainAPI].getTipTime();
            tiptime = checkTipTime(tiptime);
            accounts = calculateRewardData({accounts, tiptime});
            writeLog('check if any KMD rewards are overdue');
            accounts = checkRewardsOverdue(accounts);            
          }

          accounts = calculateBalanceData(accounts);

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
            updateActionState({setState}, 'finished', true);
            setState(prevState => ({
              ...prevState,
              balances,
              isInProgress: index === coinTickers.length - 1 ? false : true,
            }));
          } else {
            setState(prevState => ({
              ...prevState,
              balances,
              isInProgress: index === coinTickers.length - 1 ? false : true,
              index: prevState.index + 1,
            }));
          }
        } catch (error) {
          writeLog(error);
          updateActionState({setState}, currentAction, false);
          setState(prevState => ({
            ...prevState,
            error: error.message
          }));
        }
      } else {
        if (index === coinTickers.length - 1) {
          processCancelAction();
        } else {
          setState(prevState => ({
            ...prevState,
            balances,
            index: prevState.index + 1,
            isInProgress: index === coinTickers.length - 1 ? false : true,
          }));
        }
      }
    }
    
    writeLog(state);
    
    blockchain[blockchainAPI].setExplorerUrl(props.explorerEndpoint);
  };

  const confirm = () => {
    props.handleScanData({coins: state.balances});
    props.closeParent();
    resetState();
  } 

  const renderCoinBalances = () => {
    const balances = state.balances;
    
    return (
      <table className="table is-striped">
        <thead>
          <tr>
            {headings.map(heading => <th key={heading}>{heading}</th>)}
          </tr>
        </thead>
        {balances.length > 10 &&
          <tfoot>
            <tr>
              {headings.map(heading => <th key={heading}>{heading}</th>)}
            </tr>
          </tfoot>
        }
        <tbody>
          {balances.map(item => (
            <tr key={item.coin}>
              <th>{item.coin}</th>
              <td>
                {humanReadableSatoshis(item.balance)}{item.rewards ? ` (${humanReadableSatoshis(item.rewards)})` : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  const render = () => {
    const {
      isCheckingRewards,
      isInProgress,
      actions,
      error,
      coin,
      balances,
      emptyBalances,
      progress,
    } = state;
    const {vendor, children} = props;

    return (
      <React.Fragment>
        <button
          className="button is-primary"
          onClick={startScan}>
          {children}
        </button>
        <ActionListModal
          title={`${isInProgress ? t('check_balances_modal_scanning_bc') : t('check_balances_modal_scan_end')} ${isInProgress ? coin : ''}${isInProgress ? progress : ''}`}
          isCloseable={true}
          actions={actions}
          error={error}
          handleClose={resetState}
          show={isCheckingRewards}
          className="Scan-balances-modal"
          childrenPosition="bottom"
          topText={t('check_balances_modal_exporting_keys', VENDOR[vendor])}>
          {balances &&
           balances.length > 0 &&
            <React.Fragment>{renderCoinBalances()}</React.Fragment>
          }
          {emptyBalances &&
            <p>
              <strong><Translate name="check_balances_modal_no_balances" /></strong>
            </p>
          }
          {!isInProgress &&
            balances.length > 0 &&
            <button
              className="button is-primary"
              onClick={confirm}>
              <Translate name="check_balances_modal_confirm" />
            </button>
          }
        </ActionListModal>
      </React.Fragment>
    );
  }

  return render();
}

export default CheckAllBalancesButton;
