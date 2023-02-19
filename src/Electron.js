export let isElectron = false;
export let appData;
export let ipcRenderer;
export let shell;
export let helpers;

try {
  window.require('electron');
  isElectron = true;
  appData = window.require('@electron/remote').getGlobal('app');
  helpers = window.require('@electron/remote').getGlobal('app').helpers;
  ipcRenderer = window.require('electron').ipcRenderer;
  shell = window.require('electron').shell;
  console.debug('run app in electron mode');
  if (appData.isDev) console.debug('appData', appData);
} catch (e) {
  console.debug('run app in browser mode');
}