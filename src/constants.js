export const TX_FEE = 20000;
export const INSIGHT_API_URL = {
  default: 'https://insight.hyperdex.app/insight-api-komodo/',
  komodoplatform: 'https://explorer.komodoplatform.com:10000/kmd/api/',
  dexstats: 'https://kmd.explorer.dexstats.info/insight-api-komodo/',
};
export const INSIGHT_EXPLORER_URL = 'https://kmdexplorer.io/';
export const KOMODO = {
  messagePrefix: '\x18Komodo Signed Message:\n',
  bip32: {
    public: 0x0488B21E,
    private: 0x0488ADE4
  },
  pubKeyHash: 0x3C,
  scriptHash: 0x55,
  wif: 0xBC
};
