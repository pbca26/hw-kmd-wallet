import React from 'react';
import Modal from './Modal';
import CheckAllBalancesButton from './CheckAllBalancesButton';
import apiEndpoints from './lib/coins';
import './AddCoinModal.scss';
import {setConfigVar} from './lib/account-discovery';
import {SETTINGS} from './constants';

class SelectCoinModal extends React.Component {
  state = this.initialState;
  
  get initialState() {
    this.close = this.close.bind(this);
    this.setAirdropDiscovery = this.setAirdropDiscovery.bind(this);
    this.isAirdropCoins = this.isAirdropCoins.bind(this);
    
    return {
      isClosed: true,
      enableAirdropDiscovery: false,
      selectedCoins: [],
      coinsList: [],
    };
  };

  setAirdropDiscovery() {
    setConfigVar(
      'discoveryGapLimit', !this.state.enableAirdropDiscovery ? SETTINGS.DISCOVERY_GAP_LIMIT_AIRDROP : SETTINGS.DISCOVERY_GAP_LIMIT_DEFAULT
    );

    this.setState({
      enableAirdropDiscovery: !this.state.enableAirdropDiscovery,
    });
  }

  close() {
    this.setState({
      isClosed: true,
      enableAirdropDiscovery: false,
      selectedCoins: [],
      coinsList: [],
    });
  }

  open() {
    const allAvailableCoins = Object.keys(apiEndpoints);
    let coinsList = [];

    for (let i = 0; i < allAvailableCoins.length; i++) {
      if (Object.keys(this.props.coins).indexOf(allAvailableCoins[i]) === -1)
        coinsList.push(allAvailableCoins[i]);
    }

    this.setState({
      isClosed: false,
      selectedCoins: [],
      coinsList,
    });
  }

  selectCoin(coin) {
    let selectedCoins = this.state.selectedCoins;

    if (selectedCoins.indexOf(coin) > -1) selectedCoins.splice(selectedCoins.indexOf(coin), 1);
    else selectedCoins.push(coin);

    this.setState({
      selectedCoins,
    });
  }

  isAirdropCoins() {
    const selectCoins = this.state.selectedCoins;

    for (let i = 0; i < selectCoins.length; i++) {
      if (apiEndpoints[selectCoins[i]].airdrop) return true;
    }
  }

  render() {
    return (
      <React.Fragment>
        <div
          className="inline-coin-icons-tile coins-add-new"
          key="coins-add-new"
          onClick={() => this.open()}>
          <i className="fa fa-plus coins-add-new-plus-sign"></i>
        </div>
        <Modal
          title="Select coin"
          show={this.state.isClosed === false}
          handleClose={() => this.close()}
          isCloseable={true}
          className="Modal-add-coin">
          <div className="block-coin-icons">
            {this.state.coinsList.map((coinTicker, index) => (
              <div
                className="block-coin-icons-tile"
                key={`coins-${coinTicker}`}
                onClick={() => this.selectCoin(coinTicker)}>
                {this.state.selectedCoins.indexOf(coinTicker) > -1 &&
                  <i className="fa fa-check-circle check-icon"></i>
                }
                <img
                  src={`${process.env.NODE_ENV === 'development' ? process.env.PUBLIC_URL + '/' : ''}coins/${coinTicker}.png`}
                  alt={`${coinTicker} icon`} />
                <span className="block-coin-icons-tile-name">{coinTicker}</span>
              </div>
            ))}
          </div>
          {this.state.selectedCoins.length > 0 &&
            <div className="modal-action-block center">
              {this.isAirdropCoins() &&
                <div className="select-coin-airdrop-settings">
                  <span className="slider-text">Enable airdrop funds discovery</span>
                  <label className="switch">
                    <input
                      type="checkbox"
                      name="enableAirdropDiscovery"
                      value={this.state.enableAirdropDiscovery}
                      checked={this.state.enableAirdropDiscovery}
                      readOnly />
                    <span
                      className="slider round"
                      onClick={this.setAirdropDiscovery}></span>
                  </label>
                  {this.state.enableAirdropDiscovery &&
                    <p>
                      <small>
                        <strong>Notice:</strong> advanced address discovery settings will result in longer processing time!
                      </small>
                    </p>
                  }
                </div>
              }
              <CheckAllBalancesButton
                handleScanData={this.props.handleScanData}
                checkTipTime={this.props.checkTipTime}
                vendor={this.props.vendor}
                explorerEndpoint={this.props.explorerEndpoint}
                coins={this.state.selectedCoins}
                closeParent={this.close}>
                Begin scan
              </CheckAllBalancesButton>
            </div>
          }
        </Modal>
      </React.Fragment>
    );
  }
}

export default SelectCoinModal;