// TODO: refactor as coin object
import {sortObject} from './sort';

const apiEndpoints = {
  KMD: [
    'https://explorer.komodoplatform.com:10000/kmd/api/',
    'https://kmd.explorer.dexstats.info/insight-api-komodo/'
  ],
  AXO: ['https://axo.explorer.dexstats.info/insight-api-komodo/'],
  ETOMIC: ['https://etomic.explorer.dexstats.info/insight-api-komodo/'],
  KOIN: ['https://koin.explorer.dexstats.info/insight-api-komodo/'],
  MESH: ['https://mesh.explorer.dexstats.info/insight-api-komodo/'],
  DEX: ['https://dex.explorer.dexstats.info/insight-api-komodo/'],
  SUPERNET: ['https://supernet.explorer.dexstats.info/insight-api-komodo/'],
  DION: ['https://explorer.dionpay.com/insight-api-komodo/'],
  CCL: ['https://ccl.explorer.dexstats.info/insight-api-komodo/'],
  KV: ['https://kv.explorer.dexstats.info/insight-api-komodo/'],
  CHAIN: ['https://chain.explorer.dexstats.info/insight-api-komodo/'],
  PGT: ['https://pgt.explorer.dexstats.info/insight-api-komodo/'],
  MSHARK: ['https://mshark.explorer.dexstats.info/insight-api-komodo/'],
  REVS: ['https://revs.explorer.dexstats.info/insight-api-komodo/'],
  PANGEA: ['https://pangea.explorer.dexstats.info/insight-api-komodo/'],
  JUMBLR: ['https://jumblr.explorer.dexstats.info/insight-api-komodo/'],
  BET: ['https://bet.explorer.dexstats.info/insight-api-komodo/'],
  CRYPTO: ['https://crypto.explorer.dexstats.info/insight-api-komodo/'],
  HODL: ['https://hodl.explorer.dexstats.info/insight-api-komodo/'],
  ILN: ['https://explorer.ilien.io/insight-api-komodo/'],
  BOTS: ['https://bots.explorer.dexstats.info/insight-api-komodo/'],
  MGW: ['https://mgw.explorer.dexstats.info/insight-api-komodo/'],
  WLC21: ['https://wlc21.explorer.dexstats.info/insight-api-komodo/'],
  COQUICASH: ['https://coquicash.explorer.dexstats.info/insight-api-komodo/'],
  BTCH: ['https://btch.explorer.dexstats.info/insight-api-komodo/'],
  HUSH3: ['https://hush3.explorer.dexstats.info/insight-api-komodo/'],
  NINJA: ['https://ninja.explorer.dexstats.info/insight-api-komodo/'],
  SEC: ['https://sec.explorer.dexstats.info/insight-api-komodo/'],
  THC: ['https://thc.explorer.dexstats.info/insight-api-komodo/'],
  KMDICE: ['https://kmdice.explorer.dexstats.info/insight-api-komodo/'],
  ZEXO: ['https://zexo.explorer.dexstats.info/insight-api-komodo/'],
  KSB: ['https://ksb.explorer.dexstats.info/insight-api-komodo/'],
  OUR: ['https://our.explorer.dexstats.info/insight-api-komodo/'],
  MCL:  ['https://mcl.explorer.dexstats.info/insight-api-komodo/'],
  RFOX: ['https://rfox.explorer.dexstats.info/insight-api-komodo/'],
  LABS: ['https://labs.explorer.dexstats.info/insight-api-komodo/'],
  VOTE2020: ['https://vote2020.explorer.dexstats.info/insight-api-komodo/'],
  RICK: [
    'https://rick.kmd.dev/insight-api-komodo/',
    'https://rick.explorer.dexstats.info/insight-api-komodo/'
  ],
  MORTY: [
    'https://morty.kmd.dev/insight-api-komodo/',
    'https://morty.explorer.dexstats.info/insight-api-komodo/'
  ],
  VRSC: [
    'https://explorer.komodoplatform.com:10000/vrsc/api/',
    'https://vrsc.explorer.dexstats.info/insight-api-komodo/'
  ]
  // EQL: [],
  // DP: [],
  // PIZZA: [],
  // BEER: [],
  // DSEC: [],
  // SHARK: [],
  /* coins below need special handling due to no overwinter support
  ZILLA: ['https://zilla.explorer.dexstats.info/insight-api-komodo/'],
  OOT: ['https://oot.explorer.dexstats.info/insight-api-komodo/'],
  */
};

export default sortObject(apiEndpoints);