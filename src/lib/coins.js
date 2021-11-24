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
  CCL: {
    explorer: 'https://ccl.explorer.dexstats.info/',
    api: ['https://ccl.explorer.dexstats.info/insight-api-komodo/'],
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
  NINJA: {
    explorer: 'https://ninja.explorer.dexstats.info/',
    api: ['https://ninja.explorer.dexstats.info/insight-api-komodo/'],
  },
  THC: {
    explorer: 'https://thc.explorer.dexstats.info/',
    api: ['https://thc.explorer.dexstats.info/insight-api-komodo/'],
  },
  MCL: {
    explorer: 'https://mcl.explorer.dexstats.info/',
    api: ['https://mcl.explorer.dexstats.info/insight-api-komodo/'],
  },
  LABS: {
    explorer: 'https://labs.explorer.dexstats.info/',
    api: ['https://labs.explorer.dexstats.info/insight-api-komodo/'],
  },
  VOTE2021: {
    explorer: 'https://vote2021.explorer.dexstats.info/',
    api: [
      'https://explorer.komodoplatform.com:10000/vote2021/api/',
      'https://vote2021.explorer.dexstats.info/insight-api-komodo/',
    ],
  },
  RICK: {
    explorer: 'https://rick.kmd.dev/',
    api: [
      'https://explorer.komodoplatform.com:10000/rick/api/',
      'https://rick.explorer.dexstats.info/insight-api-komodo/',
      'https://rick.kmd.dev/insight-api-komodo/',
    ],
  },
  MORTY: {
    explorer: 'https://morty.kmd.dev/',
    api: [
      'https://morty.explorer.dexstats.info/insight-api-komodo/',
      'https://explorer.komodoplatform.com:10000/morty/api/',
      'https://morty.kmd.dev/insight-api-komodo/',
    ],
  },
  VRSC: {
    explorer: 'https://vrsc.explorer.dexstats.info/',
    api: [
      'https://explorer.komodoplatform.com:10000/vrsc/api/',
      'https://vrsc.explorer.dexstats.info/insight-api-komodo/',
      'https://insight.vrsc.0x03.services/insight-api-komodo/',
    ],
  },
  WSB: {
    explorer: 'https://wsb.explorer.dexstats.info/',
    api: [
      'https://wsb.explorer.dexstats.info/insight-api-komodo/',
      'https://explorer.komodoplatform.com:10000/wsb/api/',
    ],
  },
  SPACE: {
    explorer: 'https://space.explorer.dexstats.info/',
    api: ['https://space.explorer.dexstats.info/insight-api-komodo/'],
  },
  CLC: {
    explorer: 'https://clc.explorer.dexstats.info/',
    api: ['https://clc.explorer.dexstats.info/insight-api-komodo/'],
  },
  SOULJA: {
    explorer: 'https://soulja.explorer.dexstats.info/',
    api: ['https://soulja.explorer.dexstats.info/insight-api-komodo/'],
  },
  DP: {
    explorer: 'https://dp.explorer.dexstats.info/',
    api: ['https://dp.explorer.dexstats.info/insight-api-komodo/'],
  },
  GLEEC: {
    explorer: 'https://gleec.xyz/',
    api: [
      'https://gleec.explorer.dexstats.info/insight-api-komodo/',
      'https://gleec.xyz/insight-api-komodo/',
    ],
  },
  TOKEL: {
    explorer: 'https://tokel.explorer.dexstats.info/',
    api: [
      'https://tokel.explorer.dexstats.info/insight-api-komodo/',
      'https://explorer.komodoplatform.com:10000/tokel/api/',
    ],
  },
  TKLTEST: {
    explorer: 'https://tkltest.explorer.dexstats.info/',
    api: [
      'https://tkltest.explorer.dexstats.info/insight-api-komodo/',
      'https://explorer.komodoplatform.com:10000/tkltest/api/',
    ],
  },
  // SHARK: '',
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