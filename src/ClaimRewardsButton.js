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
  handleRewardClaim,
  claimableAmount,
  address
}) => (
  <SendCoinButton
    account={account}
    handleRewardClaim={handleRewardClaim}
    vendor={vendor}
    balance={balance}
    syncData={syncData}
    address={address}
    coin={coin}
    isClaimRewardsOnly={true}
    tiptime={tiptime}
    className="claim-rewards-btn">
    Claim {humanReadableSatoshis(Math.max(0, claimableAmount))} rewards
  </SendCoinButton>
);

export default ClaimRewardsButton;