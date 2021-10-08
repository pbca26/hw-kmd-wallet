// TODO: pull prices from CG or similar

import React from 'react';
const assets = [{
  coin: 'VRSC',
  price: 1.2,
  change: 30,
}, {
  coin: 'DEX',
  price: 20,
  change: 1.5,
}, {
  coin: 'KMD',
  price: 3.5,
  change: -6.5,
}];

class DashboardPrices extends React.Component {
  state = this.initialState;
  
  get initialState() {
    return {
    };
  };

  render() {
    return (
      <div className="assets-price-block">
        <h4>Assets</h4>
        <div className="assets-price">
          <table>
            <thead>
              <tr>
                <th>Currency</th>
                <th>Price</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((item, index) => (
                <tr key={`prices-${item.coin}`}>
                  <td>
                    <img src={`coins/${item.coin}.png`} />
                    <span className="coin-name">{item.coin}</span>
                  </td>
                  <td>{item.price}</td>
                  <td>{item.change}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

export default DashboardPrices;