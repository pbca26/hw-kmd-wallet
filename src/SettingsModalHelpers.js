import {SETTINGS, VENDOR} from './constants';
import languages from './translate/';
import {t} from './Translate';

const dropdownItems = {
  sidebar: Object.keys(SETTINGS.SIDEBAR).map((item, index) => (
    {
      label: SETTINGS.SIDEBAR[item],
      value: item,
    }
  )),
  autolock: Object.keys(SETTINGS.AUTOLOCK).map((item, index) => (
    {
      label: SETTINGS.AUTOLOCK[item],
      value: item
    }
  )),
  vendor: Object.keys(VENDOR).map((item, index) => (
    {
      label: VENDOR[item],
      value: item
    }
  )),
  discoveryGapLimit: [...Array(SETTINGS.DISCOVERY_GAP_LIMIT / 5).keys()].splice(1, SETTINGS.DISCOVERY_GAP_LIMIT / 5).map((item, index) => (
    {
      label: index === 0 ? (index + 2) * 5 + ` (${t('settings_default_sm')})` : (index + 2) * 5,
      value: (index + 2) * 5
    }
  )),
  discoveryAddressConcurrency: Object.keys(SETTINGS.DISCOVERY_ADDRESS_CONCURRENCY).map((item, index) => (
    {
      label: SETTINGS.DISCOVERY_ADDRESS_CONCURRENCY[item],
      value: index
    }
  )),
  accountIndex: [...Array(SETTINGS.ACCOUNT_INDEX_LIMIT).keys()].map((item, index) => (
    {
      label: index === 0 ? index + ` (${t('settings_default_sm')})` : index,
      value: index,
    }
  )),
  historyLength: [...Array(SETTINGS.HISTORY_LENGTH_LIMIT / 10).keys()].map((item, index) => (
    {
      label: index === 0 ? (index + 1) * 10 + ` (${t('settings_default_sm')})` : (index + 1) * 10,
      value: (index + 1) * 10
    }
  )),
  languages: Object.keys(languages).map((val, index) => (
    {
      value: val,
      label: val,
    }
  ))
};

export default dropdownItems;