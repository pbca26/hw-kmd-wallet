import {sortObject} from './sort';

const coins = {
  KMD: {
    explorer: 'https://kmd.explorer.dexstats.info/',
    api: [
      'https://explorer.komodoplatform.com:10000/kmd/api/',
      'https://kmd.explorer.dexstats.info/insight-api-komodo/',
    ],
  },
  AXO: {
    explorer: 'https://axo.explorer.dexstats.info/',
    api: ['https://axo.explorer.dexstats.info/insight-api-komodo/'],
  },
  ETOMIC: {
    explorer: 'https://etomic.explorer.dexstats.info/',
    api: ['https://etomic.explorer.dexstats.info/insight-api-komodo/'],
  },
  KOIN: {
    explorer: 'https://koin.explorer.dexstats.info/',
    api: ['https://koin.explorer.dexstats.info/insight-api-komodo/'],
  },
  MESH: {
    explorer: 'https://mesh.explorer.dexstats.info/',
    api: ['https://mesh.explorer.dexstats.info/insight-api-komodo/'],
  },
  DEX: {
    explorer: 'https://dex.explorer.dexstats.info/',
    api: ['https://dex.explorer.dexstats.info/insight-api-komodo/'],
  },
  SUPERNET: {
    explorer: 'https://supernet.explorer.dexstats.info/',
    api: ['https://supernet.explorer.dexstats.info/insight-api-komodo/'],
  },
  DION: {
    explorer: 'https://explorer.dionpay.com/',
    api: ['https://explorer.dionpay.com/insight-api-komodo/'],
  },
  CCL: {
    explorer: 'https://ccl.explorer.dexstats.info/',
    api: ['https://ccl.explorer.dexstats.info/insight-api-komodo/'],
  },
  KV: {
    explorer: 'https://kv.explorer.dexstats.info/',
    api: ['https://kv.explorer.dexstats.info/insight-api-komodo/'],
  },
  CHAIN: {
    explorer: 'https://chain.explorer.dexstats.info/',
    api: ['https://chain.explorer.dexstats.info/insight-api-komodo/'],
  },
  PGT: {
    explorer: 'https://pgt.explorer.dexstats.info/',
    api: ['https://pgt.explorer.dexstats.info/insight-api-komodo/'],
  },
  MSHARK: {
    explorer: 'https://mshark.explorer.dexstats.info/',
    api: ['https://mshark.explorer.dexstats.info/insight-api-komodo/'],
  },
  REVS: {
    explorer: 'https://revs.explorer.dexstats.info/',
    api: ['https://revs.explorer.dexstats.info/insight-api-komodo/'],
  },
  PANGEA: {
    explorer: 'https://pangea.explorer.dexstats.info/',
    api: ['https://pangea.explorer.dexstats.info/insight-api-komodo/'],
  },
  JUMBLR: {
    explorer: 'https://jumblr.explorer.dexstats.info/',
    api: ['https://jumblr.explorer.dexstats.info/insight-api-komodo/'],
  },
  BET: {
    explorer: 'https://bet.explorer.dexstats.info/',
    api: ['https://bet.explorer.dexstats.info/insight-api-komodo/'],
  },
  CRYPTO: {
    explorer: 'https://crypto.explorer.dexstats.info/',
    api: ['https://crypto.explorer.dexstats.info/insight-api-komodo/'],
  },
  HODL: {
    explorer: 'https://hodl.explorer.dexstats.info/',
    api: ['https://hodl.explorer.dexstats.info/insight-api-komodo/'],
  },
  ILN: {
    explorer: 'https://explorer.ilien.io/',
    api: ['https://explorer.ilien.io/insight-api-komodo/'],
  },
  BOTS: {
    explorer: 'https://bots.explorer.dexstats.info/',
    api: ['https://bots.explorer.dexstats.info/insight-api-komodo/'],
  },
  MGW: {
    explorer: 'https://mgw.explorer.dexstats.info/',
    api: ['https://mgw.explorer.dexstats.info/insight-api-komodo/'],
  },
  WLC21: {
    explorer: 'https://wlc21.explorer.dexstats.info/',
    api: ['https://wlc21.explorer.dexstats.info/insight-api-komodo/'],
  },
  COQUICASH: {
    explorer: 'https://coquicash.explorer.dexstats.info/',
    api: ['https://coquicash.explorer.dexstats.info/insight-api-komodo/'],
  },
  BTCH: {
    explorer: 'https://btch.explorer.dexstats.info/',
    api: ['https://btch.explorer.dexstats.info/insight-api-komodo/'],
  },
  HUSH3: {
    explorer: 'https://hush3.explorer.dexstats.info/',
    api: ['https://hush3.explorer.dexstats.info/insight-api-komodo/'],
  },
  NINJA: {
    explorer: 'https://ninja.explorer.dexstats.info/',
    api: ['https://ninja.explorer.dexstats.info/insight-api-komodo/'],
  },
  SEC: {
    explorer: 'https://sec.explorer.dexstats.info/',
    api: ['https://sec.explorer.dexstats.info/insight-api-komodo/'],
  },
  THC: {
    explorer: 'https://thc.explorer.dexstats.info/',
    api: ['https://thc.explorer.dexstats.info/insight-api-komodo/'],
  },
  KMDICE: {
    explorer: 'https://kmdice.explorer.dexstats.info/',
    api: ['https://kmdice.explorer.dexstats.info/insight-api-komodo/'],
  },
  ZEXO: {
    explorer: 'https://zex.explorer.dexstats.info/',
    api: ['https://zexo.explorer.dexstats.info/insight-api-komodo/'],
  },
  KSB: {
    explorer: 'https://ksb.explorer.dexstats.info/',
    api: ['https://ksb.explorer.dexstats.info/insight-api-komodo/'],
  },
  OUR: {
    explorer: 'https://our.explorer.dexstats.info/',
    api: ['https://our.explorer.dexstats.info/insight-api-komodo/'],
  },
  MCL: {
    explorer: 'https://mcl.explorer.dexstats.info/',
    api: ['https://mcl.explorer.dexstats.info/insight-api-komodo/'],
  },
  RFOX: {
    explorer: 'https://rfox.explorer.dexstats.info/',
    api: ['https://rfox.explorer.dexstats.info/insight-api-komodo/'],
  },
  LABS: {
    explorer: 'https://labs.explorer.dexstats.info/',
    api: ['https://labs.explorer.dexstats.info/insight-api-komodo/'],
  },
  VOTE2020: {
    explorer: 'https://vote2020.explorer.dexstats.info/',
    api: ['https://vote2020.explorer.dexstats.info/insight-api-komodo/'],
  },
  RICK: {
    explorer: 'https://rick.kmd.dev/',
    api: [
      'https://rick.kmd.dev/insight-api-komodo/',
      'https://rick.explorer.dexstats.info/insight-api-komodo/',
    ],
  },
  MORTY: {
    explorer: 'https://morty.kmd.dev/',
    api: [
      'https://morty.kmd.dev/insight-api-komodo/',
      'https://morty.explorer.dexstats.info/insight-api-komodo/',
    ],
  },
  VRSC: {
    explorer: 'https://vrsc.explorer.dexstats.info/',
    api: [
      'https://explorer.komodoplatform.com:10000/vrsc/api/',
      'https://vrsc.explorer.dexstats.info/insight-api-komodo/',
    ],
  },
  // DP: '',
  // SHARK: '',
  // EQL: '',
  // PIZZA: '',
  // BEER: '',
  // DSEC: '',
  /* coins below need special handling due to no overwinter support
  ZILLA: {
    explorer: 'https://zilla.explorer.dexstats.info/',
    api: ['https://zilla.explorer.dexstats.info/insight-api-komodo/'],
  },
  OOT: {
    explorer: 'https://oot.explorer.dexstats.info/',
    api: ['https://oot.explorer.dexstats.info/insight-api-komodo/'],
  },
  */
};

export default sortObject(coins);