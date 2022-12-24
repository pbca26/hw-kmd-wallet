import {
  isElectron,
  appData,
} from './Electron';

export let isDev = false;

if ((!process || (process && process.title !== 'node') && typeof window !== 'undefined') &&
    window.location.href.indexOf('devmode') > -1) {
  isDev = true;
}

if (isElectron &&
    appData.isDev) {
  isDev = true;
}

//export const writeLog = isDev ? console.debug : () => {};
export const writeLog = console.debug;