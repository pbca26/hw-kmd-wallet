import React from 'react';
import Utxos from './Utxos';
import ClaimRewardsButton from './ClaimRewardsButton';
import TxidLink from './TxidLink';
import {TX_FEE} from './constants';
import humanReadableSatoshis from './lib/human-readable-satoshis';
import './Accounts.scss';
import './Account.scss';

class Account extends React.Component {
  state = this.initialState;

  get initialState() {
    return {
      isClaimed: false,
      claimTxid: null,
      address: '',
      // debug options
      showXpub: null,
      isDebug: window.location.href.indexOf('enable-verify') > -1,
    };
  }

  updateInput(e) {
    this.setState({
      [e.target.name]: e.target.value,
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
    const {account, tiptime, vendor} = this.props;
    const {
      accountIndex,
      utxos,
      balance,
      rewards,
      claimableAmount,
      xpub,
    } = account;

    const isClaimableAmount = (claimableAmount > 0);
    const {isClaimed, claimTxid} = this.state;

    return (
      <div className={`Account column is-full ${isClaimed ? 'is-claimed' : ''}`}>
        <div className="box">
          <div className="content">
            <h2>
              Account {accountIndex + 1}
              <div className="balance">
                {humanReadableSatoshis(balance)} KMD
              </div>
              <small>
                + {humanReadableSatoshis(Math.max(0, claimableAmount))} KMD Claimable Rewards
              </small>
            </h2>
            {(utxos.length > 0) && (
              <React.Fragment>
                <h4>UTXOs</h4>
                <Utxos
                  utxos={utxos}
                  tiptime={tiptime} />
              </React.Fragment>
            )}
            {isClaimableAmount && (
              <React.Fragment>
                <h4>Breakdown</h4>
                <table className="breakdown">
                  <tbody>
                    <tr>
                      <td>{humanReadableSatoshis(rewards)} KMD</td>
                      <td>Rewards accrued</td>
                    </tr>
                    <tr>
                      <td>{humanReadableSatoshis(TX_FEE)} KMD</td>
                      <td>Network transaction fee</td>
                    </tr>
                    <tr>
                      <td><strong>{humanReadableSatoshis(claimableAmount)} KMD</strong></td>
                      <td>Total claimable amount</td>
                    </tr>
                  </tbody>
                </table>
              </React.Fragment>
            )}
            {account.addresses && account.addresses.length &&
              <div style={this.state.address ? {'padding': '10px 20px 20px 20px'} : {'padding': '10px 20px 30px 20px'}}>
                Send rewards to
                <select
                  style={{'marginLeft': '10px'}}
                  className="account-index-selector"
                  name="address"
                  value={this.state.address}
                  onChange={(event) => this.updateInput(event)}>
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
                <strong>Warning:</strong> sending rewards to a non-default address will break so called pseudo anonimity (one time address usage) and link your addresses together! This is not recommended option.
              </div>
            }
            {(isClaimed && claimTxid) && (
              <div className="is-pulled-right">
                Claim TXID: <TxidLink txid={claimTxid}/>
              </div>
            )}
            {this.state.isDebug &&
              <button
                className="button is-primary"
                onClick={() => this.showXpub(accountIndex)}>
                {this.state.showXpub >=0 && this.state.showXpub === accountIndex ? 'Hide Xpub' : 'Show Xpub'}
              </button>
            }
            {this.state.showXpub >=0 &&
             this.state.showXpub === accountIndex &&
              <div style={{
                'padding': '20px',
                'wordBreak': 'break-all'
              }}>
                <strong>Xpub:</strong> {xpub}
              </div>
            }
            <ClaimRewardsButton
              account={account}
              handleRewardClaim={this.handleRewardClaim}
              isClaimed={this.state.isClaimed}
              vendor={vendor}
              address={this.state.address}>
              Claim Rewards
            </ClaimRewardsButton>
          </div>
        </div>
      </div>
    );
  }
}

const Accounts = ({
  accounts,
  tiptime,
  vendor
}) => (
  <div className="Accounts">
    <div className="container">
      <div className="columns is-multiline">
        {accounts.map((account) => (
          <Account
            key={account.accountIndex}
            account={account}
            tiptime={tiptime}
            vendor={vendor}
            />
        ))}
      </div>
    </div>
  </div>
);

export default Accounts;
