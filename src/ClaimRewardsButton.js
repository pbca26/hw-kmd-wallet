import React from 'react';
import ActionListModal from './ActionListModal';
import TxidLink from './TxidLink';
import ledger from './lib/ledger';
import blockchain from './lib/blockchain';
import getAddress from './lib/get-address';
import updateActionState from './lib/update-action-state';
import humanReadableSatoshis from './lib/human-readable-satoshis';
import {SERVICE_FEE_PERCENT, SERVICE_FEE_ADDRESS} from './constants';

class ClaimRewardsButton extends React.Component {
  state = this.initialState;

  get initialState() {
    return {
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
        }
      }
    };
  }

  resetState = () => this.setState(this.initialState);

  getUnusedAddressIndex = () => this.props.account.addresses.filter(address => !address.isChange).length;

  getUnusedAddress = () => getAddress(this.props.account.externalNode.derive(this.getUnusedAddressIndex()).publicKey);

  getOutputs = () => {
    const {
      balance,
      claimableAmount,
      serviceFee,
    } = this.props.account;

    const outputs = [
      {address: this.getUnusedAddress(), value: (balance + claimableAmount)}
    ];

    if (serviceFee > 0) {
      outputs.push({address: SERVICE_FEE_ADDRESS, value: serviceFee})
    }

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
    }));

    let currentAction;
    try {
      currentAction = 'connect';
      updateActionState(this, currentAction, 'loading');
      const ledgerIsAvailable = await ledger.isAvailable();
      if (!ledgerIsAvailable) {
        throw new Error((this.props.vendor === 'ledger' ? 'Ledger' : 'Trezor') + ' device is unavailable!');
      }
      updateActionState(this, currentAction, true);

      currentAction = 'confirmAddress';
      updateActionState(this, currentAction, 'loading');
      const unusedAddress = this.getUnusedAddress();
      const derivationPath = `44'/141'/${accountIndex}'/0/${this.getUnusedAddressIndex()}`;
      const verify = true;
      const ledgerUnusedAddress = await ledger.getAddress(derivationPath, verify);
      if(ledgerUnusedAddress !== unusedAddress) {
        throw new Error((this.props.vendor === 'ledger' ? 'Ledger' : 'Trezor') + ` derived address "${ledgerUnusedAddress}" doesn't match browser derived address "${unusedAddress}"`);
      }
      updateActionState(this, currentAction, true);

      currentAction = 'approveTransaction';
      updateActionState(this, currentAction, 'loading');
      const outputs = this.getOutputs();
      const rewardClaimTransaction = await ledger.createTransaction(utxos, outputs);
      if(!rewardClaimTransaction) {
        throw new Error((this.props.vendor === 'ledger' ? 'Ledger' : 'Trezor') + ' failed to generate a valid transaction');
      }
      updateActionState(this, currentAction, true);

      currentAction = 'broadcastTransaction';
      updateActionState(this, currentAction, 'loading');
      const {txid} = await blockchain.broadcast(rewardClaimTransaction);
      if(!txid || txid.length !== 64) {
        throw new Error('Unable to broadcast transaction');
      }
      updateActionState(this, currentAction, true);

      this.props.handleRewardClaim(txid);
      this.setState({
        success: <React.Fragment>Claim TXID: <TxidLink txid={txid}/></React.Fragment>
      });
    } catch (error) {
      updateActionState(this, currentAction, false);
      this.setState({error: error.message});
    }
  };

  render() {
    const {isClaimingRewards} = this.state;
    const isClaimableAmount = (this.props.account.claimableAmount > 0);
    const [userOutput, feeOutput] = this.getOutputs();

    return (
      <React.Fragment>
        <button className="button is-primary" disabled={this.props.isClaimed || !isClaimableAmount} onClick={this.claimRewards}>
          {this.props.children}
        </button>
        <ActionListModal
          {...this.state}
          title="Claiming Rewards"
          handleClose={this.resetState}
          show={isClaimingRewards}>
          <p>
            You should receive a total of <strong>{humanReadableSatoshis(userOutput.value)} KMD</strong> to the new unused address: <strong>{userOutput.address}</strong><br />
            {feeOutput ? (
              <React.Fragment>
                There will also be a {SERVICE_FEE_PERCENT}% service fee of <strong>{humanReadableSatoshis(feeOutput.value)} KMD</strong> to: <strong>{feeOutput.address}</strong>
              </React.Fragment>
            ) : null}
          </p>
        </ActionListModal>
      </React.Fragment>
    );
  }
}

export default ClaimRewardsButton;
