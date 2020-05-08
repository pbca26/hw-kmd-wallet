export const TX_FEE = 10000;
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
export const voteCoin = 'VOTE2020';
export const testCoins = ['RICK', 'MORTY', 'VOTE2020'];
export const LEDGER_FW_VERSIONS = {
  default: 'Nano S firmware v1.5',
  webusb: 'Nano S firmware v1.6', // nano s fw > 1.6 
};
export const KMD_REWARDS_MIN_THRESHOLD = TX_FEE * 2;
export const FAUCET_URL = {
  RICK: 'https://www.atomicexplorer.com/#/faucet/rick/',
  MORTY: 'https://www.atomicexplorer.com/#/faucet/morty/',
};