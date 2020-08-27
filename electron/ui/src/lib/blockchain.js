import {INSIGHT_API_URL} from '../constants';

let explorerUrl = INSIGHT_API_URL.komodoplatform;

export const setExplorerUrl = (name) => {
  explorerUrl = INSIGHT_API_URL[name];
};

const req = async (endpoint, postData) => {
  const opts = {};

  if (postData) {
    opts.body = JSON.stringify(postData);
    opts.headers = new Headers();
    opts.headers.append('Content-Type', 'application/json');
    opts.headers.append('Content-Length', opts.body.length);
    opts.method = 'POST';
  }

  const response = await fetch(`${explorerUrl}${endpoint}`, opts);
  const isJson = response.headers.get('Content-Type').includes('application/json');

  const body = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    throw new Error(body);
  }

  return body;
};

const getAddress = address => req(`addr/${address}/?noTxList=1`);

const getUtxos = addresses => req(`addrs/utxo`, {addrs: addresses.join(',')});

const getTransaction = txid => req(`tx/${txid}`);

const getRawTransaction = txid => req(`rawtx/${txid}`);

const getBestBlockHash = () => req('status?q=getBestBlockHash');

const getBlock = blockHash => req(`block/${blockHash}`);

const getTipTime = async () => {
  const {bestblockhash} = await getBestBlockHash();
  const block = await getBlock(bestblockhash);

  return block.time;
};

const broadcast = transaction => req('tx/send', {rawtx: transaction});

export const getInfo = async (explorerUrl) => {
  try {
    const response = await fetch(`${explorerUrl}/status?q=getInfo`);
    const isJson = response.headers.get('Content-Type').includes('application/json');

    const body = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      throw new Error(body);
    }

    return body;
  } catch (e) {
    return null;
  }
};

const blockchain = {
  getInfo,
  getAddress,
  getUtxos,
  getTransaction,
  getRawTransaction,
  getBestBlockHash,
  getBlock,
  getTipTime,
  broadcast,
};

export default blockchain;
