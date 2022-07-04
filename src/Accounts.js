import React from 'react';
import Transactions from './Transactions';
import {CACHE_MAX_LIFETIME} from './constants';
import humanReadableSatoshis from './lib/human-readable-satoshis';
import ClaimRewardsButton from './ClaimRewardsButton';
import CoinSettingsModal from './CoinSettingsModal';
import UtxosModal from './UtxosModal';
import {
  isElectron,
  shell,
} from './Electron';
import {writeLog} from './Debug';
import coinsList from './lib/coins';
import {checkTimestamp} from './lib/time';
import './Accounts.scss';
import './Account.scss';

const Account = props => {
  const render = () => {
    const {
      account,
      coin,
      setActiveAccount,
      activeAccount,
    } = props;
    const {
      accountIndex,
      utxos,
      history,
      balance,
      claimableAmount,
    } = account;
    
    writeLog('account', account);
    writeLog('utxos', utxos);
    writeLog('history', history);

    return (
      <tr
        key={`operations-${accountIndex + 1}`}
        onClick={() => setActiveAccount(accountIndex)}
        className={(activeAccount !== null && accountIndex === activeAccount) || activeAccount === null ? (activeAccount === null ? '' : 'no-hover') : 'hidden'}>
        <td>
          <div className="coin-icons-wrapper-container">
            <div className={`coin-icons-wrapper ${coin}-icon-size-sm`}>
              <div
                className={`coin-icons ${coin}`}
                style={{backgroundImage: `url('${process.env.NODE_ENV === 'development' ? process.env.PUBLIC_URL + '/' : ''}coin-icons.png')`}}></div>
            </div>
          </div>
          <span className="account-name">{coin} {accountIndex + 1}</span>
        </td>
        <td>
          <span className="amount">{balance > 0 ? humanReadableSatoshis(balance) : ''}</span>
        </td>
        {coin === 'KMD' &&
          <td>
            <span className="rewards">{balance > 0 && claimableAmount > 0 ? humanReadableSatoshis(claimableAmount) : ''}</span>
            {account.isRewardsOverdue &&
              <span
                className="kmd-rewards-account-overdue-badge"
                title="Rewards claim overdue!">
              <i>!</i>
              </span>
            }
          </td>
        }
      </tr>
    );
  }

  return render();
}

const Accounts = ({
  coins,
  activeCoin,
  tiptime,
  vendor,
  syncData,
  coin,
  setActiveAccount,
  activeAccount,
  removeCoin,
  enableAccount,
  checkTipTime,
}) => (
  <div className="container content">
    <div className="accounts-block">
      <h4>
        {activeAccount !== null ? 'Account details' : 'Accounts' }
      </h4>
      {activeAccount === null &&
        <CoinSettingsModal
          activeCoin={activeCoin}
          removeCoin={removeCoin}
          syncData={syncData}
          enableAccount={enableAccount}
          accounts={coins[activeCoin].accounts} />
      }
      <div className="accounts">
        <table>
          <thead>
            <tr>
              <th>{activeAccount !== null ? '' : 'Account'}</th>
              <th>Balance</th>
              {activeCoin === 'KMD' &&
                <th>Rewards</th>
              }
            </tr>
          </thead>
          <tbody>
            {coins[activeCoin].accounts.filter(acc => acc.enabled).map(account => (
              <Account
                key={account.accountIndex}
                account={account}
                tiptime={tiptime}
                vendor={vendor}
                syncData={syncData}
                coin={activeCoin}
                activeAccount={activeAccount}
                setActiveAccount={setActiveAccount} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
    {coinsList[activeCoin].airdrop &&
      <div className="accounts-airdop-helper-link">
        {isElectron &&
          <a
            href="!#"
            onClick={() => shell.openExternal('https://github.com/pbca26/hw-kmd-wallet/wiki/How-to-use-address-discovery-options-to-claim-airdrop-coins')}>Unable to find airdrop coins?</a>
        }
        {!isElectron &&
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://github.com/pbca26/hw-kmd-wallet/wiki/How-to-use-address-discovery-options-to-claim-airdrop-coins">Unable to find airdrop coins?</a>
        }
      </div>
    }
    {activeCoin === 'KMD' &&
     activeAccount !== null &&
     coins[activeCoin].accounts[activeAccount].balance > 0 &&
     coins[activeCoin].accounts[activeAccount].enabled &&
      <div className="text-center">
        {coins[activeCoin].accounts[activeAccount].claimableAmount > 0 &&
          <ClaimRewardsButton
            account={coins[activeCoin].accounts[activeAccount]}
            vendor={vendor}
            balance={coins[activeCoin].accounts[activeAccount].balance}
            syncData={syncData}
            coin={coin}
            tiptime={tiptime}
            isClaimRewardsOnly={true}
            disabled={
              !coins[activeCoin].lastChecked ||
              (coins[activeCoin].lastChecked && checkTimestamp(coins[activeCoin].lastChecked) > CACHE_MAX_LIFETIME)
            }
            claimableAmount={coins[activeCoin].accounts[activeAccount].claimableAmount}
            checkTipTime={checkTipTime} />
        }
        <UtxosModal
          utxos={coins[activeCoin].accounts[activeAccount].utxos}
          tiptime={tiptime} />
      </div>
    }
    <Transactions
      accounts={coins[activeCoin].accounts.filter(acc => acc.enabled)}
      activeAccount={activeAccount}
      coin={activeCoin} />
  </div>
);

export default Accounts;
