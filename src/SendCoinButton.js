import React from 'react';
import ActionListModal from './ActionListModal';
import Modal from './Modal';
import hw from './lib/hw';
import blockchain, {blockchainAPI} from './lib/blockchain';
import getAddress from './lib/get-address';
import transactionBuilder from './lib/transaction-builder';
import {toSats} from './lib/math';
import updateActionState from './lib/update-action-state';
import humanReadableSatoshis from './lib/human-readable-satoshis';
import {getAccountNode} from './lib/account-discovery';
import {
  TX_FEE,
  KMD_REWARDS_MIN_THRESHOLD,
  KOMODO,
  VENDOR,
  COIN_DERIVATION_PATH,
  KMD_REWARDS_CLAIM_ACCOUNT_OVERRIDE_LIMIT,
} from './constants';
import {
  isElectron,
  appData,
} from './Electron';
import {getLocalStorageVar} from './lib/localstorage-util';
import {writeLog} from './Debug';
import {formatUtxos, filterUtxos, validate, getAvailableExplorerUrl, getStateActionsInit} from './send-coin-helpers';
import QRReaderModal from './QRReaderModal';
import {SendCoinRawTxRender, SendCoinTxLink} from './SendCoinModalFragments';
import './SendCoin.scss';

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
      isDebug: isElectron ? appData.isDev : window.location.href.indexOf('enable-verify') > -1 || (getLocalStorageVar('settings') && getLocalStorageVar('settings').enableDebugTools),
      isClaimingRewards: false,
      error: false,
      success: false,
      actions: getStateActionsInit(this.props.vendor),
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
    const {isClaimRewardsOnly, account, accounts} = this.props;
    const {accountIndex} = this.state;

    if (isClaimRewardsOnly) {
      return account.addresses.filter(address => !address.isChange).length;
    } else {
      return accounts[accountIndex].addresses.filter(address => !address.isChange).length;
    }
  }

  getUnusedAddress = () => {
    const {address, accountIndex} = this.state;
    const {isClaimRewardsOnly, account, accounts} = this.props;
    const xpub = isClaimRewardsOnly ? account.xpub : accounts[accountIndex].xpub;

    return address.length ? address : getAddress(getAccountNode(xpub).externalNode.derive(this.getUnusedAddressIndex()).publicKey);
  }

  getUnusedAddressIndexChange = () => {
    const {accountIndex} = this.state;
    const {isClaimRewardsOnly, account, accounts} = this.props;

    if (isClaimRewardsOnly) {
      return account.addresses.filter(address => isClaimRewardsOnly ? !address.isChange : address.isChange).length;
    } else {
      return accounts[accountIndex].addresses.filter(address => isClaimRewardsOnly ? !address.isChange : address.isChange).length;
    }
  }
  
  getUnusedAddressChange = () => {
    const {accountIndex, address} = this.state;
    const {isClaimRewardsOnly, account, accounts} = this.props;
    const xpub = isClaimRewardsOnly ? account.xpub : accounts[accountIndex].xpub;

    return address.length ? address : getAddress(getAccountNode(xpub)[isClaimRewardsOnly ? 'externalNode' : 'internalNode'].derive(this.getUnusedAddressIndexChange()).publicKey);
  }
  
  getOutputs = () => {
    const {accountIndex} = this.state;
    const {isClaimRewardsOnly, account, accounts} = this.props;
    const balance = isClaimRewardsOnly ? account.balance : accounts[accountIndex].balance;    
    const claimableAmount = isClaimRewardsOnly ? account.claimableAmount : accounts[accountIndex].claimableAmount;    

    return {
      address: this.getUnusedAddress(),
      value: (balance + claimableAmount),
    };
  };

  sendCoin = async () => {
    const isUserInputValid = this.props.isClaimRewardsOnly ? false : validate({state: this.state, props: this.props});
    const isClaimRewardsOnly = this.props.isClaimRewardsOnly;

    writeLog(isClaimRewardsOnly ? 'claim kmd rewards button clicked' : 'send coin clicked');
    
    this.setState({
      step: true,
      isClaimingRewards: true,
      skipBroadcast: false,
    });

    if (!isUserInputValid) {
      const {coin, vendor, isClaimRewardsOnly, account, accounts} = this.props;
      const {address} = this.state;
      let currentAction = 'connect';
      let tiptime, explorerIsSet = false;
      
      try {
        if (coin === 'KMD') {
          const explorerUrl = await getAvailableExplorerUrl(coin, blockchain[blockchainAPI]);
          writeLog(`${coin} set api endpoint to ${explorerUrl}`);
          blockchain[blockchainAPI].setExplorerUrl(explorerUrl);
          explorerIsSet = true;

          tiptime = await blockchain[blockchainAPI].getTipTime();
          tiptime = this.props.checkTipTime(tiptime);
          if (!tiptime) throw new Error('Unable to get tiptime!');
        }

        updateActionState(this, currentAction, 'loading');
        const hwIsAvailable = await hw[vendor].isAvailable();
        if (!hwIsAvailable) {
          throw new Error(`${VENDOR[vendor]} device is unavailable!`);
        }
        updateActionState(this, currentAction, true);

        currentAction = 'confirmAddress';
        updateActionState(this, currentAction, 'loading');

        let accountIndex, utxos, balance;

        if (isClaimRewardsOnly) {
          accountIndex = account.accountIndex;
          utxos = account.utxos;
          balance = account.balance;
        } else {
          accountIndex = this.state.accountIndex;
          utxos = accounts[accountIndex].utxos;
          balance = accounts[accountIndex].balance;
        }

        writeLog('utxos', utxos);

        let formattedUtxos = formatUtxos(utxos, coin, tiptime);
        
        const txDataPreflightBalanceIn = isClaimRewardsOnly ? balance - TX_FEE * 2 : this.state.amountIn < humanReadableSatoshis(balance) ? toSats(this.state.amountIn) + TX_FEE : toSats(this.state.amountIn);
        const txDataPreflight = transactionBuilder(
          coin === 'KMD' ? Object.assign({}, KOMODO, {kmdInterest: true}) : KOMODO,
          txDataPreflightBalanceIn,
          TX_FEE,
          this.state.sendToIn ? this.state.sendToIn : this.getUnusedAddressChange(),
          this.getUnusedAddressChange(),
          formattedUtxos
        );

        writeLog('txDataPreflight', txDataPreflight);

        let hwUnusedAddress;
        const unusedAddress = this.getUnusedAddressChange();
        const derivationPath = `${COIN_DERIVATION_PATH}/${accountIndex}'/${isClaimRewardsOnly ? 0 : 1}/${this.getUnusedAddressIndexChange()}`;
        
        writeLog('derivationPath', derivationPath);
        
        if (isClaimRewardsOnly ||
            txDataPreflight.change > 0 ||
            txDataPreflight.totalInterest) {
          hwUnusedAddress = address.length ? address : await hw[vendor].getAddress(
            derivationPath,
            isClaimRewardsOnly && vendor === 'trezor' ? true : false
          );
        
          writeLog('hwUnusedAddress', hwUnusedAddress);
          if (hwUnusedAddress !== unusedAddress) {
            throw new Error(`${VENDOR[vendor]} derived address "${hwUnusedAddress}" doesn't match browser derived address "${unusedAddress}"`);
          }
        }

        updateActionState(this, currentAction, true);
        
        let txData = transactionBuilder(
          coin === 'KMD' ? Object.assign({}, KOMODO, {kmdInterest: true}) : KOMODO,
          txDataPreflightBalanceIn,
          TX_FEE,
          isClaimRewardsOnly ? hwUnusedAddress : this.state.sendToIn,
          isClaimRewardsOnly || txDataPreflight.change > 0 || txDataPreflight.totalInterest ? hwUnusedAddress : 'none',
          formattedUtxos
        );

        writeLog('amount in', isClaimRewardsOnly ? balance - TX_FEE * 2 : toSats(this.state.amountIn));
        writeLog('txData', txData);

        const filteredUtxos = filterUtxos(txData.inputs, formattedUtxos);

        currentAction = 'approveTransaction';
        updateActionState(this, currentAction, 'loading');

        if (!isClaimRewardsOnly && !txData.totalInterest && txData.change) {
          txData.change += TX_FEE;
        }

        const txbData = {
          isClaimingRewards: true,
          amount: !isClaimRewardsOnly && txData.totalInterest && txData.outputAddress === txData.changeAddress ? txData.value - TX_FEE : this.state.amountIn < humanReadableSatoshis(balance) ? txData.value - TX_FEE : txData.value,
          sendTo: txData.outputAddress,
          changeTo: txData.changeAddress,
          change: txData.change === 'none' ? 0 : txData.change,
          skipBroadcast: this.state.skipBroadcast,
          skipBroadcastClicked: false,
          rewards: txData.totalInterest - TX_FEE,
        };

        this.setState(txbData);
        writeLog('txb data', txbData);

        let rawtx;
        
        if (isClaimRewardsOnly) {
          rawtx = await hw[vendor].createTransaction(
            filteredUtxos,
            [{
              address: txData.outputAddress,
              value: txData.value
            }],
            coin === 'KMD'
          );
        } else {
          rawtx = await hw[vendor].createTransaction(
            filteredUtxos, txData.change > 0 || (txData.totalInterest && txData.outputAddress !== txData.changeAddress) ?
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
          [{
            address: txData.outputAddress,
            value: txData.value
            },
            {
              address: txData.changeAddress,
              value: txData.change + txData.totalInterest - (isClaimRewardsOnly ? 0 : TX_FEE * 2),
              derivationPath
            }] : [{
              address: txData.outputAddress,
              value: txData.value
            }]);

        writeLog('rawtx', rawtx);
        if (!rawtx || typeof rawtx !== 'string') {
          throw new Error(`${VENDOR[this.props.vendor]} failed to generate a valid transaction`);
        }
        updateActionState(this, currentAction, true);
        
        if (this.state.skipBroadcast) {
          this.setState({
            success: <SendCoinRawTxRender rawtx={rawtx} />
          });
          setTimeout(() => {
            this.props.syncData(this.props.coin);
          }, 5000);
        } else {
          currentAction = 'broadcastTransaction';
          updateActionState(this, currentAction, 'loading');

          if (!explorerIsSet) {
            const explorerUrl = await getAvailableExplorerUrl(coin, blockchain[blockchainAPI]);
    
            writeLog(`${coin} set api endpoint to ${explorerUrl}`);
            blockchain[blockchainAPI].setExplorerUrl(explorerUrl);
          }

          const {txid} = await blockchain[blockchainAPI].broadcast(rawtx);
          if (!txid || txid.length !== 64) {
            throw new Error('Unable to broadcast transaction');
          }
          updateActionState(this, currentAction, true);

          this.setState({
            success: <SendCoinTxLink txid={txid} coin={coin} />
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

    writeLog(e.target.name, e.target.value);
    
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

  renderChangeAddressDropdown() {
    const {accountIndex, address} = this.state;
    const {isClaimRewardsOnly, account, accounts} = this.props;
    
    return (
      <React.Fragment>
        {((!isClaimRewardsOnly && accounts[accountIndex] && accounts[accountIndex].length > 0) ||
          (isClaimRewardsOnly && account.addresses && account.addresses.length > 0)) &&
          <div className={address ? 'send-coin-modal-style4' : 'send-coin-modal-style5'}>
            Send change to
            <select
              className="account-index-selector send-coin-modal-style3"
              name="address"
              value={address}
              onChange={(event) => this.updateInput(event)}>
              <option
                key="rewards-output-address-default"
                value="">
                Unused address (default)
              </option>
              {account.addresses.slice(0, KMD_REWARDS_CLAIM_ACCOUNT_OVERRIDE_LIMIT).map((item, index) => (
                <option
                  key={`rewards-output-address-${index}`}
                  value={item.address}>
                  {item.address}
                </option>
              ))}
            </select>
          </div>
        }
        {address &&
          <div className="send-coin-modal-style6">
            <strong>Warning:</strong> sending coins to a non-default address will break so called pseudo anonimity (one time address usage) and link your addresses together! This is not recommended option.
          </div>
        }
       </React.Fragment>
    );
  }

  renderSkipBroadcastToggle() {
    return this.state.isDebug ? (
      <label
        className="switch dev"
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
    ) : null;
  }

  renderStep1() {
    const {isClaimingRewards, accountIndex} = this.state;
    const {coin, isClaimRewardsOnly, accounts} = this.props;
    let {balance} = this.props;
    
    if (!isClaimRewardsOnly) {
      balance = accounts[accountIndex].balance || 0;
    }

    return !this.state.step ? (
      <Modal
        title={isClaimRewardsOnly ? 'Claim KMD rewards' : 'Send'}
        show={isClaimingRewards}
        handleClose={this.resetState}
        isCloseable={true}
        className="send-coin-modal">
        {accounts &&
          <React.Fragment>
            <p>
              Select an account to debit.
            </p>
            <div className="receive-account-selector-block">
              Account
              <select
                className="account-selector minimal"
                name="accountIndex"
                value={accountIndex}
                onChange={(event) => this.updateAccountIndex(event)}>
                {accounts.map((account, index) => (
                  <option
                    key={`send-account-${index}`}
                    value={index}
                    disabled={accounts[index].balance <= 0}>
                    {coin} {index + 1} [{humanReadableSatoshis(accounts[index].balance)}]
                  </option>
                ))}
              </select>
            </div>
          </React.Fragment>
        }
        {balance > 0 &&
        !isClaimRewardsOnly &&
          <div className="send-form send-coin-modal-style1">
            <div>
              Amount <input
                type="text"
                className="form-control edit send-coin-modal-style3"
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
            <div className="send-coin-modal-style2">
              Send to <input
                type="text"
                className="form-control edit send-coin-modal-style3"
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
        {this.renderChangeAddressDropdown()}
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
    ) : null;
  }

  renderStep2() {
    const {isClaimingRewards} = this.state;
    const {coin, isClaimRewardsOnly, vendor} = this.props;

    return this.state.step ? (
      <ActionListModal
        {...this.state}
        title={isClaimRewardsOnly ? 'Claim KMD rewards' : 'Send'}
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
            {coin === 'KMD' &&
             vendor === 'trezor' &&
            (isClaimingRewards || this.state.rewards > 0) &&
              <p>There will be an additional message on the latest firmware versions <strong>"Warning! Locktime is set but will have no effect. Continue?"</strong>. You need to approve it in order to claim interest.</p>
            }
            {this.renderSkipBroadcastToggle()}
          </React.Fragment>
        }
      </ActionListModal>
    ) : null;
  }

  render() {
    const {accountIndex} = this.state;
    const {coin, isClaimRewardsOnly, account, accounts, className, children, sidebarSize, disabled} = this.props;
    let {balance} = this.props;
    const isNoBalace = isClaimRewardsOnly ? Number(balance) <= 0 : Number(accounts[accountIndex].balance || 0) <= 0;
    
    if (!isClaimRewardsOnly) {
      balance = this.props.accounts[this.state.accountIndex].balance || 0;
    }

    writeLog('send coin button props', this.props);
    writeLog('KMD_REWARDS_MIN_THRESHOLD', KMD_REWARDS_MIN_THRESHOLD);
    if (isClaimRewardsOnly) writeLog('this.props.account.claimableAmount', account.claimableAmount);
    
    return (
      <React.Fragment>
        {isClaimRewardsOnly &&
          <button
            className={`button is-primary${className ? ' ' + className : ''}`}
            disabled={
              disabled ||
              isNoBalace ||
              (coin === 'KMD' && account.claimableAmount < KMD_REWARDS_MIN_THRESHOLD && isClaimRewardsOnly)
            }
            onClick={this.initSendCoinForm}>
            {children}
          </button>
        }
        {!this.props.isClaimRewardsOnly &&
          <li
            onClick={disabled && coin === 'KMD' ? null : this.initSendCoinForm}
            className={disabled && coin === 'KMD' ? 'disabled': ''}>
            <i className="fa fa-paper-plane"></i>
            {sidebarSize === 'full' &&
              <span className="sidebar-item-title">Send</span>
            }
          </li>
        }
        {this.renderStep1()}
        {this.renderStep2()}
      </React.Fragment>
    );
  }
}

export default SendCoinButton;
