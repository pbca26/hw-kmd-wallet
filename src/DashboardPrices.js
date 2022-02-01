import React from 'react';

class DashboardPrices extends React.Component {
  state = this.initialState;
  
  get initialState() {
    return {
    };
  };

  render() {
    const coins = ['KMD', 'VRSC', 'TOKEL'];
    const {prices} = this.props;
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
                      <img src={`coins/${item}.png`} />
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
                      <img src={`coins/${item}.png`} />
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
}

export default DashboardPrices;