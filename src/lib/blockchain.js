import BlockchainInsight from './blockchain-insight';
import BlockchainSPV from './blockchain-spv';
import {writeLog} from '../Debug';

let blockchain = {
  insight: BlockchainInsight,
  spv: BlockchainSPV,
};
export let blockchainAPI = 'insight';

export const setBlockchainAPI = (name) => {
  if (name === 'insight') blockchainAPI = 'insight';
  if (name === 'spv') blockchainAPI = 'spv';

  writeLog('setBlockchainAPI', name);
};

export default blockchain;
