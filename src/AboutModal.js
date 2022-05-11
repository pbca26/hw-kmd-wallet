import React from 'react';
import Modal from './Modal';
import appInfo from '../package.json';
import {
  isElectron,
  shell,
} from './Electron';

class AboutModal extends React.Component {
  state = this.initialState;
  
  get initialState() {
    return {
      isClosed: true,
    };
  };

  close() {
    this.setState({
      isClosed: true,
    });
  }

  open() {
    this.setState({
      isClosed: false,
    });
  }

  renderLink(href, title) {
    return (
      <React.Fragment>
        {isElectron &&
          <a
            href="!#"
            onClick={() => shell.openExternal(href)}>{title}</a>
        }
        {!isElectron &&
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={href}>{title}</a>
        }
      </React.Fragment>
    );
  }

  render() {
    return (
      <React.Fragment>
        <li onClick={() => this.open()}>
          <i className="fa fa-copyright"></i>
          {this.props.sidebarSize === 'full' &&
            <span className="sidebar-item-title">About</span>
          }
        </li>
        <Modal
          title="About"
          show={this.state.isClosed === false}
          handleClose={() => this.close()}
          isCloseable={true}
          className="Modal-about">
          <p>
            <strong>KMD hardware wallet</strong> by {this.renderLink('https://github.com/atomiclabs', 'Atomic Labs')} and {this.renderLink('https://github.com/komodoplatform', 'Komodo Platform')}.
          </p>
          <p>
            The {this.renderLink(`https://github.com/${appInfo.repository}`, 'source code')} is licensed under {this.renderLink(`https://github.com/${appInfo.repository}/blob/master/LICENSE`, 'MIT')}.
            <br />
            View the {this.renderLink(`https://github.com/${appInfo.repository}#usage`, 'README')} for usage instructions.
          </p>
        </Modal>
      </React.Fragment>
    );
  }
}

export default AboutModal;