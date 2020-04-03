import React from 'react';
import Transactions from './Transactions';
import SendCoinButton from './SendCoinButton';
import ReceiveCoinButton from './ReceiveCoinButton';
import TxidLink from './TxidLink';
import {TX_FEE} from './constants';
import humanReadableSatoshis from './lib/human-readable-satoshis';
import './Accounts.scss';
import './Account.scss';

class Account extends React.Component {
  state = this.initialState;

  get initialState() {
    this.updateInput = this.updateInput.bind(this);

    return {
      isClaimed: false,
      claimTxid: null,
      address: '',
      amount: 0,
      sendTo: '',
      // debug options
      showXpub: null,
      isDebug: window.location.href.indexOf('#enable-verify') > -1,
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
      amount: humanReadableSatoshis(balance - TX_FEE) > 0 ? humanReadableSatoshis(balance - TX_FEE) : humanReadableSatoshis(balance - Math.floor(TX_FEE / 2)),
    });
  }

  handleRewardClaim = txid => {
    this.setState({
      isClaimed: true,
      claimTxid: txid,
      showXpub: null,
    });
  };

  showXpub(index) {
    this.setState({
      showXpub: index === this.state.showXpub ? null : index,
    });
  }

  render() {
    const {account, tiptime, vendor, coin} = this.props;
    const {
      accountIndex,
      utxos,
      history,
      balance,
      rewards,
      claimableAmount,
      serviceFee,
      xpub,
    } = account;

    const isClaimableAmount = (claimableAmount > 0);
    const {isClaimed, claimTxid} = this.state;

    console.warn('utxos', utxos);
    console.warn('history', history);

    return (
      <div className={`Account column is-full ${isClaimed ? 'isclaimed' : ''}`}>
        <div className="box">
          <div className="content">
            <h2>
              Account {accountIndex + 1}
              <div className="balance">
                {humanReadableSatoshis(balance)} {coin}
              </div>
            </h2>
            <ReceiveCoinButton
              account={account}
              vendor={vendor}
              address={this.state.address}
              coin={coin}>
              Receive
            </ReceiveCoinButton>
            {(history.historyParsed.length === 0) && (
              <React.Fragment>
                <span style={{'padding': '10px 20px 20px 20px'}}>No history</span>
              </React.Fragment>
            )}
            {(history.historyParsed.length > 0) && (
              <React.Fragment>
                <h4>Transactions</h4>
                <Transactions transactions={history.historyParsed} coin={coin} />
              </React.Fragment>
            )}
            {account.addresses && account.addresses.length > 0 &&
              <div style={this.state.address ? {'padding': '10px 20px 20px 20px'} : {'padding': '10px 20px 30px 20px'}}>
                Send change to
                <select
                  style={{'marginLeft': '10px'}}
                  className="account-index-selector"
                  name="address"
                  value={this.state.address}
                  onChange={ (event) => this.updateInput(event) }>
                  <option
                    key="rewards-output-address-default"
                    value="">
                    Unused address (default)
                  </option>
                  {account.addresses.slice(0, 10).map((item, index) => (
                    <option
                      key={`rewards-output-address-${index}`}
                      value={item.address}>
                      {item.address}
                    </option>
                  ))}
                </select>
              </div>
            }
            {this.state.address &&
              <div style={{'padding': '0 20px 30px 20px'}}>
                <strong>Warning:</strong> sending coins to a non-default address will break so called pseudo anonimity (one time address usage) and link your addresses together! This is not recommended option.
              </div>
            }
            { balance > 0 &&
              <div className="send-form" style={{'padding': '20px 20px 30px 20px'}}>
                <div>
                  Amount <input
                    style={{'marginLeft': '10px'}}
                    type="text"
                    className="form-control edit"
                    name="amount"
                    onChange={ this.updateInput }
                    value={ this.state.amount }
                    placeholder="Enter an amount"
                    autoComplete="off"
                    required />
                  <button className="button is-light send-max" onClick={() => this.setSendToMaxAmount(balance)}>
                    Max
                  </button>
                </div>
                <div style={{'margin': '30px 0 20px 0'}}>
                  Send to <input
                    style={{'marginLeft': '10px'}}
                    type="text"
                    className="form-control edit"
                    name="sendTo"
                    onChange={ this.updateInput }
                    value={ this.state.sendTo }
                    placeholder="Enter an address"
                    autoComplete="off"
                    required />
                </div>
              </div>
            }
            {this.state.isDebug &&
              <button className="button is-primary" onClick={() => this.showXpub(accountIndex)}>
                {this.state.showXpub >=0 && this.state.showXpub == accountIndex ? 'Hide Xpub' : 'Show Xpub'}
              </button>
            }
            {this.state.showXpub >=0 &&
             this.state.showXpub == accountIndex &&
              <div style={{'padding': '20px', 'wordBreak': 'break-all'}}>
                <strong>Xpub:</strong> {xpub}
              </div>
            }
            { balance > 0 &&
              <SendCoinButton
                account={account}
                handleRewardClaim={this.handleRewardClaim}
                vendor={vendor}
                address={this.state.address}
                balance={balance}
                sendTo={this.state.sendTo}
                amount={this.state.amount}
                syncData={this.props.syncData}
                coin={coin}>
                Send
              </SendCoinButton>
            }
          </div>
        </div>
      </div>
    );
  }
}

const Accounts = ({accounts, tiptime, vendor, syncData, coin}) => (
  <div className="Accounts">
    <div className="container">
      <div className="columns is-multiline">
        {accounts.map((account) => (
          <Account
            key={account.accountIndex}
            account={account}
            tiptime={tiptime}
            vendor={vendor}
            syncData={syncData}
            coin={coin}
            />
        ))}
      </div>
    </div>
  </div>
);

export default Accounts;
