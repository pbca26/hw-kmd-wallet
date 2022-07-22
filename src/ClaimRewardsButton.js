import React from 'react';
import humanReadableSatoshis from './lib/human-readable-satoshis';
import SendCoinButton from './SendCoinButton';

const ClaimRewardsButton = ({
  account,
  vendor,
  balance,
  syncData,
  coin,
  tiptime,
  claimableAmount,
  disabled,
  checkTipTime,
}) => (
  <SendCoinButton
    account={account}
    vendor={vendor}
    balance={balance}
    syncData={syncData}
    coin={coin}
    isClaimRewardsOnly={true}
    tiptime={tiptime}
    disabled={disabled}
    checkTipTime={checkTipTime}
    className="claim-rewards-btn">
    {!disabled && 
      <React.Fragment>
        <i className="fa fa-donate"></i> Claim {humanReadableSatoshis(Math.max(0, claimableAmount))} rewards
      </React.Fragment>
    }
    {disabled &&
      <React.Fragment>
        <i className="fa fa-hourglass-half"></i> Synchronizing data...
      </React.Fragment>
    }
  </SendCoinButton>
);

export default ClaimRewardsButton;