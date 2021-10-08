import React from 'react';
import SelectCoinModal from './SelectCoinModal';
import apiEndpoints from './lib/coins';

class CoinsSelector extends React.Component {
  state = this.initialState;
  
  get initialState() {
    return {
    };
  };

  render() {
    console.warn('selectoinmodal props', this.props);

    return (
      <div className="coins-holdings-block">
        <h3>Holdings</h3>
        <div className="inline-coin-icons">
          {Object.keys(this.props.coins).map((coinTicker, index) => (
            <div
              className="inline-coin-icons-tile"
              key={`coins-${coinTicker}`}
              onClick={() => this.props.setActiveCoin(coinTicker)}>
              <img src={`coins/${coinTicker}.png`} />
            </div>
          ))}
          <SelectCoinModal
            addCoins={this.props.addCoins}
            coins={this.props.coins}
            handleScanData={this.props.handleScanData}
            checkTipTime={this.props.checkTipTime}
            vendor={this.props.vendor}
            explorerEndpoint={this.props.explorerEndpoint} />
        </div>
      </div>
    );
  }
}

export default CoinsSelector;