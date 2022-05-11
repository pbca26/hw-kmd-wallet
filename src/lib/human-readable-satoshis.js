import {toBitcoin} from 'satoshi-bitcoin';
import scientificToDecimal from 'scientific-to-decimal';

const humanReadableSatoshis = satoshis => Number(satoshis) ? scientificToDecimal(toBitcoin(satoshis)) : 0;

export default humanReadableSatoshis;
