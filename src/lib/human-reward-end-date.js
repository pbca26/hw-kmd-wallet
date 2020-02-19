import {distanceInWordsToNow} from 'date-fns';
import getRewardEndDateTimestamp from './get-reward-end-date';

const humanRewardEndDate = utxo => {
  const endDate = getRewardEndDateTimestamp(utxo);

  return endDate ? distanceInWordsToNow(endDate, {addSuffix: true}) : 'N/A';
};

export default humanRewardEndDate;
