import {KOMODO} from './../constants';
import bitcoin from 'bitcoinjs-lib';

const getAddress = publicKey => bitcoin.payments.p2pkh({
  pubkey: publicKey,
  network: KOMODO
}).address;

export const getPK = publicKey => bitcoin.payments.p2pkh({
  pubkey: publicKey,
  network: KOMODO
});

export default getAddress;
