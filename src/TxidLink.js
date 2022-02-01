import React from 'react';
import explorerLink from './lib/coins';
import {
  isElectron,
  shell,
} from './Electron';

const TxidLink = ({txid, coin}) => !isElectron ? (
  <a
    target="_blank"
    rel="noopener noreferrer"
    href={`${explorerLink[coin].explorer}tx/${txid}`}>{txid}</a>
) : (
  <a onClick={() => shell.openExternal(`${explorerLink[coin].explorer}tx/${txid}`)}>{txid}</a>
);

export default TxidLink;
