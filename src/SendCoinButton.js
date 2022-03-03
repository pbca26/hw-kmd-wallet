import React from 'react';
import ActionListModal from './ActionListModal';
import Modal from './Modal';
import TxidLink from './TxidLink';
import hw from './lib/hw';
import blockchain, {blockchainAPI} from './lib/blockchain';
import coins from './lib/coins';
import getAddress from './lib/get-address';
import checkPublicAddress from './lib/validate-address';
import transactionBuilder from './lib/transaction-builder';
import {toSats} from './lib/math';
import updateActionState from './lib/update-action-state';
import humanReadableSatoshis from './lib/human-readable-satoshis';
import getKomodoRewards from './lib/get-komodo-rewards';
import {getAccountNode} from './lib/account-discovery';
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
import {getLocalStorageVar} from './lib/localstorage-util';
import {writeLog} from './Debug';
import copyToClipboard from './lib/copy-to-clipboard';
import QRReaderModal from './QRReaderModal';

// TODO: refactor transaction builder, make math more easier to understand and read

class SendCoinButton extends React.Component {
  state = this.initialState;

  get initialState() {
    this.setSkipBroadcast = this.setSkipBroadcast.bind(this);
    this.nextStep = this.nextStep.bind(this);
    this.updateInput = this.updateInput.bind(this);
    this.initSendCoinForm = this.initSendCoinForm.bind(this);
    this.setRecieverFromScan = this.setRecieverFromScan.bind(this);
    
    return {
      isDebug: isElectron ? appData.isDev : window.location.href.indexOf('enable-verify') > -1 || getLocalStorageVar('settings') && getLocalStorageVar('settings').enableDebugTools,
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
      step: false,
      address: '',
      amountIn: '',
      sendToIn: '',
      accountIndex: 0,
    };
  }

  triggerCopyToClipboard = (text) => copyToClipboard(text);
  
  setSkipBroadcast() {
    if (!this.state.skipBroadcastClicked) {
      this.setState({
        skipBroadcast: !this.state.skipBroadcast,
        skipBroadcastClicked: true,
      });
    }
  }

  resetState = () => this.setState(this.initialState);

  getUnusedAddressIndex = () => {
    if (this.props.isClaimRewardsOnly) {
      return this.props.account.addresses.filter(address => !address.isChange).length;
    } else {
      return this.props.accounts[this.state.accountIndex].addresses.filter(address => !address.isChange).length;
    }
  }

  getUnusedAddress = () => {
    let xpub;

    if (this.props.isClaimRewardsOnly) {
      xpub = this.props.account.xpub;
    } else {
      xpub = this.props.accounts[this.state.accountIndex].xpub;
    }

    return this.state.address.length ? this.state.address : getAddress(getAccountNode(xpub).externalNode.derive(this.getUnusedAddressIndex()).publicKey);
  }

  getUnusedAddressIndexChange = () => {
    if (this.props.isClaimRewardsOnly) {
      return this.props.account.addresses.filter(address => this.props.isClaimRewardsOnly ? !address.isChange : address.isChange).length;
    } else {
      return this.props.accounts[this.state.accountIndex].addresses.filter(address => this.props.isClaimRewardsOnly ? !address.isChange : address.isChange).length;
    }
  }
  
  getUnusedAddressChange = () => {
    const xpub = this.props.isClaimRewardsOnly ? this.props.account.xpub : this.props.accounts[this.state.accountIndex].xpub;

    return this.state.address.length ? this.state.address : getAddress(getAccountNode(xpub)[this.props.isClaimRewardsOnly ? 'externalNode' : 'internalNode'].derive(this.getUnusedAddressIndexChange()).publicKey);
  }
  
  getOutputs = () => {
    const balance = this.props.isClaimRewardsOnly ? this.props.account.balance : this.props.accounts[this.state.accountIndex].balance;    
    const claimableAmount = this.props.isClaimRewardsOnly ? this.props.account.claimableAmount : this.props.accounts[this.state.accountIndex].claimableAmount;    

    const outputs =  {
      address: this.getUnusedAddress(),
      value: (balance + claimableAmount),
    };

    return outputs;
  };

