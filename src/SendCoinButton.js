import React, {useState, useEffect} from 'react';
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
import Dropdown from './Dropdown';
import Toggle from './Toggle';
import './SendCoin.scss';

// TODO: refactor transaction builder, make math more easier to understand and read

const SendCoinButton = props => {
  const initialState = {
    isDebug: isElectron ? appData.isDev : window.location.href.indexOf('enable-verify') > -1 || (getLocalStorageVar('settings') && getLocalStorageVar('settings').enableDebugTools),
    isClaimingRewards: false,
    error: false,
    success: false,
    actions: getStateActionsInit(props.vendor),
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
  const [state, setState] = useState(initialState);
  
  const setSkipBroadcast = () => {
    if (!state.skipBroadcastClicked) {
      setState(prevState => ({
        ...prevState,
        skipBroadcast: !state.skipBroadcast,
        skipBroadcastClicked: true,
      }));
    }
  }

  const resetState = () => setState(initialState);

  const getUnusedAddressIndexChange = () => {
    const {accountIndex} = state;
    const {isClaimRewardsOnly, account, accounts} = props;

    if (isClaimRewardsOnly) {
      return account.addresses.filter(address => isClaimRewardsOnly ? !address.isChange : address.isChange).length;
    } else {
      return accounts[accountIndex].addresses.filter(address => isClaimRewardsOnly ? !address.isChange : address.isChange).length;
    }
  }
  
  const getUnusedAddressChange = () => {
    const {accountIndex, address} = state;
    const {isClaimRewardsOnly, account, accounts} = props;
    const xpub = isClaimRewardsOnly ? account.xpub : accounts[accountIndex].xpub;

    return address.length ? address : getAddress(getAccountNode(xpub)[isClaimRewardsOnly ? 'externalNode' : 'internalNode'].derive(getUnusedAddressIndexChange()).publicKey);
  }

  const sendCoin = async () => {
    const isUserInputValid = props.isClaimRewardsOnly ? false : validate({state, props});
    const isClaimRewardsOnly = props.isClaimRewardsOnly;

    writeLog(isClaimRewardsOnly ? 'claim kmd rewards button clicked' : 'send coin clicked');
    
    setState(prevState => ({
      ...prevState,
      step: true,
      isClaimingRewards: true,
      skipBroadcast: false,
    }));

    if (!isUserInputValid) {
      const {coin, vendor, isClaimRewardsOnly, account, accounts} = props;
      const {address} = state;
      let currentAction = 'connect';
      let tiptime, explorerIsSet = false;
      
      try {
        if (coin === 'KMD') {
          const explorerUrl = await getAvailableExplorerUrl(coin, blockchain[blockchainAPI]);
          writeLog(`${coin} set api endpoint to ${explorerUrl}`);
          blockchain[blockchainAPI].setExplorerUrl(explorerUrl);
          explorerIsSet = true;

          tiptime = await blockchain[blockchainAPI].getTipTime();
          tiptime = props.checkTipTime(tiptime);
          if (!tiptime) throw new Error('Unable to get tiptime!');
        }

        updateActionState({setState}, currentAction, 'loading');
        const hwIsAvailable = await hw[vendor].isAvailable();
        if (!hwIsAvailable) {
          throw new Error(`${VENDOR[vendor]} device is unavailable!`);
        }
        updateActionState({setState}, currentAction, true);

        currentAction = 'confirmAddress';
        updateActionState({setState}, currentAction, 'loading');

        let accountIndex, utxos, balance;

        if (isClaimRewardsOnly) {
          accountIndex = account.accountIndex;
          utxos = account.utxos;
          balance = account.balance;
        } else {
          accountIndex = state.accountIndex;
          utxos = accounts[accountIndex].utxos;
          balance = accounts[accountIndex].balance;
        }

        writeLog('utxos', utxos);

        let formattedUtxos = formatUtxos(utxos, coin, tiptime);
        
        const txDataPreflightBalanceIn = isClaimRewardsOnly ? balance - TX_FEE * 2 : state.amountIn < humanReadableSatoshis(balance) ? toSats(state.amountIn) + TX_FEE : toSats(state.amountIn);
        const txDataPreflight = transactionBuilder(
          coin === 'KMD' ? Object.assign({}, KOMODO, {kmdInterest: true}) : KOMODO,
          txDataPreflightBalanceIn,
          TX_FEE,
          state.sendToIn ? state.sendToIn : getUnusedAddressChange(),
          getUnusedAddressChange(),
          formattedUtxos
        );

        writeLog('txDataPreflight', txDataPreflight);

        let hwUnusedAddress;
        const unusedAddress = getUnusedAddressChange();
        const derivationPath = `${COIN_DERIVATION_PATH}/${accountIndex}'/${isClaimRewardsOnly ? 0 : 1}/${getUnusedAddressIndexChange()}`;
        
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

        updateActionState({setState}, currentAction, true);
        
        let txData = transactionBuilder(
          coin === 'KMD' ? Object.assign({}, KOMODO, {kmdInterest: true}) : KOMODO,
          txDataPreflightBalanceIn,
          TX_FEE,
          isClaimRewardsOnly ? hwUnusedAddress : state.sendToIn,
          isClaimRewardsOnly || txDataPreflight.change > 0 || txDataPreflight.totalInterest ? hwUnusedAddress : 'none',
          formattedUtxos
        );

        writeLog('amount in', isClaimRewardsOnly ? balance - TX_FEE * 2 : toSats(state.amountIn));
        writeLog('txData', txData);

        const filteredUtxos = filterUtxos(txData.inputs, formattedUtxos);

        currentAction = 'approveTransaction';
        updateActionState({setState}, currentAction, 'loading');

        if (!isClaimRewardsOnly && !txData.totalInterest && txData.change) {
          txData.change += TX_FEE;
        }

        const txbData = {
          isClaimingRewards: true,
          amount: !isClaimRewardsOnly && txData.totalInterest && txData.outputAddress === txData.changeAddress ? txData.value - TX_FEE : state.amountIn < humanReadableSatoshis(balance) ? txData.value - TX_FEE : txData.value,
          sendTo: txData.outputAddress,
          changeTo: txData.changeAddress,
          change: txData.change === 'none' ? 0 : txData.change,
          skipBroadcast: state.skipBroadcast,
          skipBroadcastClicked: false,
          rewards: txData.totalInterest - TX_FEE,
        };

        setState(prevState => ({
          ...prevState,
          txbData
        }));
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
          throw new Error(`${VENDOR[props.vendor]} failed to generate a valid transaction`);
        }
        updateActionState({setState}, currentAction, true);
        
        if (state.skipBroadcast) {
          setState(prevState => ({
            ...prevState,
            success: <SendCoinRawTxRender rawtx={rawtx} />
          }));
          setTimeout(() => {
            props.syncData(props.coin);
          }, 5000);
        } else {
          currentAction = 'broadcastTransaction';
          updateActionState({setState}, currentAction, 'loading');

          if (!explorerIsSet) {
            const explorerUrl = await getAvailableExplorerUrl(coin, blockchain[blockchainAPI]);
    
            writeLog(`${coin} set api endpoint to ${explorerUrl}`);
            blockchain[blockchainAPI].setExplorerUrl(explorerUrl);
          }

          const {txid} = await blockchain[blockchainAPI].broadcast(rawtx);
          if (!txid || txid.length !== 64) {
            throw new Error('Unable to broadcast transaction');
          }
          updateActionState({setState}, currentAction, true);

          setState(prevState => ({
            ...prevState,
            success: <SendCoinTxLink txid={txid} coin={coin} />
          }));
          setTimeout(() => {
            props.syncData(props.coin);
          }, 5000);
        }
      } catch (error) {
        writeLog(error);
        updateActionState({setState}, currentAction, false);
        setState(prevState => ({
          ...prevState,
          error: error.message
        }));
      }
    } else {
      writeLog(isUserInputValid);
      updateActionState({setState}, 'connect', false);
      setState(prevState => ({
        ...prevState,
        error: isUserInputValid
      }));
    }
  };

  const initSendCoinForm = () => {
    setState(prevState => ({
      ...initialState,
      isClaimingRewards: true,
      skipBroadcast: false,
    }));
  }

  const nextStep = () => {
    if (!state.step) {
      sendCoin();
    } else {
      setState(prevState => ({
        ...prevState,
        step: !state.step,
        error: false,
      }));
    }
  }

  const updateInput = e => {
    if (e.target.name === 'sendToIn') {
      e.target.value = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
    } else if (e.target.name === 'amountIn') {
      e.target.value = e.target.value.replace(/[^0-9.]/g, '');
    }

    writeLog(e.target.name, e.target.value);
    
    setState(prevState => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  }

  useEffect(() => {
    writeLog('send coin modal state', state);
  });

  const setSendToMaxAmount = balance => {
    setState(prevState => ({
      ...prevState,
      amountIn: humanReadableSatoshis(balance),
    }));
  }

  const updateAccountIndex = e => {
    setState(prevState => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  }

  const setRecieverFromScan = data => {
    setState(prevState => ({
      ...prevState,
      sendToIn: data.replace(/[^a-zA-Z0-9]/g, ''),
    }));
    writeLog('send coin setRecieverFromScan', data);
  }

  const renderChangeAddressDropdown = () => {
    const {accountIndex, address} = state;
    const {isClaimRewardsOnly, account, accounts} = props;
    const dropdownChangeAddressItems = account && account.addresses ? [{
      value: '',
      label: 'Unused address (default)'
    }]
    .concat(account.addresses.slice(0, KMD_REWARDS_CLAIM_ACCOUNT_OVERRIDE_LIMIT).map((item, index) => (
      {
        value: item.address,
        label: item.address,
      }
    ))) : [];
    
    return (
      <React.Fragment>
        {((!isClaimRewardsOnly && accounts[accountIndex] && accounts[accountIndex].length > 0) ||
          (isClaimRewardsOnly && account.addresses && account.addresses.length > 0)) &&
          <div className={address ? 'send-coin-modal-style4' : 'send-coin-modal-style5'}>
            Send change to
            <Dropdown
              value={address}
              name="address"
              className="account-index-selector send-coin-modal-style3"
              items={dropdownChangeAddressItems}
            cb={updateAccountIndex} />
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

  const renderSkipBroadcastToggle = () => {
    return state.isDebug ? (
      <Toggle
        label="Don't broadcast transaction"
        name="skipBroadcast"
        value={state.skipBroadcast}
        cb={setSkipBroadcast}
        className="switch dev"
        style={{'paddingRight': '20px'}} />
    ) : null;
  }

  const renderStep1 = () => {
    const {isClaimingRewards, accountIndex} = state;
    const {coin, isClaimRewardsOnly, accounts} = props;
    let dropdownAccountIndexItems;
    let {balance} = props;
    
    if (!isClaimRewardsOnly) {
      balance = accounts[accountIndex].balance || 0;
      dropdownAccountIndexItems = accounts.map((account, index) => (
        {
          value: index,
          label: `${coin} ${index + 1} [${humanReadableSatoshis(accounts[index].balance)}]`,
          disabled: accounts[index].balance <= 0
        }
      ));
    }

    return !state.step ? (
      <Modal
        title={isClaimRewardsOnly ? 'Claim KMD rewards' : 'Send'}
        show={isClaimingRewards}
        handleClose={resetState}
        isCloseable={true}
        className="send-coin-modal">
        {accounts &&
        !isClaimRewardsOnly &&
          <React.Fragment>
            <p>
              Select an account to debit.
            </p>
            <div className="receive-account-selector-block">
              Account
              <Dropdown
                value={accountIndex}
                name="accountIndex"
                className="account-selector"
                items={dropdownAccountIndexItems}
                cb={updateAccountIndex} />
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
                onChange={updateInput}
                value={state.amountIn}
                placeholder="Enter an amount"
                autoComplete="off"
                required />
              <button
                className="button is-light send-max"
                onClick={() => setSendToMaxAmount(balance)}>
                Max
              </button>
            </div>
            <div className="send-coin-modal-style2">
              Send to <input
                type="text"
                className="form-control edit send-coin-modal-style3"
                name="sendToIn"
                onChange={updateInput}
                value={state.sendToIn}
                placeholder="Enter an address"
                autoComplete="off"
                required />
              <QRReaderModal setRecieverFromScan={setRecieverFromScan} />
            </div>
          </div>
        }
        {renderChangeAddressDropdown()}
        <button
          disabled={
            (!state.sendToIn && !isClaimRewardsOnly) ||
            ((!state.amountIn || Number(state.amountIn) === 0) && !isClaimRewardsOnly)
          }
          className="button is-primary"
          onClick={nextStep}>
          Next
        </button>
      </Modal>
    ) : null;
  }

  const renderStep2 = () => {
    const {isClaimingRewards} = state;
    const {coin, isClaimRewardsOnly, vendor} = props;

    return state.step ? (
      <ActionListModal
        {...state}
        title={isClaimRewardsOnly ? 'Claim KMD rewards' : 'Send'}
        handleClose={resetState}
        show={isClaimingRewards}
        className="send-coin-modal">
        {state.error &&
          <React.Fragment>
            <span className="send-form-error">Something is wrong</span>
            <button
              className="button is-primary btn-back"
              onClick={nextStep}>
              Back
            </button>
          </React.Fragment>       
        }
        {!state.error &&
          <React.Fragment>
            {!state.sendTo &&
              <p>Awaiting user input...</p>
            }
            {state.sendTo &&
            !isClaimRewardsOnly &&
              <p>
                Send <strong>{humanReadableSatoshis(state.amount)} {coin}</strong> to <strong>{state.sendTo}</strong>
              </p>
            }
            {state.change > 0 &&
              state.isDebug &&
              <p>
                Send change <strong>{humanReadableSatoshis(state.change)} {coin}</strong> to address: <strong>{state.changeTo}</strong>
              </p>
            }
            {state.rewards > 0 &&
              <React.Fragment>
                <p>
                  Claim <strong>{humanReadableSatoshis(state.rewards - TX_FEE)} {coin}</strong> rewards to address: <strong>{state.changeTo}</strong>.
                </p>
                {isClaimRewardsOnly &&
                  <p>
                    You should receive a total of <strong>{humanReadableSatoshis(state.amount)} {coin}</strong>.
                  </p>
                }
              </React.Fragment>
            }
            {coin === 'KMD' &&
             vendor === 'trezor' &&
            (isClaimingRewards || state.rewards > 0) &&
              <p>There will be an additional message on the latest firmware versions <strong>"Warning! Locktime is set but will have no effect. Continue?"</strong>. You need to approve it in order to claim interest.</p>
            }
            {renderSkipBroadcastToggle()}
          </React.Fragment>
        }
      </ActionListModal>
    ) : null;
  }

  const render = () => {
    const {accountIndex} = state;
    const {coin, isClaimRewardsOnly, account, accounts, className, children, sidebarSize, disabled} = props;
    let {balance} = props;
    const isNoBalace = isClaimRewardsOnly ? Number(balance) <= 0 : Number(accounts[accountIndex].balance || 0) <= 0;
    
    if (!isClaimRewardsOnly) {
      balance = props.accounts[state.accountIndex].balance || 0;
    }

    writeLog('send coin button props', props);
    writeLog('KMD_REWARDS_MIN_THRESHOLD', KMD_REWARDS_MIN_THRESHOLD);
    if (isClaimRewardsOnly) writeLog('props.account.claimableAmount', account.claimableAmount);
    
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
            onClick={initSendCoinForm}>
            {children}
          </button>
        }
        {!props.isClaimRewardsOnly &&
          <li
            onClick={disabled && coin === 'KMD' ? null : initSendCoinForm}
            className={disabled && coin === 'KMD' ? 'disabled': ''}>
            <i className="fa fa-paper-plane"></i>
            {sidebarSize === 'full' &&
              <span className="sidebar-item-title">Send</span>
            }
          </li>
        }
        {renderStep1()}
        {renderStep2()}
      </React.Fragment>
    );
  }

  return render();
}

export default SendCoinButton;
