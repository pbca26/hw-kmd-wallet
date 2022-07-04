import React from 'react';
import SelectCoinModal from './SelectCoinModal';
import {writeLog} from './Debug';
import './CoinsSelector.scss';

const CoinsSelector = props => {
  const checkKMDRewards = () => {
    const accounts = props.coins.KMD.accounts;
    let isRewardsOverdueCounter = 0;
    
    for (let i = 0; i < accounts.length; i++) {
      if (accounts[i].isRewardsOverdue) isRewardsOverdueCounter++;
    }

    return isRewardsOverdueCounter;
  }

  const render = () => {
    writeLog('selectoinmodal props', props);

    return (
      <div className="coins-holdings-block">
        <h3>Holdings</h3>
        <div className="inline-coin-icons">
          {Object.keys(props.coins).map((coinTicker, index) => (
            <div
              className="inline-coin-icons-tile"
              key={`coins-${coinTicker}`}
              onClick={() => props.setActiveCoin(coinTicker)}>
              <div className="coin-icons-wrapper-container">
                <div className={`coin-icons-wrapper ${coinTicker}-icon-size-md`}>
                  <div
                    className={`coin-icons ${coinTicker}`}
                    style={{backgroundImage: `url('${process.env.NODE_ENV === 'development' ? process.env.PUBLIC_URL + '/' : ''}coin-icons.png')`}}></div>
                </div>
              </div>
              {coinTicker === 'KMD' &&
               checkKMDRewards() > 0 &&
               <div
                className="kmd-rewards-main-overdue-badge"
                title={`${checkKMDRewards() > 0 && checkKMDRewards() < 2 ? 'Rewards claim overdue!' : checkKMDRewards() + ' accounts have rewards claim overdue!'}`}>
                <i>{checkKMDRewards()}</i>
               </div>
              }
            </div>
          ))}
          <SelectCoinModal
            addCoins={props.addCoins}
            coins={props.coins}
            handleScanData={props.handleScanData}
            checkTipTime={props.checkTipTime}
            vendor={props.vendor}
            explorerEndpoint={props.explorerEndpoint} />
        </div>
      </div>
    );
  }

  return render();
}

export default CoinsSelector;