import React from 'react';
import ActionListModal from './ActionListModal';
import TxidLink from './TxidLink';
import hw from './lib/hw';
import blockchain from './lib/blockchain';
import getAddress from './lib/get-address';
import updateActionState from './lib/update-action-state';
import humanReadableSatoshis from './lib/human-readable-satoshis';
import {VENDOR} from './constants';

class ClaimRewardsButton extends React.Component {
  state = this.initialState;

  get initialState() {
    this.setSkipBroadcast = this.setSkipBroadcast.bind(this);

    return {
      isDebug: window.location.href.indexOf('enable-verify') > -1,
      isClaimingRewards: false,
      error: false,
      success: false,
      actions: {
        connect: {
          icon: 'fab fa-usb',
          description: this.props.vendor === 'ledger' ? <div>Connect and unlock your Ledger, then open the Komodo app on your device.</div> : <div>Connect and unlock your Trezor.</div>,
          state: null
        },
        confirmAddress: {
          icon: 'fas fa-search-dollar',
          description: <div>Confirm the address on your device matches the new unused address shown above.</div>,
          state: null
        },
        approveTransaction: {
          icon: 'fas fa-key',
          description: <div>Approve the transaction on your device after carefully checking the values and addresses match those shown above.</div>,
          state: null
        },
        broadcastTransaction: {
          icon: 'fas fa-broadcast-tower',
          description: <div>Broadcasting the reward claim transaction to the network.</div>,
          state: null
        },
      },
      skipBroadcast: false,
      skipBroadcastClicked: false,
    };
  }

  setSkipBroadcast() {
    if (!this.state.skipBroadcastClicked) {
      this.setState({
        skipBroadcast: !this.state.skipBroadcast,
        skipBroadcastClicked: true,
      });
    }
  }

  resetState = () => this.setState(this.initialState);

  getUnusedAddressIndex = () => this.props.account.addresses.filter(address => !address.isChange).length;

  getUnusedAddress = () => this.props.address.length ? this.props.address : getAddress(this.props.account.externalNode.derive(this.getUnusedAddressIndex()).publicKey);

  getOutputs = () => {
    const {
      balance,
      claimableAmount,
    } = this.props.account;

    const outputs =  {
      address: this.getUnusedAddress(),
      value: balance + claimableAmount,
    };

    return outputs;
  };

  claimRewards = async () => {
    const {
      accountIndex,
      utxos,
    } = this.props.account;

    this.setState(prevState => ({
      ...this.initialState,
      isClaimingRewards: true,
      skipBroadcast: false,
    }));

    let currentAction;
    try {
      currentAction = 'connect';
      updateActionState(this, currentAction, 'loading');
      const hwIsAvailable = await hw[this.props.vendor].isAvailable();
      if (!hwIsAvailable) {
        throw new Error(`${VENDOR[this.props.vendor]} device is unavailable!`);
      }
      updateActionState(this, currentAction, true);

      currentAction = 'confirmAddress';
      updateActionState(this, currentAction, 'loading');

      const unusedAddress = this.getUnusedAddress();
      const derivationPath = `44'/141'/${accountIndex}'/0/${this.getUnusedAddressIndex()}`;
      const verify = true;
      const hwUnusedAddress = this.props.address.length ? this.props.address : await hw[this.props.vendor].getAddress(derivationPath, verify);
      if (hwUnusedAddress !== unusedAddress) {
        throw new Error(`${VENDOR[this.props.vendor]} derived address "${hwUnusedAddress}" doesn't match browser derived address "${unusedAddress}"`);
      }
      updateActionState(this, currentAction, true);

      currentAction = 'approveTransaction';
      updateActionState(this, currentAction, 'loading');
      const outputs = this.getOutputs();
      const rewardClaimTransaction = await hw[this.props.vendor].createTransaction(utxos, outputs);
      if (!rewardClaimTransaction) {
        throw new Error(`${VENDOR[this.props.vendor]} failed to generate a valid transaction`);
      }
      updateActionState(this, currentAction, true);
      
      if (this.state.skipBroadcast) {
        this.setState({
          success: 
            <React.Fragment>
              <span style={{
                'padding': '10px 0',
                'display': 'block'
              }}>
                Raw transaction:</span> <span style={{'wordBreak': 'break-all', 'display': 'block'}}>{rewardClaimTransaction}
              </span>
            </React.Fragment>
        });
      } else {
        currentAction = 'broadcastTransaction';
        updateActionState(this, currentAction, 'loading');
        const {txid} = await blockchain.broadcast(rewardClaimTransaction);
        if (!txid || txid.length !== 64) {
          throw new Error('Unable to broadcast transaction');
        }
        updateActionState(this, currentAction, true);

        this.props.handleRewardClaim(txid);
        this.setState({
          success:
            <React.Fragment>
              Claim TXID: <TxidLink txid={txid}/>
            </React.Fragment>
        });
      }
    } catch (error) {
      updateActionState(this, currentAction, false);
      this.setState({error: error.message});
    }
  };

  render() {
    const {isClaimingRewards} = this.state;
    const isClaimableAmount = (this.props.account.claimableAmount > 0);
    const userOutput = this.getOutputs();

    return (
      <React.Fragment>
        <button
          className="button is-primary"
          disabled={
            this.props.isClaimed ||
            !isClaimableAmount
          }
          onClick={this.claimRewards}>
          {this.props.children}
        </button>
        <ActionListModal
          {...this.state}
          title="Claiming Rewards"
          handleClose={this.resetState}
          show={isClaimingRewards}>
          <p>
            You should receive a total of <strong>{humanReadableSatoshis(userOutput.value)} KMD</strong> to {!this.props.address.length && 'the new unused'}address: <strong>{userOutput.address}</strong><br />
          </p>
          {this.state.isDebug &&
            <label
              className="switch"
              onClick={this.setSkipBroadcast}>
              <input
                type="checkbox"
                name="skipBroadcast"
                value={this.state.skipBroadcast}
                checked={this.state.skipBroadcast}
                readOnly />
              <span className="slider round"></span>
              <span className="slider-text">Don't broadcast transaction</span>
            </label>
          }
        </ActionListModal>
      </React.Fragment>
    );
  }
}

export default ClaimRewardsButton;
