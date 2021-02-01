import React from 'react';
import ActionListModal from './ActionListModal';
import TxidLink from './TxidLink';
import hw from './lib/hw';
import blockchain from './lib/blockchain';
import getAddress from './lib/get-address';
import checkPublicAddress from './lib/validate-address';
import transactionBuilder from './lib/transaction-builder';
import {toSats} from './lib/math';
import updateActionState from './lib/update-action-state';
import humanReadableSatoshis from './lib/human-readable-satoshis';
import getKomodoRewards from './lib/get-komodo-rewards';
import {
  TX_FEE,
  KMD_REWARDS_MIN_THRESHOLD,
  KOMODO,
  VENDOR,
} from './constants';
import {
  isElectron,
  appData,
} from './Electron';

// TODO: refactor transaction builder, make math more easier to understand and read

class SendCoinButton extends React.Component {
  state = this.initialState;

  get initialState() {
    this.setSkipBroadcast = this.setSkipBroadcast.bind(this);

    return {
      isDebug: isElectron ? appData.isDev : window.location.href.indexOf('enable-verify') > -1,
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

  getUnusedAddressIndexChange = () => this.props.account.addresses.filter(address => this.props.isClaimRewardsOnly ? !address.isChange : address.isChange).length;
  
  getUnusedAddressChange = () => this.props.address.length ? this.props.address : getAddress(this.props.account[this.props.isClaimRewardsOnly ? 'externalNode' : 'internalNode'].derive(this.getUnusedAddressIndexChange()).publicKey);
  
  getOutputs = () => {
    const {
      balance,
      claimableAmount,
    } = this.props.account;

    const outputs =  {
      address: this.getUnusedAddress(),
      value: (balance + claimableAmount),
    };

    return outputs;
  };

  validate() {
    const amount = Number(this.props.amount);
    const balance = this.props.balance;
    const {coin} = this.props;
    let error;

    if (Number(amount) > balance) {
      error = 'insufficient balance';
    } else if (Number(amount) < humanReadableSatoshis(TX_FEE)) {
      error = `amount is too small, min is ${humanReadableSatoshis(TX_FEE)} ${coin}`;
    } else if (!Number(amount) || Number(amount) < 0) {
      error = 'wrong amount format';
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
      const {tiptime, coin} = this.props;

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

          if (coin === 'KMD') {
            const rewards = getKomodoRewards({tiptime, ...utxo});
            console.warn('rewards', rewards);
            console.warn('tiptime', tiptime);
            utxo.interestSats = rewards;
          }

          formattedUtxos.push(utxo);
        }
        
        console.warn('formatted utxos', formattedUtxos);
        
        const txDataPreflight = transactionBuilder(
          coin === 'KMD' ? Object.assign({}, KOMODO, {kmdInterest: true}) : KOMODO,
          isClaimRewardsOnly ? this.props.balance - TX_FEE * 2 : this.props.amount < humanReadableSatoshis(this.props.balance) ? toSats(this.props.amount) + TX_FEE : toSats(this.props.amount),
          TX_FEE,
          this.props.sendTo ? this.props.sendTo : this.getUnusedAddressChange(),
          this.getUnusedAddressChange(),
          formattedUtxos
        );

        console.warn('txDataPreflight', txDataPreflight);

        let hwUnusedAddress;
        const unusedAddress = this.getUnusedAddressChange();
        const derivationPath = `44'/141'/${accountIndex}'/${this.props.isClaimRewardsOnly ? 0 : 1}/${this.getUnusedAddressIndexChange()}`;
        
        console.warn('derivationPath', derivationPath);
        
        if (isClaimRewardsOnly || txDataPreflight.change > 0 || txDataPreflight.totalInterest) {
          hwUnusedAddress = this.props.address.length ? this.props.address : await hw[this.props.vendor].getAddress(derivationPath, isClaimRewardsOnly && this.props.vendor === 'trezor' ? true : false);
        
          console.warn('hwUnusedAddress', hwUnusedAddress);
          if (hwUnusedAddress !== unusedAddress) {
            throw new Error(`${VENDOR[this.props.vendor]} derived address "${hwUnusedAddress}" doesn't match browser derived address "${unusedAddress}"`);
          }
          updateActionState(this, currentAction, true);
        }

        let txData = transactionBuilder(
          coin === 'KMD' ? Object.assign({}, KOMODO, {kmdInterest: true}) : KOMODO,
          isClaimRewardsOnly ? this.props.balance - TX_FEE * 2 : this.props.amount < humanReadableSatoshis(this.props.balance) ? toSats(this.props.amount) + TX_FEE : toSats(this.props.amount),
          TX_FEE,
          isClaimRewardsOnly ? hwUnusedAddress : this.props.sendTo,
          isClaimRewardsOnly || txDataPreflight.change > 0 || txDataPreflight.totalInterest ? hwUnusedAddress : 'none',
          formattedUtxos
        );

        console.warn('amount in', isClaimRewardsOnly ? this.props.balance - TX_FEE * 2 : toSats(this.props.amount));
        console.warn('txData', txData);

        const filteredUtxos = this.filterUtxos(txData.inputs, formattedUtxos);

        currentAction = 'approveTransaction';
        updateActionState(this, currentAction, 'loading');

        if (!this.props.isClaimRewardsOnly && !txData.totalInterest && txData.change) {
          txData.change += TX_FEE;
        }

        this.setState({
          isClaimingRewards: true,
          amount: !this.props.isClaimRewardsOnly && txData.totalInterest && txData.outputAddress === txData.changeAddress ? txData.value - TX_FEE : this.props.amount < humanReadableSatoshis(this.props.balance) ? txData.value - TX_FEE : txData.value,
          sendTo: txData.outputAddress,
          changeTo: txData.changeAddress,
          change: txData.change,
          skipBroadcast: this.state.skipBroadcast,
          skipBroadcastClicked: false,
          rewards: txData.totalInterest - TX_FEE,
        });

        let rawtx;
        
        if (this.props.isClaimRewardsOnly) {
          rawtx = await hw[this.props.vendor].createTransaction(
            filteredUtxos,
            [{
              address: txData.outputAddress,
              value: txData.value
            }],
            coin === 'KMD'
          );
        } else {
          rawtx = await hw[this.props.vendor].createTransaction(
            filteredUtxos, txData.change > 0 || txData.totalInterest && txData.outputAddress !== txData.changeAddress ?
            [{
              address: txData.outputAddress,
              value: txData.value - TX_FEE
            },
            {
              address: txData.changeAddress,
              value: txData.change === 0 && txData.totalInterest > 0 ? txData.change + txData.totalInterest - TX_FEE : txData.totalInterest > 0 ? txData.change - TX_FEE * 2 : txData.change,
              derivationPath
            }] : [{address: txData.outputAddress, value: txData.value - TX_FEE}],
            coin === 'KMD'
          );
        }

        console.warn('tx outputs', txData.change > 0 || txData.totalInterest ?
        [{address: txData.outputAddress, value: txData.value}, {address: txData.changeAddress, value: txData.change + txData.totalInterest - (isClaimRewardsOnly ? 0 : TX_FEE * 2), derivationPath}] : [{address: txData.outputAddress, value: txData.value}]);

        console.warn('rawtx', rawtx);
        if (!rawtx) {
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
                Transaction ID: <TxidLink txid={txid} coin={coin} />
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
    const isNoBalace = Number(this.props.balance) <= 0;
    const {coin, isClaimRewardsOnly} = this.props;

    console.warn('this.props', this.props);
    console.warn('KMD_REWARDS_MIN_THRESHOLD', KMD_REWARDS_MIN_THRESHOLD);
    console.warn('this.props.account.claimableAmount', this.props.account.claimableAmount);
    
    return (
      <React.Fragment>
        <button
          className={`button is-primary${this.props.className ? ' ' + this.props.className : ''}`}
          disabled={
            isNoBalace ||
            (!this.props.sendTo && !isClaimRewardsOnly) ||
            ((!this.props.amount || Number(this.props.amount) === 0) && !isClaimRewardsOnly) ||
            (coin === 'KMD' && this.props.account.claimableAmount < KMD_REWARDS_MIN_THRESHOLD && isClaimRewardsOnly)
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
           !isClaimRewardsOnly &&
            <p>
              Send <strong>{humanReadableSatoshis(this.state.amount)} {coin}</strong> to <strong>{this.state.sendTo}</strong>
            </p>
          }
          {this.state.change > 0 &&
            this.state.isDebug &&
            <p>
              Send change <strong>{humanReadableSatoshis(this.state.change)} {coin}</strong> to address: <strong>{this.state.changeTo}</strong>
            </p>
          }
          {this.state.rewards > 0 &&
            <React.Fragment>
              <p>
                Claim <strong>{humanReadableSatoshis(this.state.rewards - TX_FEE)} {coin}</strong> rewards to address: <strong>{this.state.changeTo}</strong>.
              </p>
              {isClaimRewardsOnly &&
                <p>
                  You should receive a total of <strong>{humanReadableSatoshis(this.state.amount)} {coin}</strong>.
                </p>
              }
            </React.Fragment>
          }
          {this.props.coin === 'KMD' &&
           this.props.vendor === 'trezor' &&
           (isClaimingRewards || this.state.rewards > 0) &&
            <p>There will be an additional message on the latest firmware versions <strong>"Warning! Locktime is set but will have no effect. Continue?"</strong>. You need to approve it in order to claim interest.</p>
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
