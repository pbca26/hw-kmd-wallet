import React from 'react';
import explorerLink from './lib/explorer-link';

const TxidLink = ({txid, coin}) => (
  <a target="_blank" rel="noopener noreferrer" href={`${explorerLink[coin]}tx/${txid}`}>{txid}</a>
);

export default TxidLink;
