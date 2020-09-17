import TrezorConnect from 'trezor-connect';

const RECHECK_TIMEOUT = 1000;

const trezorCheckFW = async () => {
  return new Promise(async(resolve, reject) => {
    const interval = setInterval(async() => {
      const result = await TrezorConnect.getFeatures();

      if (result &&
          result.success === true) {
        if (result.payload.hasOwnProperty('major_version') &&
            result.payload.hasOwnProperty('minor_version') &&
            result.payload.hasOwnProperty('patch_version') &&
            result.payload.hasOwnProperty('model')) {
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
          console.warn('unable to check trezor firmware version');
        }
      } else {
        console.warn('unable to check trezor firmware version');
      }
    }, RECHECK_TIMEOUT);
  });
};

export default trezorCheckFW;