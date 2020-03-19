export const TX_FEE = 10000;
export const INSIGHT_API_URL = {
  default: 'https://rick.kmd.dev/insight-api-komodo/',
};
export const INSIGHT_EXPLORER_URL = 'https://rick.kmd.dev/';
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
export const coin = 'RICK';
export const LEDGER_FW_VERSIONS = {
  default: 'Nano S firmware v1.5',
  webusb: 'Nano S firmware v1.6', // nano s fw > 1.6 
};