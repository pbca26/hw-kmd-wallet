import React from 'react';
import copyToClipboard from './lib/copy-to-clipboard';
import TxidLink from './TxidLink';
import Translate from './Translate';

export const SendCoinRawTxRender = props => {
  const render = () => {
    const {rawtx} = props;

    return(
      <React.Fragment>
        <span className="send-coin-modal-debug-style1"><Translate name="send_raw_tx" />:</span>
        <span className="send-coin-modal-debug-style2">{rawtx}</span>
        <button
          className="button is-light copy-btn"
          onClick={() => copyToClipboard(rawtx)}>
          <i className="fa fa-copy"></i> <span className="copy-btn-text"><Translate name="common_copy" /></span>
        </button>
      </React.Fragment>
    );
  }

  return render();
}

export const SendCoinTxLink = props => {
  const render = () => {
    const {coin, txid} = props;

    return(
      <span className="wb-txid">
        <Translate name="send_txid" />: <TxidLink txid={txid} coin={coin} />
        <button
          className="button is-light copy-btn"
          onClick={() => copyToClipboard(txid)}>
          <i className="fa fa-copy"></i> <span className="copy-btn-text"><Translate name="common_copy" /></span>
        </button>
      </span>
    );
  }

  return render();
}