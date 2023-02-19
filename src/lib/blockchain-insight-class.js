export const getInfo = async explorerUrl => {
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

class insightConnector {
  constructor(url) {
    this.url = url;
  }

  setExplorerUrl(url) {
    this.url = url;
  }

  #get(endpoint, postData) {
    return new Promise(async(resolve, reject) => {
      const opts = {};

      if (postData) {
        opts.body = JSON.stringify(postData);
        opts.headers = new Headers();
        opts.headers.append('Content-Type', 'application/json');
        opts.headers.append('Content-Length', opts.body.length);
        opts.method = 'POST';
      }

      const response = await fetch(`${this.url}${endpoint}`, opts);
      const isJson = response.headers.get('Content-Type').includes('application/json');

      const body = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        throw new Error(body);
      }

      resolve(body);
    });
  }

  getAddress(address) {
    return this.#get(`addr/${address}/?noTxList=1`);
  }

  getAddressHistory(address) {
    return this.#get(`/txs?address=${address}`);
  }

  getHistory(addresses, historyLength) {
    return this.#get(`addrs/txs`, {
      addrs: addresses.join(','),
      from: 0,
      to: historyLength
    });
  }

  getUtxos(addresses) {
    return this.#get(`addrs/utxo`, {addrs: addresses.join(',')});
  }

  getTransaction(txid) {
    return this.#get(`tx/${txid}`);
  }

  getRawTransaction(txid) {
    return this.#get(`rawtx/${txid}`);
  }

  getBestBlockHash() {
    return this.#get('status?q=getBestBlockHash');
  }

  getBlock(blockHash) {
    return this.#get(`block/${blockHash}`);
  }

  getTipTime() {
    const self = this;

    return new Promise(async(resolve, reject) => {
      const {bestblockhash} = await self.getBestBlockHash();
      const block = await self.getBlock(bestblockhash);

      resolve(block.time);
    });
  };

  broadcast(transaction) {
    return this.get('tx/send', {rawtx: transaction});
  }
}

export default insightConnector;