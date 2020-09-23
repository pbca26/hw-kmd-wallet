import React from 'react';
import explorerLink from './lib/explorer-link';
import {
  isElectron,
  shell,
} from './Electron';

const TxidLink = ({txid, coin}) => !isElectron ? (
  <a
    target="_blank"
    rel="noopener noreferrer"
    href={`${explorerLink[coin]}tx/${txid}`}>{txid}</a>
) : (
  <a
    href="#"
    onClick={() => shell.openExternal(`${explorerLink[coin]}tx/${txid}`)}>{txid}</a>
);

export default TxidLink;
