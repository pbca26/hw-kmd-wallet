import {formatDistanceToNow} from 'date-fns';
import getRewardEndDateTimestamp from './get-reward-end-date';

const humanRewardEndDate = utxo => {
  const endDate = getRewardEndDateTimestamp(utxo);

  return endDate ? formatDistanceToNow(endDate, {addSuffix: true}) : 'N/A';
};

export default humanRewardEndDate;
