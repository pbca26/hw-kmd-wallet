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
import {CACHE_MAX_LIFETIME} from './constants';
import {checkTimestamp} from './lib/time';

class Sidebar extends React.Component {
  state = this.initialState;
  
  get initialState() {
    return {
    };
  };

  logout() {
    this.props.resetState('logout');
  }

  render() {
    const sidebarSize = getLocalStorageVar('settings').sidebarSize || 'short';
    writeLog('sidebar props', this.props);
    
    return (
      <div className={'sidebar-right sidebar-' + sidebarSize}>
        <ul>
          {this.props.isCoinData() &&
           this.props.activeCoin &&
           this.props.vendor &&
            <li onClick={() => this.props.setActiveCoin(null)}>
              <i className="fa fa-coins"></i>
              {sidebarSize === 'full' &&
                <span className="sidebar-item-title">Holdings</span>
              }
            </li>
          }
          {this.props.activeAccount !== null &&
            <li onClick={() => this.props.setActiveAccount(null)}>
              <i className="fa fa-wallet"></i>
              {sidebarSize === 'full' &&
                <span className="sidebar-item-title">Accounts</span>
              }
            </li>
          }
          {this.props.activeCoin &&
            <SendCoinButton
              accounts={this.props.accounts}
              vendor={this.props.vendor}
              syncData={this.props.syncData}
              coin={this.props.activeCoin}
              sidebarSize={sidebarSize}
              checkTipTime={this.props.checkTipTime}
              disabled={
                (this.props.activeCoin === 'KMD' && !this.props.coins.KMD.lastChecked) ||
                (this.props.activeCoin === 'KMD' && this.props.coins.KMD.lastChecked && checkTimestamp(this.props.coins.KMD.lastChecked) > CACHE_MAX_LIFETIME)
              }>
              Send
            </SendCoinButton>
          }
          {this.props.activeCoin &&
            <ReceiveCoinButton
              vendor={this.props.vendor}
              coin={this.props.activeCoin}
              accounts={this.props.accounts}
              sidebarSize={sidebarSize}>
              Receive
            </ReceiveCoinButton>
          }
          {this.props.loginModalClosed &&
            <li>
              <SettingsModal
                coin={this.props.activeCoin || 'KMD'}
                setVendor={this.props.setVendor}
                resetState={this.props.resetState}
                isAuth={this.props.isAuth}
                triggerSidebarSizeChange={this.props.triggerSidebarSizeChange}
                sidebarSize={sidebarSize}
                updateExplorerEndpoint={this.props.updateExplorerEndpoint} />
            </li>
          }
          <li className="sidebar-item-no-pad">
            {isElectron &&
              <a onClick={() => shell.openExternal('https://github.com/pbca26/hw-kmd-wallet/issues/new')}>
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
                className="sidebar-item-no-pad">
                <i className="fa fa-life-ring"></i>
                {sidebarSize === 'full' &&
                  <span className="sidebar-item-title">Feedback</span>
                }
              </a>
            }
          </li>
          <AboutModal sidebarSize={sidebarSize} />
          {this.props.isAuth &&
            <li onClick={() => this.logout()}>
              <i className="fa fa-lock"></i>
              {sidebarSize === 'full' &&
                <span className="sidebar-item-title">Lock</span>
              }
            </li>
          }
        </ul>
      </div>
    );
  }
}

export default Sidebar;