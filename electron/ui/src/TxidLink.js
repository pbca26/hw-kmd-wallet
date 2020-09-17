import React from 'react';
import {INSIGHT_EXPLORER_URL} from './constants';

const TxidLink = ({txid}) => (
  <a
    target="_blank"
    rel="noopener noreferrer"
    href={`${INSIGHT_EXPLORER_URL}tx/${txid}`}>{txid}</a>
);

export default TxidLink;
