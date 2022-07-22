import React, {useState} from 'react';
import Modal from './Modal';
import appInfo from '../package.json';
import {
  isElectron,
  shell,
} from './Electron';

const AboutModal = props => {
  const initialState = {
    isClosed: true,
  };
  const [state, setState] = useState(initialState);

  const close = () => {
    setState(prevState => ({
      ...prevState,
      isClosed: true,
    }));
  }

  const open = () => {
    setState(prevState => ({
      ...prevState,
      isClosed: false,
    }));
  }

  const renderLink = (href, title) => {
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

  const render = () => {
    return (
      <React.Fragment>
        <li onClick={() => open()}>
          <i className="fa fa-copyright"></i>
          {props.sidebarSize === 'full' &&
            <span className="sidebar-item-title">About</span>
          }
        </li>
        <Modal
          title="About"
          show={state.isClosed === false}
          handleClose={() => close()}
          isCloseable={true}
          className="Modal-about">
          <p>
            <strong>Komodo Hardware Wallet App</strong> by {renderLink('https://github.com/atomiclabs', 'Atomic Labs')} and {renderLink('https://github.com/komodoplatform', 'Komodo Platform')}.
          </p>
          <p>
            The {renderLink(`https://github.com/${appInfo.repository}`, 'source code')} is licensed under {renderLink(`https://github.com/${appInfo.repository}/blob/master/LICENSE`, 'MIT')}.
            <br />
            View the {renderLink(`https://github.com/${appInfo.repository}#usage`, 'README')} for usage instructions.
          </p>
        </Modal>
      </React.Fragment>
    );
  }

  return render();
}

export default AboutModal;