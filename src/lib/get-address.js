import {KOMODO} from './../constants';
import {payments} from 'bitcoinjs-lib';

const getAddress = publicKey => payments.p2pkh({
  pubkey: publicKey,
  network: KOMODO
}).address;

export default getAddress;