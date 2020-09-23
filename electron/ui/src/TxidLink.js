import React from 'react';
import {INSIGHT_EXPLORER_URL} from './constants';
import {
  isElectron,
  shell,
} from './Electron';

const TxidLink = ({txid}) => isElectron ? (
  <a
    target="_blank"
    rel="noopener noreferrer"
    href={`${INSIGHT_EXPLORER_URL}tx/${txid}`}>{txid}</a>
) : (
  <a
    href="#"
    onClick={() => shell.openExternal(`${INSIGHT_EXPLORER_URL}tx/${txid}`)}>{txid}</a>
);

export default TxidLink;
