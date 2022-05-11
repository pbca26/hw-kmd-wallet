import {KOMODO} from './../constants';
import bitcoin from '@trezor/utxo-lib';

const checkPublicAddress = address => {
  try {
    const b58check = bitcoin.address.fromBase58Check(address);

    if (b58check.version === KOMODO.pubKeyHash ||
        b58check.version === KOMODO.scriptHash) {
      return true;
    }

    return false;
  } catch (e) {
    // TODO: throw error
    return false;
  }
};

export default checkPublicAddress;