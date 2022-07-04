import React from 'react';
import './DashboardPrices.scss';
import {PRICE_DEFAULT_COINS} from './constants';

const DashboardPrices = props => {
  const render = () => {
    const coins = PRICE_DEFAULT_COINS;
    const {prices} = props;
    const coinPriceTickers = Object.keys(prices);

    return (
      <div className="assets-price-block">
        <h4>Assets</h4>
        <div className="assets-price">
          <table>
            <thead>
              <tr>
                <th>Currency</th>
                <th>Price, $</th>
                <th>Change, %</th>
              </tr>
            </thead>
            {!coinPriceTickers.length &&
              <tbody>
                {coins.map((item, index) => (
                  <tr key={`prices-${item}`}>
                    <td>
                      <div className="coin-icons-wrapper-container">
                        <div className={`coin-icons-wrapper ${item}-icon-size-sm`}>
                          <div
                            className={`coin-icons ${item}`}
                            style={{backgroundImage: `url('${process.env.NODE_ENV === 'development' ? process.env.PUBLIC_URL + '/' : ''}coin-icons.png')`}}></div>
                        </div>
                      </div>
                      <span className="coin-name">{item}</span>
                    </td>
                    <td>...</td>
                    <td>...</td>
                  </tr>
                ))}
              </tbody>
            }
            {coinPriceTickers.length > 0 &&
              <tbody>
                {coinPriceTickers.map((item, index) => (
                  <tr key={`prices-${item}`}>
                    <td>
                      <div className="coin-icons-wrapper-container">
                        <div className={`coin-icons-wrapper ${item}-icon-size-sm`}>
                          <div
                            className={`coin-icons ${item}`}
                            style={{backgroundImage: `url('${process.env.NODE_ENV === 'development' ? process.env.PUBLIC_URL + '/' : ''}coin-icons.png')`}}></div>
                        </div>
                      </div>
                      <span className="coin-name">{item}</span>
                    </td>
                    <td>{prices[item].price}</td>
                    <td>{prices[item].perc}</td>
                  </tr>
                ))}
              </tbody>
            }
          </table>
        </div>
      </div>
    );
  }

  return render();
}

export default DashboardPrices;