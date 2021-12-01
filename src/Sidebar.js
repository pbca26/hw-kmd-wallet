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

class Sidebar extends React.Component {
  state = this.initialState;
  
  get initialState() {
    return {
    };
  };

  render() {
    writeLog('sidebar props', this.props);
    
    return (
      <div className="sidebar-right">
        <ul>
          {this.props.isCoinData() &&
           this.props.activeCoin &&
           this.props.vendor &&
            <li onClick={() => this.props.setActiveCoin(null)}>
              <i className="fa fa-coins"></i>
            </li>
          }
          {this.props.activeAccount !== null &&
            <li onClick={() => this.props.setActiveAccount(null)}>
              <i className="fa fa-wallet"></i>
            </li>
          }
          {this.props.activeCoin &&
            <SendCoinButton
              accounts={this.props.accounts}
              vendor={this.props.vendor}
              syncData={this.props.syncData}
              coin={this.props.activeCoin}>
              Send
            </SendCoinButton>
          }
          {this.props.activeCoin &&
            <ReceiveCoinButton
              vendor={this.props.vendor}
              coin={this.props.activeCoin}
              accounts={this.props.accounts}>
              Receive
            </ReceiveCoinButton>
          }
          {this.props.loginModalClosed &&
            <SettingsModal
              coin={this.props.activeCoin || 'KMD'}
              setVendor={this.props.setVendor} />
          }
          <li>
            {isElectron &&
              <a onClick={() => shell.openExternal('https://github.com/pbca26/hw-kmd-wallet/issues/new')}><i className="fa fa-life-ring"></i></a>
            }
            {!isElectron &&
              <a
                target="_blank"
                href="https://github.com/pbca26/hw-kmd-wallet/issues/new"><i className="fa fa-life-ring"></i></a>
            }
          </li>
          <AboutModal />
        </ul>
      </div>
    );
  }
}

export default Sidebar;