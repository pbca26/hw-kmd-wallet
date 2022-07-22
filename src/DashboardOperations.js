import React from 'react';
import formatValue from './lib/format-value';
import './DashboardOperations.scss';

const DashboardOperations = props => {
  const render = () => {
    return (
      <div className="recent-operations-block">
        <h4>Recent operations</h4>
        <div className="recent-operations">
          {props.lastOperations.map((item, index) => (
            <div
              className="item"
              key={`operations-${item.txid}`}>
              <div className="item-left-pane">
                <div className="coin-icons-wrapper-container">
                  <div className={`coin-icons-wrapper ${item.coin}-icon-size-sm`}>
                    <div
                      className={`coin-icons ${item.coin}`}
                      style={{backgroundImage: `url('${process.env.NODE_ENV === 'development' ? process.env.PUBLIC_URL + '/' : ''}coin-icons.png')`}}></div>
                  </div>
                </div>
                <span className="direction">{item.type}</span>
                <span className="date">{item.date}</span>
              </div>
              <div className="item-right-pane">
                <span className={item.type === 'received' || item.type === 'rewards' ? 'amount-increase' : 'amount-decrease'}>
                  {item.type === 'received' || item.type === 'rewards' ? '+' + formatValue(item.amount) : '-' + formatValue(item.amount)}
                </span>
              </div>
            </div>
          ))}
          {props.lastOperations.length < 1 &&
            <span>No history</span>
          }
        </div>
      </div>
    );
  }

  return render();
}

export default DashboardOperations;