import React from 'react';
import AboutModal from './AboutModal';
import SendCoinButton from './SendCoinButton';
import ReceiveCoinButton from './ReceiveCoinButton';
import SettingsModal from './SettingsModal';
import {writeLog} from './Debug';
import {
  isElectron,
  shell,
} from './Electron';
import {getLocalStorageVar} from './lib/localstorage-util';
import appInfo from '../package.json';
import {CACHE_MAX_LIFETIME} from './constants';
import {checkTimestamp} from './lib/time';
import './Sidebar.scss';

const Sidebar = props => {
  const logout = () => {
    props.resetState('logout');
  }

  const render = () => {
    const sidebarSize = getLocalStorageVar('settings').sidebarSize || 'short';
    writeLog('sidebar props', props);
    
    return (
      <div className={`sidebar-right sidebar-${sidebarSize}`}>
        <ul>
          {props.isCoinData() &&
           props.activeCoin &&
           props.vendor &&
            <li onClick={() => props.setActiveCoin(null)}>
              <i className="fa fa-coins"></i>
              {sidebarSize === 'full' &&
                <span className="sidebar-item-title">Holdings</span>
              }
            </li>
          }
          {props.activeAccount !== null &&
            <li onClick={() => props.setActiveAccount(null)}>
              <i className="fa fa-wallet"></i>
              {sidebarSize === 'full' &&
                <span className="sidebar-item-title">Accounts</span>
              }
            </li>
          }
          {props.activeCoin &&
            <SendCoinButton
              accounts={props.accounts}
              vendor={props.vendor}
              syncData={props.syncData}
              coin={props.activeCoin}
              sidebarSize={sidebarSize}
              checkTipTime={props.checkTipTime}
              disabled={
                (props.activeCoin === 'KMD' && !props.coins.KMD.lastChecked) ||
                (props.activeCoin === 'KMD' && props.coins.KMD.lastChecked && checkTimestamp(props.coins.KMD.lastChecked) > CACHE_MAX_LIFETIME)
              }>
              Send
            </SendCoinButton>
          }
          {props.activeCoin &&
            <ReceiveCoinButton
              vendor={props.vendor}
              coin={props.activeCoin}
              accounts={props.accounts}
              sidebarSize={sidebarSize}>
              Receive
            </ReceiveCoinButton>
          }
          {props.loginModalClosed &&
            <li>
              <SettingsModal
                coin={props.activeCoin || 'KMD'}
                setVendor={props.setVendor}
                resetState={props.resetState}
                isAuth={props.isAuth}
                triggerSidebarSizeChange={props.triggerSidebarSizeChange}
                sidebarSize={sidebarSize}
                updateExplorerEndpoint={props.updateExplorerEndpoint} />
            </li>
          }
          <li className="sidebar-item-no-pad">
            {isElectron &&
              <a
                href="!#"
                onClick={() => shell.openExternal('https://github.com/pbca26/hw-kmd-wallet/issues/new')}>
                <i className="fa fa-life-ring"></i>
                {sidebarSize === 'full' &&
                  <span className="sidebar-item-title">Feedback</span>
                }
              </a>
            }
            {!isElectron &&
              <a
                target="_blank"
                href="https://github.com/pbca26/hw-kmd-wallet/issues/new"
                rel="noopener noreferrer"
                className="sidebar-item-no-pad">
                <i className="fa fa-life-ring"></i>
                {sidebarSize === 'full' &&
                  <span className="sidebar-item-title">Feedback</span>
                }
              </a>
            }
          </li>
          <AboutModal sidebarSize={sidebarSize} />
          {props.isAuth &&
            <li onClick={() => logout()}>
              <i className="fa fa-lock"></i>
              {sidebarSize === 'full' &&
                <span className="sidebar-item-title">Lock</span>
              }
            </li>
          }
        </ul>
        <div className="sidebar-app-version">v{appInfo.version}</div>
      </div>
    );
  }

  return render();
}

export default Sidebar;