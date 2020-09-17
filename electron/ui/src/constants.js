export const TX_FEE = 20000;
export const INSIGHT_API_URL = {
  default: 'https://kmd.explorer.dexstats.info/insight-api-komodo/',
  komodoplatform: 'https://explorer.komodoplatform.com:10000/kmd/api/',
};
export const INSIGHT_EXPLORER_URL = 'https://kmdexplorer.io/';
export const KOMODO = {
  messagePrefix: '\x18Komodo Signed Message:\n',
  bip32: {
    public: 0x0488B21E,
    private: 0x0488ADE4,
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
  wif: 0xBC,
};
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