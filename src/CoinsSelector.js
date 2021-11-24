import React from 'react';
import SelectCoinModal from './SelectCoinModal';
import apiEndpoints from './lib/coins';
import {writeLog} from './Debug';

class CoinsSelector extends React.Component {
  state = this.initialState;
  
  get initialState() {
    return {
    };
  };

  checkKMDRewards() {
    const accounts = this.props.coins.KMD.accounts;
    let isRewardsOverdueCounter = 0;
    
    for (let i = 0; i < accounts.length; i++) {
      if (accounts[i].isRewardsOverdue) isRewardsOverdueCounter++;
    }

    return isRewardsOverdueCounter;
  }

  render() {
    writeLog('selectoinmodal props', this.props);

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
              {coinTicker === 'KMD' &&
               this.checkKMDRewards() > 0 &&
               <div
                className="kmd-rewards-main-overdue-badge"
                title={`${this.checkKMDRewards() > 0 && this.checkKMDRewards() < 2 ? 'Rewards claim overdue!' : this.checkKMDRewards() + ' accounts have rewards claim overdue!'}`}>
                <i>{this.checkKMDRewards()}</i>
               </div>
              }
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