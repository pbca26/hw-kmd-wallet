import React from 'react';
import Utxos from './Utxos';
import ClaimRewardsButton from './ClaimRewardsButton';
import TxidLink from './TxidLink';
import {SERVICE_FEE_PERCENT, TX_FEE} from './constants';
import humanReadableSatoshis from './lib/human-readable-satoshis';
import './Accounts.scss';
import './Account.scss';

class Account extends React.Component {
  state = this.initialState;

  get initialState() {
    return {
      isClaimed: false,
      claimTxid: null
    };
  }

  handleRewardClaim = txid => {
    this.setState({
      isClaimed: true,
      claimTxid: txid
    });
  };

  render() {
    const {account, tiptime} = this.props;
    const {
      accountIndex,
      utxos,
      balance,
      rewards,
      claimableAmount,
      serviceFee
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
                <Utxos utxos={utxos} tiptime={tiptime} />
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
                    {(SERVICE_FEE_PERCENT !== 0 && serviceFee !== 0) && (
                      <tr>
                        <td>{humanReadableSatoshis(serviceFee)} KMD</td>
                        <td>{SERVICE_FEE_PERCENT}% service fee</td>
                      </tr>
                    )}
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
            {(isClaimed && claimTxid) && (
              <div className="is-pulled-right">
                Claim TXID: <TxidLink txid={claimTxid}/>
              </div>
            )}
            <ClaimRewardsButton account={account} handleRewardClaim={this.handleRewardClaim} isClaimed={this.state.isClaimed} vendor={this.props.vendor}>
              Claim Rewards
            </ClaimRewardsButton>
          </div>
        </div>
      </div>
    );
  }
}

const Accounts = ({accounts, tiptime}) => (
  <div className="Accounts">
    <div className="container">
      <div className="columns is-multiline">
        {accounts.map((account) => (
          <Account
            key={account.accountIndex}
            account={account}
            tiptime={tiptime}
            />
        ))}
      </div>
    </div>
  </div>
);

export default Accounts;
