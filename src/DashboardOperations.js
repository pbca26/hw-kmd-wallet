import React from 'react';
import './DashboardOperations.scss';

class DashboardOperations extends React.Component {
  state = this.initialState;
  
  get initialState() {
    return {
    };
  };

  render() {
    return (
      <div className="recent-operations-block">
        <h4>Recent operations</h4>
        <div className="recent-operations">
          {this.props.lastOperations.map((item, index) => (
            <div
              className="item"
              key={`operations-${item.txid}`}>
              <div className="item-left-pane">
                <img
                  src={`${process.env.NODE_ENV === 'development' ? process.env.PUBLIC_URL + '/' : ''}coins/${item.coin}.png`}
                  alt={`${item.coin} icon`} />
                <span className="direction">{item.type}</span>
                <span className="date">{item.date}</span>
              </div>
              <div className="item-right-pane">
                <span className={item.type === 'received' || item.type === 'rewards' ? 'amount-increase' : 'amount-decrease'}>
                  {item.type === 'received' || item.type === 'rewards' ? '+' + item.amount : '-' + item.amount}
                </span>
              </div>
            </div>
          ))}
          {this.props.lastOperations.length < 1 &&
            <span>No history</span>
          }
        </div>
      </div>
    );
  }
}

export default DashboardOperations;