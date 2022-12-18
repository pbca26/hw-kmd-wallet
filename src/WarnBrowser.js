import React, {useState, useEffect} from 'react';
import {
  isChrome,
  isOpera,
  isFirefox,
} from 'react-device-detect';
import Modal from './Modal';
import Translate, {t} from './Translate';

const WarnBrowser = () => {
  const initialState = {
    isChrome: false,
    isOpera: false,
    isFirefox,
  };
  const [state, setState] = useState(initialState);

  useEffect(() => {
    setState(prevState => ({
      ...prevState,
      isChrome,
      isOpera,
      isFirefox,
    }));
  }, []);

  const close = () => {
    setState(prevState => ({
      ...prevState,
      isChrome: true,
    }));
  }

  return (
    <Modal
      title={t('warn_browser_warning')}
      show={
        state.isChrome === false ||
        state.isOpera === true ||
        state.isFirefox === true
      }
      handleClose={() => close()}
      isCloseable={true}>
      <p><Translate name="warn_browser_you_are_using" /></p>
      <p><Translate name="warn_browser_for_better" /></p>
    </Modal>
  );
}

export default WarnBrowser;
