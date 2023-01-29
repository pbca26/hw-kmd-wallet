import React, {useState} from 'react';
import Modal from './Modal';
import appInfo from '../package.json';
import {
  isElectron,
  shell,
} from './Electron';
import Translate, {t} from './Translate';

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
            <span className="sidebar-item-title"><Translate name="about_about" /></span>
          }
        </li>
        <Modal
          title={t('about_about')}
          show={state.isClosed === false}
          handleClose={() => close()}
          isCloseable={true}
          className="Modal-about">
          <p>
            <strong>Komodo Hardware Wallet App</strong> <Translate name="about_by_sm" /> {renderLink('https://github.com/atomiclabs', 'Atomic Labs')} <Translate name="about_and_sm" /> {renderLink('https://github.com/komodoplatform', 'Komodo Platform')}.
          </p>
          <p>
            <Translate name="about_the" /> {renderLink(`https://github.com/${appInfo.repository}`, t('about_source_code'))} <Translate name="about_is_licensed" /> {renderLink(`https://github.com/${appInfo.repository}/blob/master/LICENSE`, 'MIT')}.
            <br />
            <Translate name="about_view" /> {renderLink(`https://github.com/${appInfo.repository}#usage`, 'README')} <Translate name="about_usage_intructions" />.
          </p>
        </Modal>
      </React.Fragment>
    );
  }

  return render();
}

export default AboutModal;