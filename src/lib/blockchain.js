import BlockchainInsight from './blockchain-insight';
import BlockchainSPV from './blockchain-spv';

let blockchain = {
  insight: BlockchainInsight,
  spv: BlockchainSPV,
};
export let blockchainAPI = 'insight';

export const setBlockchainAPI = (name) => {
  if (name === 'insight') blockchainAPI = 'insight';
  if (name === 'spv') blockchainAPI = 'spv';

  console.warn('setBlockchainAPI', name);
};

export default blockchain;
