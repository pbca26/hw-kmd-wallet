import React from 'react';
import ActionListModal from './ActionListModal';
import TxidLink from './TxidLink';
import ledger from './lib/ledger';
import blockchain from './lib/blockchain';
import getAddress from './lib/get-address';
import checkPublicAddress from './lib/validate-address';
import transactionBuilder from './lib/transaction-builder';
import {toSats, fromSats} from './lib/math';
import updateActionState from './lib/update-action-state';
import humanReadableSatoshis from './lib/human-readable-satoshis';
import getKomodoRewards from './lib/get-komodo-rewards';
import {TX_FEE, KMD_REWARDS_MIN_THRESHOLD, KOMODO} from './constants';

const MAX_TIPTIME_TO_LOCALTIME_DIFF = 10 * 60;

class SendCoinButton extends React.Component {
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
          description: <div>Broadcasting transaction to the network.</div>,
          state: null
        },
      },
      skipBroadcast: false,
      skipBroadcastClicked: false,
      amount: 0,
      sendTo: null,
      change: 0,
      changeTo: null,
      rewards: 0,
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

  getUnusedAddressIndexChange = () => this.props.account.addresses.filter(address => address.isChange).length;
  
  getUnusedAddressChange = () => this.props.address.length ? this.props.address : getAddress(this.props.account.internalNode.derive(this.getUnusedAddressIndexChange()).publicKey);
  
  getOutputs = () => {
    const {
      balance,
      claimableAmount,
    } = this.props.account;

    const outputs =  {address: this.getUnusedAddress(), value: (balance + claimableAmount)};

    return outputs;
  };

  validate() {
    const amount = Number(this.props.amount);
    const balance = this.props.balance;
    const {coin} = this.props;
    let error;

    if (humanReadableSatoshis(balance + TX_FEE) > balance) {
      error = 'insufficient balance';
    } else if (Number(amount) < humanReadableSatoshis(TX_FEE)) {
      error = `amount is too small, min is ${humanReadableSatoshis(TX_FEE)} ${coin}`;
    } else if (!Number(amount) || Number(amount) < 0) {
      error = 'wrong amount format'
    }

    const validateAddress = checkPublicAddress(this.props.sendTo);
    if (!validateAddress) error = 'Invalid send to address';

    return error;
  }

  filterUtxos = (utxoListSimplified, utxoListDetailed) => {
    let utxos = [];
    
    for (let i = 0; i < utxoListSimplified.length; i++) {
      for (let j = 0; j < utxoListDetailed.length; j++) {
        if (utxoListDetailed[j].vout === utxoListSimplified[i].vout &&
            utxoListDetailed[j].txid === utxoListSimplified[i].txid) {
          utxos.push(utxoListDetailed[j]);
          break;
        }
      }
    }

    console.warn('filterUtxos', utxos);

    return utxos;
  }

  sendCoin = async () => {
    const isUserInputValid = this.props.isClaimRewardsOnly ? false : this.validate();
    const isClaimRewardsOnly = this.props.isClaimRewardsOnly;

    if (isClaimRewardsOnly) {
      console.warn('claim kmd rewards button clicked');
    } else {
      console.warn('send coin clicked');
    }
    
    this.setState(prevState => ({
      ...this.initialState,
      isClaimingRewards: true,
      skipBroadcast: false,
    }));

    if (!isUserInputValid) {
      const {tiptime} = this.props;
      const {
        accountIndex,
        utxos,
      } = this.props.account;

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

        const {
          accountIndex,
          utxos,
        } = this.props.account;

        console.warn('utxos', utxos);

        let formattedUtxos = [];

        for (let i = 0; i < utxos.length; i++) {
          let utxo = utxos[i];
          console.warn('utxos[i].amount', utxos[i].amount);
    
          utxo.amountSats = utxo.satoshis; 

          if (this.props.coin === 'KMD') {
            const rewards = getKomodoRewards({tiptime, ...utxo});
            console.warn('rewards', rewards);
            console.warn('tiptime', tiptime);
            utxo.interestSats = rewards;
          }

          formattedUtxos.push(utxo);
        }
        
        console.warn('formatted utxos', formattedUtxos);
        
        const txDataPreflight = transactionBuilder(
          this.props.coin === 'KMD' ? Object.assign({}, KOMODO, {kmdInterest: true}) : KOMODO,
          isClaimRewardsOnly ? this.props.balance - TX_FEE : toSats(this.props.amount),
          TX_FEE,
          this.props.sendTo ? this.props.sendTo : this.getUnusedAddressChange(),
          this.getUnusedAddressChange(),
          formattedUtxos
        );

        console.warn('txDataPreflight', txDataPreflight);

        let ledgerUnusedAddress;
        const unusedAddress = this.getUnusedAddressChange();
        const derivationPath = `44'/141'/${accountIndex}'/1/${this.getUnusedAddressIndexChange()}`;

        if (isClaimRewardsOnly || txDataPreflight.change > 0 || txDataPreflight.totalInterest) {
          const verify = true;
          ledgerUnusedAddress = this.props.address.length ? this.props.address : await ledger.getAddress(derivationPath, isClaimRewardsOnly && this.props.vendor === 'trezor' ? true : false);
        
          console.warn(ledgerUnusedAddress);
          if (ledgerUnusedAddress !== unusedAddress) {
            throw new Error((this.props.vendor === 'ledger' ? 'Ledger' : 'Trezor') + ` derived address "${ledgerUnusedAddress}" doesn't match browser derived address "${unusedAddress}"`);
          }
          updateActionState(this, currentAction, true);
        }

        const txData = transactionBuilder(
          this.props.coin === 'KMD' ? Object.assign({}, KOMODO, {kmdInterest: true}) : KOMODO,
          isClaimRewardsOnly ? this.props.balance - TX_FEE : toSats(this.props.amount),
          TX_FEE,
          isClaimRewardsOnly ? ledgerUnusedAddress : this.props.sendTo,
          isClaimRewardsOnly || txDataPreflight.change > 0 || txDataPreflight.totalInterest ? ledgerUnusedAddress : 'none',
          formattedUtxos
        );

        console.warn('amount in', isClaimRewardsOnly ? this.props.balance - TX_FEE : toSats(this.props.amount));
        console.warn('txData', txData);

        const filteredUtxos = this.filterUtxos(txData.inputs, formattedUtxos);

        currentAction = 'approveTransaction';
        updateActionState(this, currentAction, 'loading');

        this.setState({
          isClaimingRewards: true,
          skipBroadcast: false,
          amount: txData.value,
          sendTo: txData.outputAddress,
          changeTo: txData.changeAddress,
          change: txData.change,
          skipBroadcast: this.state.skipBroadcast,
          skipBroadcastClicked: false,
          rewards: txData.totalInterest - TX_FEE,
        });

        let rawtx;
        
        if (this.props.isClaimRewardsOnly) {
          rawtx = await ledger.createTransaction(
            filteredUtxos,
            [{
              address: txData.outputAddress,
              value: txData.value
            }],
            this.props.coin === 'KMD'
          );
        } else {
          rawtx = await ledger.createTransaction(
            filteredUtxos, txData.change > 0 || txData.totalInterest ?
            [{
              address: txData.outputAddress,
              value: txData.value
            },
            {
              address: txData.changeAddress,
              value: txData.change === 0 && txData.totalInterest > 0 ? txData.change + txData.totalInterest - TX_FEE : txData.change,
              derivationPath
            }] : [{address: txData.outputAddress, value: txData.value}],
            this.props.coin === 'KMD'
          );
        }

        console.warn('tx outputs', txData.change > 0 || txData.totalInterest ?
        [{address: txData.outputAddress, value: txData.value}, {address: txData.changeAddress, value: txData.change + txData.totalInterest - (isClaimRewardsOnly ? 0 : TX_FEE * 2), derivationPath}] : [{address: txData.outputAddress, value: txData.value}]);

        console.warn('rawtx', rawtx);
        if (!rawtx) {
          throw new Error((this.props.vendor === 'ledger' ? 'Ledger' : 'Trezor') + ' failed to generate a valid transaction');
        }
        updateActionState(this, currentAction, true);
        
        if (this.state.skipBroadcast) {
          this.setState({
            success: 
              <React.Fragment>
                <span style={{
                  'padding': '10px 0',
                  'display': 'block'
                }}>Raw transaction:</span>
                <span style={{
                  'wordBreak': 'break-all',
                  'display': 'block',
                  'paddingLeft': '3px'
                }}>{rawtx}</span>
              </React.Fragment>
          });
          setTimeout(() => {
            this.props.syncData();
          }, 5000);
        } else {
          currentAction = 'broadcastTransaction';
          updateActionState(this, currentAction, 'loading');
          const {txid} = await blockchain.broadcast(rawtx);
          if (!txid || txid.length !== 64) {
            throw new Error('Unable to broadcast transaction');
          }
          updateActionState(this, currentAction, true);

          this.props.handleRewardClaim(txid);
          this.setState({
            success: 
              <React.Fragment>
                Transaction ID: <TxidLink txid={txid} coin={this.props.coin} />
              </React.Fragment>
          });
          setTimeout(() => {
            this.props.syncData();
          }, 5000);
        }
      } catch (error) {
        console.warn(error);
        updateActionState(this, currentAction, false);
        this.setState({error: error.message});
      }
    } else {
      console.warn(isUserInputValid);
      updateActionState(this, 'connect', false);
      this.setState({error: isUserInputValid});
    }
  };

  render() {
    const {isClaimingRewards} = this.state;
    const isClaimableAmount = (this.props.account.claimableAmount > 0);
    const userOutput = this.getOutputs();
    const isNoBalace = Number(this.props.balance) <= 0;
    const {coin} = this.props;

    console.warn('this.props', this.props);
    console.warn('KMD_REWARDS_MIN_THRESHOLD', KMD_REWARDS_MIN_THRESHOLD);
    console.warn('this.props.account.claimableAmount', this.props.account.claimableAmount);
    
    return (
      <React.Fragment>
        <button
          className={`button is-primary${this.props.className ? ' ' + this.props.className : ''}`}
          disabled={
            isNoBalace ||
            (!this.props.sendTo && !this.props.isClaimRewardsOnly) ||
            ((!this.props.amount || Number(this.props.amount) === 0) && !this.props.isClaimRewardsOnly) ||
            (this.props.coin === 'KMD' && this.props.account.claimableAmount < KMD_REWARDS_MIN_THRESHOLD && this.props.isClaimRewardsOnly)
          }
          onClick={this.sendCoin}>
          {this.props.children}
        </button>
        <ActionListModal
          {...this.state}
          title={this.props.isClaimRewardsOnly ? 'Claim KMD rewards' : 'Send'}
          handleClose={this.resetState}
          show={isClaimingRewards}>
          {!this.state.sendTo &&
            <p>Awaiting user input...</p>
          }
          {this.state.sendTo &&
           !this.props.isClaimRewardsOnly &&
            <p>
              Send <strong>{humanReadableSatoshis(this.state.amount)} {this.props.coin}</strong> to <strong>{this.state.sendTo}</strong>
            </p>
          }
          {this.state.change > 0 &&
            this.state.isDebug &&
            <p>
              Send change <strong>{humanReadableSatoshis(this.state.change)} {this.props.coin}</strong> to address: <strong>{this.state.changeTo}</strong>
            </p>
          }
          {this.state.rewards > 0 &&
            <React.Fragment>
              <p>
                Claim <strong>{humanReadableSatoshis(this.state.rewards - TX_FEE)} {this.props.coin}</strong> rewards to address: <strong>{this.state.changeTo}</strong>.
              </p>
              {this.props.isClaimRewardsOnly &&
                <p>
                  You should receive a total of <strong>{humanReadableSatoshis(this.state.amount)} {this.props.coin}</strong>.
                </p>
              }
            </React.Fragment>
          }
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

export default SendCoinButton;
