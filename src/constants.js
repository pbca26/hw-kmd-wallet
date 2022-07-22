export const TX_FEE = 10000;
export const KOMODO = {
  messagePrefix: '\x18Komodo Signed Message:\n',
  bip32: {
    public: 0x0488B21E,
    private: 0x0488ADE4
  },
  consensusBranchId: {
    1: 0x00,
    2: 0x00,
    3: 0x5ba81b19,
    4: 0x76b809bb,
  },
  versionGroupId: 0x892F2085,
  pubKeyHash: 0x3C,
  scriptHash: 0x55,
  wif: 0xBC
};
export const voteCoin = 'VOTE2022';
export const testCoins = [
  'RICK',
  'MORTY',
  'VOTE2022',
  'TKLTEST',
];
export const LEDGER_FW_VERSIONS = {
  nano_s: {
    default: 'Nano S firmware v1.5',
    webusb: 'Nano S firmware v1.6 / WebUSB', // nano s fw > 1.6, nano x
  },
  nano_x: {
    webusb: 'WebUSB (default)',
    ble: 'Bluetooth (experimental)',
  },
};
export const KMD_REWARDS_MIN_THRESHOLD = TX_FEE * 2;
export const FAUCET_URL = {
  RICK: 'https://www.atomicexplorer.com/#/faucet/rick/',
  MORTY: 'https://www.atomicexplorer.com/#/faucet/morty/',
};
export const VENDOR = {
  ledger: 'Ledger',
  trezor: 'Trezor',
};
export const TREZOR_FW_MIN_VERSION = {
  'T': '2.3.1',
  '1': '1.9.1',
};
export const LEDGER_MIN_APP_VERSION = '1.4.0';
// src: https://gist.github.com/TamtamHero/b7651ffe6f1e485e3886bf4aba673348
export const LEDGER_DEVICE_HEX_ENUM = {
  '31100002': 's',
  '31100003': 's',
  '31100004': 's',
  '33000004': 'x',
};
export const SETTINGS = {
  DISCOVERY_GAP_LIMIT_DEFAULT: 10,
  DISCOVERY_GAP_LIMIT_AIRDROP: 50,
  DISCOVERY_GAP_LIMIT: 200,
  DISCOVERY_ADDRESS_CONCURRENCY: {
    2: 2,
    5: 5,
    10: '10 (default)',
  },
  DISCOVERY_ADDRESS_CONCURRENCY_DEFAULT: 10,
  ACCOUNT_INDEX_LIMIT: 30,
  SIDEBAR: {
    'full': 'Full size',
    'short': 'Compact size (icons only)',
  },
  AUTOLOCK: {
    0: 'Never',
    300: '5 min',
    600: '10 min',
    1800: '30 min',
    3200: '60 min',
  },
  HISTORY_LENGTH_DEFAULT: 10,
  HISTORY_LENGTH_LIMIT: 100,
};
export const KMD_REWARDS_CLAIM_ACCOUNT_OVERRIDE_LIMIT = 10;
export const PRICE_DEFAULT_COINS = ['KMD', 'VRSC', 'TOKEL'];
export const COIN_DERIVATION_PATH = `44'/141'`;
export const CACHE_MAX_LIFETIME = 10 * 60;
