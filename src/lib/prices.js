import coins from './coins';
let coinPaprikaTickers = [];

for (let key in coins) {
  if (coins[key].hasOwnProperty('prices') &&
      coins[key].prices.hasOwnProperty('coinpaprika')) {
    coinPaprikaTickers.push(key);
  }
}

const getCoinpaprikaPrices = async (coin) => {
  try {
    const response = await fetch(`https://api.coinpaprika.com/v1/tickers/${coins[coin].prices.coinpaprika}`);
    const isJson = response.headers.get('Content-Type').includes('application/json');

    const body = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      throw new Error(body);
    }

    return body;
  } catch (e) {
    //console.warn(e);
    return null;
  }
};

export const getPrices = async(userCoinTickers) => {
  try {
    const defaultCoins = ['KMD', 'VRSC', 'TOKEL'];
    let pricePromises = [];
    let prices = {};

    for (let i = 0; i < userCoinTickers.length && pricePromises.length < 3; i++) {
      if (coinPaprikaTickers.indexOf(userCoinTickers[i]) > -1) {
        pricePromises.push(
          getCoinpaprikaPrices(userCoinTickers[i])
        );
      }
    }

    for (let i = 0; i < defaultCoins.length && pricePromises.length < 3; i++) {
      if (userCoinTickers.indexOf(defaultCoins[i]) === -1) {
        pricePromises.push(
          getCoinpaprikaPrices(defaultCoins[i])
        );
      }
    }

    const pricesRes = await Promise.all(pricePromises);

    for (let i = 0; i < pricesRes.length; i++) {
      if (pricesRes[i] &&
          pricesRes[i].quotes &&
          pricesRes[i].quotes.USD &&
          pricesRes[i].quotes.USD.price) {
        prices[defaultCoins[i]] = {
          price: Number(pricesRes[i].quotes.USD.price).toFixed(3),
          perc: pricesRes[i].quotes.USD.percent_change_24h,
        };
      }
    }

    //console.warn('prices', prices);
    return prices;
  } catch (e) {
    return null;
  }
};