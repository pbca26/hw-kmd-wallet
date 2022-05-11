import React from 'react';
import hw from './lib/hw';
import accountDiscovery, {clearPubkeysCache} from './lib/account-discovery';
import blockchain, {blockchainAPI} from './lib/blockchain';
import updateActionState from './lib/update-action-state';
import {VENDOR} from './constants';
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
import {getLocalStorageVar} from './lib/localstorage-util';

const headings = [
  'Coin',
  'Balance',
];

let cancel = false;

class CheckAllBalancesButton extends React.Component {
  state = this.initialState;
  
  get initialState() {
    this.confirm = this.confirm.bind(this);

    return {
      isCheckingRewards: false,
      isInProgress: false,
      error: false,
      coin: '',
      balances: [],
      progress: '',
      emptyBalances: false,
      actions: {
        connect: {
          icon: 'fab fa-usb',
          description: this.props.vendor === 'ledger' ? <div>Connect and unlock your Ledger, then open the Komodo app on your device.</div> : <div>Connect and unlock your Trezor.</div>,
          state: null
        },
        approve: {
          icon: 'fas fa-microchip',
          description: <div>Approve all public key export requests on your device. <strong>There will be multiple requests</strong>.</div>,
          state: null
        },
        finished: {
          icon: 'fas fa-check',
          description: <div>All coins are checked.</div>,
          state: null
        },
      },
      isDebug: isElectron ? appData.isDev : window.location.href.indexOf('devmode') > -1,
    };
  }

  resetState = () => {
    cancel = true;
    this.setState(this.initialState);
  }

  scanAddresses = async () => {
    const coinTickers = this.props.coins;
    const {vendor} = this.props;
    let balances = [], currentAction;
    cancel = false;
    
    await asyncForEach(coinTickers, async (coin, index) => {
      if (!cancel) {
        this.setState({
          isCheckingRewards: true,
        });
        
        currentAction = 'connect';
        updateActionState(this, currentAction, 'loading');

        const explorerUrl = await getAvailableExplorerUrl(coin, blockchain[blockchainAPI]);
        let isExplorerEndpointSet = false;

        writeLog(`${coin} set api endpoint to ${explorerUrl}`);
        blockchain[blockchainAPI].setExplorerUrl(explorerUrl);
        isExplorerEndpointSet = true;
    
        this.setState({
          explorerEndpoint: explorerUrl,
        });

        if (isExplorerEndpointSet) {
          this.setState({
            ...this.initialState,
            isCheckingRewards: true,
            coin,
            progress: coinTickers.length > 1 ? ` (${index + 1}/${coinTickers.length})` : '',
            balances,
            isInProgress: true,
          });

          let currentAction;
          try {
            currentAction = 'connect';
            updateActionState(this, currentAction, 'loading');
            const hwIsAvailable = await hw[vendor].isAvailable();
            if (!hwIsAvailable) {
              throw new Error(`${VENDOR[vendor]} device is unavailable!`);
            }
            updateActionState(this, currentAction, true);

            currentAction = 'approve';
            updateActionState(this, currentAction, 'loading');
            let [accounts, tiptime] = await Promise.all([
              accountDiscovery(
                vendor,
                coin,
                null,
                getLocalStorageVar('settings') && getLocalStorageVar('settings').historyLength
              ),
              blockchain[blockchainAPI].getTipTime()
            ]);

            updateActionState(this, currentAction, true);

            if (coin === 'KMD') {
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

            this.setState({
              balances,
              isInProgress: index === coinTickers.length - 1 ? false : true,
            });
          } catch (error) {
            writeLog(error);
            updateActionState(this, currentAction, false);
            this.setState({error: error.message});
          }
        }
      }
    });
    
    if (!cancel) {
      if (!this.state.error ||
          (this.state.error && this.state.error.indexOf('Failed to fetch') > -1)) {
        updateActionState(this, 'approve', true);
        updateActionState(this, 'finished', true);
      }

      clearPubkeysCache();

      this.setState({
        isInProgress: false,
        error: false,
        progress: '',
        coin: '',
        isCheckingRewards: true,
        emptyBalances: !this.state.balances.length,
      });
    }

    writeLog(this.state);
    
    blockchain[blockchainAPI].setExplorerUrl(this.props.explorerEndpoint);
  };

  confirm() {
    this.props.handleScanData({coins: this.state.balances});
    this.props.closeParent();
    this.resetState();
  } 

  renderCoinBalances() {
    const balances = this.state.balances;
    
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

  render() {
    const {
      isCheckingRewards,
      isInProgress,
      actions,
      error,
      coin,
      balances,
      emptyBalances,
      progress,
    } = this.state;
    const {vendor, children} = this.props;

    return (
      <React.Fragment>
        <button
          className="button is-primary"
          onClick={this.scanAddresses}>
          {children}
        </button>
        <ActionListModal
          title={`Scanning Blockchain ${coin}${progress}`}
          isCloseable={!isInProgress}
          actions={actions}
          error={error}
          handleClose={this.resetState}
          show={isCheckingRewards}
          className="Scan-balances-modal"
          childrenPosition="bottom"
          topText={`Exporting public keys from your ${VENDOR[vendor]} device, scanning the blockchain for funds, and calculating any claimable rewards. Please approve any public key export requests on your device.`}>
          {balances &&
           balances.length > 0 &&
            <React.Fragment>{this.renderCoinBalances()}</React.Fragment>
          }
          {emptyBalances &&
            <p>
              <strong>No active balances are found</strong>
            </p>
          }
          {!isInProgress &&
            balances.length > 0 &&
            <button
              className="button is-primary"
              onClick={this.confirm}>
              Confirm
            </button>
          }
        </ActionListModal>
      </React.Fragment>
    );
  }
}

export default CheckAllBalancesButton;
