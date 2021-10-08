import React from 'react';
import Transactions from './Transactions';
import SendCoinButton from './SendCoinButton';
import ReceiveCoinButton from './ReceiveCoinButton';
import {TX_FEE} from './constants';
import humanReadableSatoshis from './lib/human-readable-satoshis';
import ClaimRewardsButton from './ClaimRewardsButton';
import CoinSettingsModal from './CoinSettingsModal';
import UtxosModal from './UtxosModal';
import './Accounts.scss';
import './Account.scss';
import {
  isElectron,
  appData,
} from './Electron';

// TODO: add a way to remove/add accounts

class Account extends React.Component {
  state = this.initialState;

  get initialState() {
    this.updateInput = this.updateInput.bind(this);

    return {
      isClaimed: false,
      claimTxid: null,
      address: '',
      amount: '',
      sendTo: '',
      // debug options
      showXpub: null,
      isDebug: isElectron ? appData.isDev : window.location.href.indexOf('enable-verify') > -1,
    };
  }

  updateInput(e) {
    if (e.target.name === 'sendTo') {
      e.target.value = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
    } else if (e.target.name === 'amount') {
      e.target.value = e.target.value.replace(/[^0-9.]/g, '');
    }

    this.setState({
      [e.target.name]: e.target.value,
    });
  }

  setSendToMaxAmount(balance) {
    this.setState({
      amount: humanReadableSatoshis(balance),
    });
  }

  /*handleRewardClaim = txid => {
    this.setState({
      isClaimed: true,
      claimTxid: txid,
      showXpub: null,
    });
  };*/

  showXpub(index) {
    this.setState({
      showXpub: index === this.state.showXpub ? null : index,
    });
  }

  render() {
    const {
      account,
      tiptime,
      vendor,
      coin,
      setActiveAccount,
      activeAccount,
    } = this.props;
    const {
      accountIndex,
      utxos,
      history,
      balance,
      claimableAmount,
      xpub,
    } = account;

    console.warn('account', account);

    const {isClaimed} = this.state;

    console.warn('utxos', utxos);
    console.warn('history', history);

    return (
      <tr
        key={`operations-${accountIndex + 1}`}
        onClick={() => setActiveAccount(accountIndex)}
        className={activeAccount !== null && accountIndex === activeAccount || activeAccount === null ? (activeAccount === null ? '' : 'no-hover') : 'hidden'}>
        <td>
          <img src={`coins/${coin}.png`} />
          <span className="account-name">{coin} {accountIndex + 1}</span>
        </td>
        <td>
          <span className="amount">{balance > 0 ? humanReadableSatoshis(balance) : ''}</span>
        </td>
        {coin === 'KMD' &&
          <td>
            <span className="rewards">{balance > 0 && claimableAmount > 0 ? humanReadableSatoshis(claimableAmount) : ''}</span>
          </td>
        }
      </tr>
    );
  }
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
          syncData={syncData} />
      }
      <div className="accounts">
        <table>
          <thead>
            <tr>
              <th>{activeAccount !== null ? '' : 'Account'}</th>
              <th>Amount</th>
              {activeCoin === 'KMD' &&
                <th>Rewards</th>
              }
            </tr>
          </thead>
          <tbody>
            {coins[activeCoin].accounts.map((account) => (
              <Account
                key={account.accountIndex}
                account={account}
                tiptime={tiptime}
                vendor={vendor}
                syncData={syncData}
                coin={activeCoin}
                activeAccount={activeAccount}
                setActiveAccount={setActiveAccount}
                />
            ))}
          </tbody>
        </table>
      </div>
    </div>
    {activeCoin === 'KMD' &&
     activeAccount !== null &&
     coins[activeCoin].accounts[activeAccount].balance > 0 &&
      <div className="text-center">
        {coins[activeCoin].accounts[activeAccount].claimableAmount > 0 &&
          <ClaimRewardsButton
            account={coins[activeCoin].accounts[activeAccount]}
            handleRewardClaim={this.handleRewardClaim}
            vendor={vendor}
            balance={coins[activeCoin].accounts[activeAccount].balance}
            syncData={syncData}
            coin={coin}
            tiptime={tiptime}
            isClaimRewardsOnly={true}
            claimableAmount={coins[activeCoin].accounts[activeAccount].claimableAmount} />
        }
        <UtxosModal
          utxos={coins[activeCoin].accounts[activeAccount].utxos}
          tiptime={tiptime} />
      </div>
    }
    <Transactions
      accounts={coins[activeCoin].accounts}
      activeAccount={activeAccount}
      coin={activeCoin}
      />
  </div>
);

export default Accounts;
