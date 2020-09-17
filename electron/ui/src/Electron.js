export let isElectron = false;
export let appData;
export let ipcRenderer; 

try {
  window.require('electron');
  isElectron = true;
  appData = window.require('electron').remote.getGlobal('app');
  ipcRenderer = window.require('electron').ipcRenderer;
  console.warn('run app in electron mode');
  console.warn('appData', appData);
} catch (e) {
  console.warn('run app in browser mode');
}