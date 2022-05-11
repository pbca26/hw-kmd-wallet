import React from 'react';
import Modal from './Modal';
import coins from './lib/coins';
import {
  isElectron,
  shell,
} from './Electron';
import './TransactionDetailsModal.scss';

class TransactionDetailsModal extends React.Component {
  state = {
    isClosed: true
  };

  close() {
    this.setState({
      isClosed: true
    });
  }

  open() {
    this.setState({
      isClosed: false
    });
  }

  render() {
    const {tx, coin} = this.props;

    return (
      <React.Fragment>
        <button
          className="button is-primary hidden"
          id="transactionDetailsModal"
          onClick={() => this.open()}>
          Operation details
        </button>
        <Modal
          title="Operation Details"
          show={this.state.isClosed === false}
          handleClose={() => this.close()}
          isCloseable={true}
          className="Modal-operation-details">
          {tx &&
            <React.Fragment>
              <div className="cap--first text-center">
                <div className="direction">
                  <i className={`fa fa-long-arrow-alt-${tx.type === 'sent' ? 'up' : 'down'}`}></i>
                  {Number(tx.height) === -1 || Number(tx.height) === 0 || Number(tx.confirmations) === 0 ? 'pending' : tx.type}
                </div>
                <div className={`amount ${tx.type === 'received' || tx.type === 'rewards' ? 'amount-increase' : 'amount-decrease'}`}>
                  {tx.type === 'received' || tx.type === 'rewards' ? '+' + tx.amount : '-' + tx.amount} {coin}
                </div>
              </div>
              <table className="table">
                <tbody>
                  <tr>
                    <td>
                      <strong>Account</strong>
                    </td>
                    <td>{coin} {(tx.accountIndex || this.props.activeAccount) + 1}</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Date</strong>
                    </td>
                    <td>{Number(tx.height) === -1 || Number(tx.height) === 0 ? '' : tx.date}</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Confirmations</strong>
                    </td>
                    <td>{tx.confirmations}</td>
                  </tr>
                  <tr>
                    <td
                      colSpan="2"
                      className="text-left no-border">
                      <strong>Transaction ID</strong>
                    </td>
                  </tr>
                  <tr>
                    <td
                      colSpan="2"
                      className="text-left">
                      {tx.txid}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="modal-action-block center">
                {isElectron &&
                  <a
                    href="!#"
                    onClick={() => shell.openExternal(`${coins[coin].explorer}tx/${tx.txid}`)}>
                    <button className="button is-primary">
                      Open in explorer <i className="fa fa-external-link-alt"></i>
                    </button>
                  </a>
                }
                {!isElectron &&
                  <a
                    target="_blank"
                    href={`${coins[coin].explorer}tx/${tx.txid}`}
                    rel="noopener noreferrer">
                    <button className="button is-primary">
                      Open in explorer <i className="fa fa-external-link-alt"></i>
                    </button>
                  </a>
                }
              </div>
            </React.Fragment>
          }
        </Modal>
      </React.Fragment>
    );
  }
}

export default TransactionDetailsModal;