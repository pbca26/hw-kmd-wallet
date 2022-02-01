import {
  isElectron,
  appData,
} from './Electron';

export let isDev = false;

if ((!process || (process && process.title !== 'node')) &&
    window.location.href.indexOf('devmode') > -1) {
  isDev = true;
}

if (isElectron &&
    appData.isDev) {
  isDev = true;
}

export const writeLog = isDev ? console.warn : () => {};