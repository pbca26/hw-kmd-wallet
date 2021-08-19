import {
  getLocalStorageVar,
  setLocalStorageVar,
} from './localstorage-util';
import {setConfigVar} from './account-discovery';

export const defaultSettings = {
  theme: 'tdark',
  fwCheck: true,
  enableDebugTools: false,
  discoveryGapLimit: 20,
  discoveryAddressConcurrency: 10,
  accountIndex: 0,
};

const initSettings = () => {
  let settings = getLocalStorageVar('settings');

  if (!settings || !Object.keys(settings).length) {
    document.getElementById('body').className = 'tdark';
    setLocalStorageVar('settings', defaultSettings);
    console.warn(`no stored settings found, set all to default`, defaultSettings);
  } else {
    for (let key in defaultSettings) {
      if (settings &&
          !settings.hasOwnProperty(key)) {
        console.warn(`no settings with key ${key} exists, set to default ${defaultSettings[key]}`);
        settings[key] = defaultSettings[key];
        if (key === 'discoveryGapLimit' || key === 'discoveryAddressConcurrency') setConfigVar(key, settings[key]);
      } else {
        if (key === 'theme') {
          document.getElementById('body').className = settings.theme;
        }

        if (key === 'discoveryGapLimit' || key === 'discoveryAddressConcurrency') setConfigVar(key, settings[key]);

        console.warn(`set ${key} to ${settings[key]}`);
      }
    }

    setLocalStorageVar('settings', settings);
  }
};

export default initSettings;