import hw from './hw';
import {ledgerTransport} from './ledger';

const RECHECK_TIMEOUT = 1000;
let getLedgerDeviceInfoInterval, getLedgerAppInfoInterval;

// ref: https://github.com/LedgerHQ/ledger-live-common/blob/master/src/hw/getVersion.js
const getLedgerDeviceInfo = async() => {
  return new Promise(async(resolve, reject) => {
    
    if (!ledgerTransport) {
      const transport = await hw.ledger.transportOptions.webusb.create();
      hw.ledger.setLedgerTransport(transport);
    }

    getLedgerDeviceInfoInterval = setInterval(async() => {
      const transport = ledgerTransport;

      try {
        // only fresh fw versions are handled by this code
        // device info can only be obtained from dashboard
        transport.setScrambleKey('B0L0S');
        const res = await transport.send(0xe0, 0x01, 0x00, 0x00);
        const byteArray = [...res];
        const data = byteArray.slice(0, byteArray.length - 2);
        const targetIdStr = Buffer.from(data.slice(0, 4));
        const targetId = targetIdStr.readUIntBE(0, 4);
        const seVersionLength = data[4];
        const seVersion = Buffer.from(data.slice(5, 5 + seVersionLength)).toString();
        const flagsLength = data[5 + seVersionLength];

        const mcuVersionLength = data[5 + seVersionLength + 1 + flagsLength];
        let mcuVersion = Buffer.from(
          data.slice(
            7 + seVersionLength + flagsLength,
            7 + seVersionLength + flagsLength + mcuVersionLength
          )
        );
        if (mcuVersion[mcuVersion.length - 1] === 0) {
          mcuVersion = mcuVersion.slice(0, mcuVersion.length - 1);
        }
        mcuVersion = mcuVersion.toString();

        clearInterval(getLedgerDeviceInfoInterval);
        transport.close();
        resolve({
          mcuVersion,
          fwVersion: seVersion,
          targetId
        });
      } catch(e) {
        // re-init transport if connection is lost
        if (e.name === 'DisconnectedDeviceDuringOperation') {
          ledgerTransport.close();
          const transport = await hw.ledger.transportOptions.webusb.create();
          hw.ledger.setLedgerTransport(transport);
        }
        console.warn(e);
      }
    }, RECHECK_TIMEOUT);
  });
};

// ref: https://github.com/LedgerHQ/ledgerjs/issues/365
const getLedgerAppInfo = async() => {
  return new Promise(async(resolve, reject) => {   
    if (!ledgerTransport) {
      const transport = await hw.ledger.transportOptions.webusb.create();
      hw.ledger.setLedgerTransport(transport);
    }

    getLedgerAppInfoInterval = setInterval(async() => {
      const transport = ledgerTransport;

      try {
        const r = await transport.send(0xb0, 0x01, 0x00, 0x00);
        let i = 0;
        const format = r[i++];
        const nameLength = r[i++];
        const name = r.slice(i, (i += nameLength)).toString('ascii');
        const versionLength = r[i++];
        const version = r.slice(i, (i += versionLength)).toString('ascii');
        const flagLength = r[i++];
        const flags = r.slice(i, (i += flagLength));

        if (name === 'Komodo') {
          clearInterval(getLedgerAppInfoInterval);
          transport.close();
          resolve({
            name,
            version,
            flags,
            format,
          });
        }
      } catch (e) {
        // re-init transport if connection is lost
        if (e.name === 'DisconnectedDeviceDuringOperation') {
          ledgerTransport.close();
          const transport = await hw.ledger.transportOptions.webusb.create();
          hw.ledger.setLedgerTransport(transport);
        }
      }
    }, RECHECK_TIMEOUT);
  });
};

const cancelIntervals = () => {
  if (getLedgerDeviceInfoInterval) {
    clearInterval(getLedgerDeviceInfoInterval);
    getLedgerDeviceInfoInterval = null;
  }
  
  if (getLedgerAppInfoInterval) {
    clearInterval(getLedgerAppInfoInterval);
    getLedgerAppInfoInterval = null;
  }
};

const ledgerFw = {
  getLedgerDeviceInfo,
  getLedgerAppInfo,
  cancelIntervals,
};

export default ledgerFw;