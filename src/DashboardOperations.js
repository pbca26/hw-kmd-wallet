import React from 'react';

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
                <img src={`coins/${item.coin}.png`} />
                <span className="direction">{item.type}</span>
                <span className="date">{item.date}</span>
              </div>
              <div className="item-right-pane">
                <span className="amount">{item.amount}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

export default DashboardOperations;