  validate() {
    const amount = Number(this.state.amountIn);
    const balance = this.props.isClaimRewardsOnly ? this.props.balance : this.props.accounts[this.state.accountIndex].balance;
    const {coin} = this.props;
    let error;

    if (Number(amount) > balance) {
      error = 'insufficient balance';
    } else if (Number(amount) < humanReadableSatoshis(TX_FEE)) {
      error = `amount is too small, min is ${humanReadableSatoshis(TX_FEE)} ${coin}`;
    } else if (!Number(amount) || Number(amount) < 0) {
      error = 'wrong amount format';
    }

    writeLog('validate state', this.state);

    const validateAddress = checkPublicAddress(this.state.sendToIn);
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

    writeLog('filterUtxos', utxos);

    return utxos;
  }

  sendCoin = async () => {
    const isUserInputValid = this.props.isClaimRewardsOnly ? false : this.validate();
    const isClaimRewardsOnly = this.props.isClaimRewardsOnly;

    if (isClaimRewardsOnly) {
      writeLog('claim kmd rewards button clicked');
    } else {
      writeLog('send coin clicked');
    }
    
    this.setState({
      step: true,
      isClaimingRewards: true,
      skipBroadcast: false,
    });

    if (!isUserInputValid) {
      const {coin} = this.props;
      let tiptime = await blockchain[blockchainAPI].getTipTime();
      tiptime = this.props.checkTipTime(this.props.tiptime);
      
      let currentAction;
      try {
        if (coin === 'KMD' && !tiptime) {
          throw new Error('Unable to get tiptime!');
        }

        currentAction = 'connect';
        updateActionState(this, currentAction, 'loading');
        const hwIsAvailable = await hw[this.props.vendor].isAvailable();
        if (!hwIsAvailable) {
          throw new Error(`${VENDOR[this.props.vendor]} device is unavailable!`);
        }
        updateActionState(this, currentAction, true);

        currentAction = 'confirmAddress';
        updateActionState(this, currentAction, 'loading');

        let accountIndex, utxos, balance;

        if (this.props.isClaimRewardsOnly) {
          accountIndex = this.props.account.accountIndex;
          utxos = this.props.account.utxos;
          balance = this.props.account.balance;
        } else {
          accountIndex = this.state.accountIndex;
          utxos = this.props.accounts[this.state.accountIndex].utxos;
          balance = this.props.accounts[this.state.accountIndex].balance;
        }

        writeLog('utxos', utxos);

        let formattedUtxos = [];

        for (let i = 0; i < utxos.length; i++) {
          let utxo = utxos[i];
          writeLog('utxos[i].amount', utxos[i].amount);
    
          utxo.amountSats = utxo.satoshis;

          if (coin === 'KMD') {
            const rewards = getKomodoRewards({tiptime, ...utxo});
            writeLog('rewards', rewards);
            writeLog('tiptime', tiptime);
            utxo.interestSats = rewards;
          }

          formattedUtxos.push(utxo);
        }
        
        writeLog('formatted utxos', formattedUtxos);
        
        const txDataPreflight = transactionBuilder(
          coin === 'KMD' ? Object.assign({}, KOMODO, {kmdInterest: true}) : KOMODO,
          isClaimRewardsOnly ? balance - TX_FEE * 2 : this.state.amountIn < humanReadableSatoshis(balance) ? toSats(this.state.amountIn) + TX_FEE : toSats(this.state.amountIn),
          TX_FEE,
          this.state.sendToIn ? this.state.sendToIn : this.getUnusedAddressChange(),
          this.getUnusedAddressChange(),
          formattedUtxos
        );

        writeLog('txDataPreflight', txDataPreflight);

        let hwUnusedAddress;
        const unusedAddress = this.getUnusedAddressChange();
        const derivationPath = `44'/141'/${accountIndex}'/${this.props.isClaimRewardsOnly ? 0 : 1}/${this.getUnusedAddressIndexChange()}`;
        
        writeLog('derivationPath', derivationPath);
        
        if (isClaimRewardsOnly || txDataPreflight.change > 0 || txDataPreflight.totalInterest) {
          hwUnusedAddress = this.state.address.length ? this.state.address : await hw[this.props.vendor].getAddress(derivationPath, isClaimRewardsOnly && this.props.vendor === 'trezor' ? true : false);
        
          writeLog('hwUnusedAddress', hwUnusedAddress);
          if (hwUnusedAddress !== unusedAddress) {
            throw new Error(`${VENDOR[this.props.vendor]} derived address "${hwUnusedAddress}" doesn't match browser derived address "${unusedAddress}"`);
          }
        }

        updateActionState(this, currentAction, true);
        
        let txData = transactionBuilder(
          coin === 'KMD' ? Object.assign({}, KOMODO, {kmdInterest: true}) : KOMODO,
          isClaimRewardsOnly ? balance - TX_FEE * 2 : this.state.amountIn < humanReadableSatoshis(balance) ? toSats(this.state.amountIn) + TX_FEE : toSats(this.state.amountIn),
          TX_FEE,
          isClaimRewardsOnly ? hwUnusedAddress : this.state.sendToIn,
          isClaimRewardsOnly || txDataPreflight.change > 0 || txDataPreflight.totalInterest ? hwUnusedAddress : 'none',
          formattedUtxos
        );

        writeLog('amount in', isClaimRewardsOnly ? balance - TX_FEE * 2 : toSats(this.state.amountIn));
        writeLog('txData', txData);

        const filteredUtxos = this.filterUtxos(txData.inputs, formattedUtxos);

        currentAction = 'approveTransaction';
        updateActionState(this, currentAction, 'loading');

        if (!this.props.isClaimRewardsOnly && !txData.totalInterest && txData.change) {
          txData.change += TX_FEE;
        }

        this.setState({
          isClaimingRewards: true,
          amount: !this.props.isClaimRewardsOnly && txData.totalInterest && txData.outputAddress === txData.changeAddress ? txData.value - TX_FEE : this.state.amountIn < humanReadableSatoshis(balance) ? txData.value - TX_FEE : txData.value,
          sendTo: txData.outputAddress,
          changeTo: txData.changeAddress,
          change: txData.change === 'none' ? 0 : txData.change,
          skipBroadcast: this.state.skipBroadcast,
          skipBroadcastClicked: false,
          rewards: txData.totalInterest - TX_FEE,
        });

        writeLog('txb data', {
          isClaimingRewards: true,
          amount: !this.props.isClaimRewardsOnly && txData.totalInterest && txData.outputAddress === txData.changeAddress ? txData.value - TX_FEE : this.state.amountIn < humanReadableSatoshis(balance) ? txData.value - TX_FEE : txData.value,
          sendTo: txData.outputAddress,
          changeTo: txData.changeAddress,
          change: txData.change === 'none' ? 0 : txData.change,
          skipBroadcast: this.state.skipBroadcast,
          skipBroadcastClicked: false,
          rewards: txData.totalInterest - TX_FEE,
        })

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

        writeLog('tx outputs', txData.change > 0 || txData.totalInterest ?
        [{address: txData.outputAddress, value: txData.value}, {address: txData.changeAddress, value: txData.change + txData.totalInterest - (isClaimRewardsOnly ? 0 : TX_FEE * 2), derivationPath}] : [{address: txData.outputAddress, value: txData.value}]);

        writeLog('rawtx', rawtx);
        if (!rawtx || typeof rawtx !== 'string') {
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
                <button
                  className="button is-light copy-btn"
                  onClick={() => this.triggerCopyToClipboard(rawtx)}>
                  <i className="fa fa-copy"></i> <span className="copy-btn-text">Copy</span>
                </button>
              </React.Fragment>
          });
          setTimeout(() => {
            this.props.syncData(this.props.coin);
          }, 5000);
        } else {
          currentAction = 'broadcastTransaction';
          updateActionState(this, currentAction, 'loading');
          
          const getInfoRes = await Promise.all(coins[coin].api.map((value, index) => {
            return blockchain[blockchainAPI].getInfo(value);
          }));
          let longestBlockHeight = 0;
          let apiEndPointIndex = 0;
      
          writeLog('checkExplorerEndpoints', getInfoRes);
          
          for (let i = 0; i < coins[coin].api.length; i++) {
            if (getInfoRes[i] &&
                getInfoRes[i].hasOwnProperty('info') &&
                getInfoRes[i].info.hasOwnProperty('version')) {
              if (getInfoRes[i].info.blocks > longestBlockHeight) {
                longestBlockHeight = getInfoRes[i].info.blocks;
                apiEndPointIndex = i;
              }
            }
          }
  
          writeLog(`${coin} set api endpoint to ${coins[coin].api[apiEndPointIndex]}`);
          blockchain[blockchainAPI].setExplorerUrl(coins[coin].api[apiEndPointIndex]);

          const {txid} = await blockchain[blockchainAPI].broadcast(rawtx);
          if (!txid || txid.length !== 64) {
            throw new Error('Unable to broadcast transaction');
          }
          updateActionState(this, currentAction, true);

          this.setState({
            success: 
              <React.Fragment>
                Transaction ID: <TxidLink txid={txid} coin={coin} />
                <button
                  className="button is-light copy-btn"
                  onClick={() => this.triggerCopyToClipboard(txid)}>
                  <i className="fa fa-copy"></i> <span className="copy-btn-text">Copy</span>
                </button>
              </React.Fragment>
          });
          setTimeout(() => {
            this.props.syncData(this.props.coin);
          }, 5000);
        }
      } catch (error) {
        writeLog(error);
        updateActionState(this, currentAction, false);
        this.setState({error: error.message});
      }
    } else {
      writeLog(isUserInputValid);
      updateActionState(this, 'connect', false);
      this.setState({error: isUserInputValid});
    }
  };

  initSendCoinForm() {
    this.setState(prevState => ({
      ...this.initialState,
      isClaimingRewards: true,
      skipBroadcast: false,
    }));
  }

  nextStep() {
    if (!this.state.step) {
      this.sendCoin();
    } else {
      this.setState({
        step: !this.state.step,
        error: false,
      });
    }
  }

  updateInput(e) {
    if (e.target.name === 'sendToIn') {
      e.target.value = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
    } else if (e.target.name === 'amountIn') {
      e.target.value = e.target.value.replace(/[^0-9.]/g, '');
    }

    writeLog(e.target.name);
    writeLog(e.target.value);
    
    this.setState({
      [e.target.name]: e.target.value,
    });

    setTimeout(() => {
      writeLog('this.state', this.state);
    }, 100);
  }

  setSendToMaxAmount(balance) {
    this.setState({
      amountIn: humanReadableSatoshis(balance),
    });
  }

  updateAccountIndex(e) {
    this.setState({
      [e.target.name]: e.target.value,
    });
  }

  setRecieverFromScan(data) {
    this.setState({
      sendToIn: data.replace(/[^a-zA-Z0-9]/g, ''),
    });
    writeLog('send coin setRecieverFromScan', data);
  }

  render() {
    writeLog('send coin button', this.props);

    const {isClaimingRewards} = this.state;
    const isNoBalace = this.props.isClaimRewardsOnly ? Number(this.props.balance) <= 0 : Number(this.props.accounts[this.state.accountIndex].balance || 0) <= 0;
    let {coin, isClaimRewardsOnly, balance, disabled} = this.props;

    if (!this.props.isClaimRewardsOnly) {
      balance = this.props.accounts[this.state.accountIndex].balance || 0;
    }

    writeLog('this.props', this.props);
    writeLog('KMD_REWARDS_MIN_THRESHOLD', KMD_REWARDS_MIN_THRESHOLD);
    if (this.props.isClaimRewardsOnly) writeLog('this.props.account.claimableAmount', this.props.account.claimableAmount);
    
    return (
      <React.Fragment>
        {this.props.isClaimRewardsOnly &&
          <button
            className={`button is-primary${this.props.className ? ' ' + this.props.className : ''}`}
            disabled={
              disabled ||
              isNoBalace ||
              (coin === 'KMD' && this.props.account.claimableAmount < KMD_REWARDS_MIN_THRESHOLD && isClaimRewardsOnly)
            }
            onClick={this.initSendCoinForm}>
            {this.props.children}
          </button>
        }
        {!this.props.isClaimRewardsOnly &&
          <li
            onClick={disabled && coin === 'KMD' ? null : this.initSendCoinForm}
            className={disabled && coin === 'KMD' ? 'disabled': ''}>
            <i className="fa fa-paper-plane"></i>
            {this.props.sidebarSize === 'full' &&
              <span className="sidebar-item-title">Send</span>
            }
          </li>
        }
        {!this.state.step &&
          <Modal
            title={this.props.isClaimRewardsOnly ? 'Claim KMD rewards' : 'Send'}
            show={isClaimingRewards}
            handleClose={this.resetState}
            isCloseable={true}
            className="send-coin-modal">
            {this.props.accounts &&
              <React.Fragment>
                <p>
                  Select an account to debit.
                </p>
                <div className="receive-account-selector-block">
                  Account
                  <select
                    className="account-selector minimal"
                    name="accountIndex"
                    value={this.state.accountIndex}
                    onChange={(event) => this.updateAccountIndex(event)}>
                    {this.props.accounts.map((account, index) => (
                      <option
                        key={`send-account-${index}`}
                        value={index}
                        disabled={this.props.accounts[index].balance <= 0}>
                        {coin} {index + 1} [{humanReadableSatoshis(this.props.accounts[index].balance)}]
                      </option>
                    ))}
                  </select>
                </div>
              </React.Fragment>
            }
            {balance > 0 &&
             !this.props.isClaimRewardsOnly &&
              <div
                className="send-form"
                style={{'padding': '0 20px 30px 0'}}>
                <div>
                  Amount <input
                    style={{'marginLeft': '10px'}}
                    type="text"
                    className="form-control edit"
                    name="amountIn"
                    onChange={this.updateInput}
                    value={this.state.amountIn}
                    placeholder="Enter an amount"
                    autoComplete="off"
                    required />
                  <button
                    className="button is-light send-max"
                    onClick={() => this.setSendToMaxAmount(balance)}>
                    Max
                  </button>
                </div>
                <div style={{'margin': '30px 0 20px 0'}}>
                  Send to <input
                    style={{'marginLeft': '10px'}}
                    type="text"
                    className="form-control edit"
                    name="sendToIn"
                    onChange={this.updateInput}
                    value={this.state.sendToIn}
                    placeholder="Enter an address"
                    autoComplete="off"
                    required />
                  <QRReaderModal setRecieverFromScan={this.setRecieverFromScan} />
                </div>
              </div>
            }
            {((!this.props.isClaimRewardsOnly && this.props.accounts[this.state.accountIndex] && this.props.accounts[this.state.accountIndex].length > 0) ||
             (this.props.isClaimRewardsOnly && this.props.account.addresses && this.props.account.addresses.length > 0)) &&
              <div style={this.state.address ? {'padding': '10px 20px 20px 20px'} : {'padding': '10px 20px 30px 20px'}}>
                Send change to
                <select
                  style={{'marginLeft': '10px'}}
                  className="account-index-selector minimal"
                  name="address"
                  value={this.state.address}
                  onChange={(event) => this.updateInput(event)}>
                  <option
                    key="rewards-output-address-default"
                    value="">
                    Unused address (default)
                  </option>
                  {this.props.account.addresses.slice(0, 10).map((item, index) => (
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
            <button
              disabled={
                (!this.state.sendToIn && !isClaimRewardsOnly) ||
                ((!this.state.amountIn || Number(this.state.amountIn) === 0) && !isClaimRewardsOnly)
              }
              className="button is-primary"
              onClick={this.nextStep}>
              Next
            </button>
          </Modal>
        }
        {this.state.step &&
          <ActionListModal
            {...this.state}
            title={this.props.isClaimRewardsOnly ? 'Claim KMD rewards' : 'Send'}
            handleClose={this.resetState}
            show={isClaimingRewards}
            className="send-coin-modal">
            {this.state.error &&
              <React.Fragment>
                <span className="send-form-error">Something is wrong</span>
                <button
                  className="button is-primary btn-back"
                  onClick={this.nextStep}>
                  Back
                </button>
              </React.Fragment>       
            }
            {!this.state.error &&
              <React.Fragment>
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
              </React.Fragment>
            }
          </ActionListModal>
        }
      </React.Fragment>
    );
  }
}

export default SendCoinButton;
