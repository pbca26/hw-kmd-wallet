export let isElectron = false;
export let appData;
export let ipcRenderer;
export let shell;

try {
  window.require('electron');
  isElectron = true;
  appData = window.require('electron').remote.getGlobal('app');
  ipcRenderer = window.require('electron').ipcRenderer;
  shell = window.require('electron').shell;
  console.warn('run app in electron mode');
  console.warn('appData', appData);
} catch (e) {
  console.warn('run app in browser mode');
}