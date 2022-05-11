import TrezorConnect from 'trezor-connect';
import {writeLog} from '../Debug';

const RECHECK_TIMEOUT = 1000;

const trezorCheckFW = async () => {
  return new Promise(async (resolve, reject) => {
    const interval = setInterval(async () => {
      const result = await TrezorConnect.getFeatures();

      if (result &&
          result.success === true) {
        if ('major_version' in result.payload &&
            'minor_version' in result.payload &&
            'patch_version' in result.payload &&
            'model' in result.payload) {
          const {
            major_version,
            minor_version,
            patch_version,
            model,
          } = result.payload;

          clearInterval(interval);
          resolve({
            major_version,
            minor_version,
            patch_version,
            model,
          });
        } else {
          writeLog('unable to check trezor firmware version');
        }
      } else {
        writeLog('unable to check trezor firmware version');
      }
    }, RECHECK_TIMEOUT);
  });
};

export default trezorCheckFW;