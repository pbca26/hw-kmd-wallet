import {toBitcoin} from 'satoshi-bitcoin';
import scientificToDecimal from 'scientific-to-decimal';

const humanReadableSatoshis = satoshis => scientificToDecimal(toBitcoin(satoshis));

export default humanReadableSatoshis;
