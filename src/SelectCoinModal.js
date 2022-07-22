import React, {useState} from 'react';
import Modal from './Modal';
import CheckAllBalancesButton from './CheckAllBalancesButton';
import apiEndpoints from './lib/coins';
import Toggle from './Toggle';
import './AddCoinModal.scss';
import {sortObject} from './lib/sort';

const apiEndpointsSorted = sortObject(apiEndpoints);

const SelectCoinModal = props => {
  const initialState = {
    isClosed: true,
    enableAirdropDiscovery: false,
    selectedCoins: [],
    coinsList: [],
  };
  const [state, setState] = useState(initialState);

  const setAirdropDiscovery = () => {
    setState(prevState => ({
      ...prevState,
      enableAirdropDiscovery: !state.enableAirdropDiscovery,
    }));
  }

  const close = () => {
    setState(prevState => ({
      ...prevState,
      isClosed: true,
      enableAirdropDiscovery: false,
      selectedCoins: [],
      coinsList: [],
    }));
  }

  const open = () => {
    const allAvailableCoins = Object.keys(apiEndpointsSorted);
    let coinsList = [];

    for (let i = 0; i < allAvailableCoins.length; i++) {
      if (Object.keys(props.coins).indexOf(allAvailableCoins[i]) === -1 &&
          apiEndpointsSorted[allAvailableCoins[i]].enabled)
        coinsList.push(allAvailableCoins[i]);
    }

    setState(prevState => ({
      ...prevState,
      isClosed: false,
      selectedCoins: [],
      coinsList,
    }));
  }

  const selectCoin = coin => {
    let selectedCoins = state.selectedCoins;

    if (selectedCoins.indexOf(coin) > -1) selectedCoins.splice(selectedCoins.indexOf(coin), 1);
    else selectedCoins.push(coin);

    setState(prevState => ({
      ...prevState,
      selectedCoins,
    }));
  }

  const isAirdropCoins = () => {
    const selectCoins = state.selectedCoins;

    for (let i = 0; i < selectCoins.length; i++) {
      if (apiEndpointsSorted[selectCoins[i]].airdrop) return true;
    }
  }

  const render = () => {
    return (
      <React.Fragment>
        <div
          className="inline-coin-icons-tile coins-add-new"
          key="coins-add-new"
          onClick={() => open()}>
          <i className="fa fa-plus coins-add-new-plus-sign"></i>
        </div>
        <Modal
          title="Select coin"
          show={state.isClosed === false}
          handleClose={() => close()}
          isCloseable={true}
          className="Modal-add-coin">
          <div className="block-coin-icons">
            {state.coinsList.map((coinTicker, index) => (
              <div
                className="block-coin-icons-tile"
                key={`coins-${coinTicker}`}
                onClick={() => selectCoin(coinTicker)}>
                {state.selectedCoins.indexOf(coinTicker) > -1 &&
                  <i className="fa fa-check-circle check-icon"></i>
                }
                <img
                  src={`${process.env.NODE_ENV === 'development' ? process.env.PUBLIC_URL + '/' : ''}coins/${coinTicker}.png`}
                  alt={`${coinTicker} icon`} />
                <span className="block-coin-icons-tile-name">{coinTicker}</span>
              </div>
            ))}
          </div>
          {state.selectedCoins.length > 0 &&
            <div className="modal-action-block center">
              {isAirdropCoins() &&
                <div className="select-coin-airdrop-settings">
                  <Toggle
                    label="Enable airdrop funds discovery"
                    name="enableAirdropDiscovery"
                    value={state.enableAirdropDiscovery}
                    cb={setAirdropDiscovery}
                    className="switch"
                    style={{'paddingRight': '20px'}} />
                  {state.enableAirdropDiscovery &&
                    <p>
                      <small>
                        <strong>Notice:</strong> advanced address discovery settings will result in longer processing time!
                      </small>
                    </p>
                  }
                </div>
              }
              <CheckAllBalancesButton
                handleScanData={props.handleScanData}
                checkTipTime={props.checkTipTime}
                vendor={props.vendor}
                explorerEndpoint={props.explorerEndpoint}
                coins={state.selectedCoins}
                closeParent={close}
                enableAirdropDiscovery={state.enableAirdropDiscovery}>
                Begin scan
              </CheckAllBalancesButton>
            </div>
          }
        </Modal>
      </React.Fragment>
    );
  }

  return render();
}

export default SelectCoinModal;