const fetch = require('node-fetch');
const coins = require('./src/lib/coins');

let coinsToRemove = [];

(async () => {
  const getInfo = async explorerUrl => {
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

  const checkApiEndpoints = async coin => {
    const getInfoRes = await Promise.all(coins[coin].api.map((value, index) => {
      return getInfo(value);
    }));
    let longestBlockHeight = 0;
    let apiEndPointIndex = null;
  
    console.log('checkExplorerEndpoints', getInfoRes);
    
    for (let i = 0; i < coins[coin].api.length; i++) {
      if (getInfoRes[i] &&
          'info' in getInfoRes[i] &&
          'version' in getInfoRes[i].info) {
        if (getInfoRes[i].info.blocks > longestBlockHeight) {
          longestBlockHeight = getInfoRes[i].info.blocks;
          apiEndPointIndex = i;
        }
      }
    }
  
    console.log('apiEndPointIndex', apiEndPointIndex);
    
    return apiEndPointIndex !== null ? coins[coin].api[apiEndPointIndex] : null;
  };
  
  for (let coin in coins) {
    const explorerUrl = await checkApiEndpoints(coin);
    if (!explorerUrl) coinsToRemove.push(coin)
    console.log(`${coin} explorer url`, explorerUrl);
  }

  console.log('all done!');
  console.log('coins to remove', coinsToRemove);
})();