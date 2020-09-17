import {KOMODO} from './../constants';
import bitcoin from 'bitcoinjs-lib';

const getAddress = publicKey => bitcoin.payments.p2pkh({
  pubkey: publicKey,
  network: KOMODO
}).address;

export default getAddress;
