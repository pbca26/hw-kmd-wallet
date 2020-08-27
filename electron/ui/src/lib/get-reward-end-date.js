const KOMODO_ENDOFERA = 7777777;
const LOCKTIME_THRESHOLD = 500000000;
const ONE_MONTH_CAP_HARDFORK = 1000000;
const ONE_SECOND = 1000;
const ONE_MONTH = 31 * 24 * 60 * 60 * ONE_SECOND;
const ONE_YEAR = 365 * 24 * 60 * 60 * ONE_SECOND;

const getRewardEndDate = ({locktime, height}) => {
  // Return false if UTXO for rewards
  if (
    (height >= KOMODO_ENDOFERA) ||
    (locktime < LOCKTIME_THRESHOLD) ||
    (!height)
  ) {
    return false;
  }

  // Convert locktime to milliseconds
  locktime = (locktime * ONE_SECOND);

  // Get reward period
  const rewardPeriod = (height >= ONE_MONTH_CAP_HARDFORK) ? ONE_MONTH : ONE_YEAR;

  return locktime + rewardPeriod;
};

export default getRewardEndDate;
