import React, {useState, useEffect} from 'react';
import {
  isChrome,
  isOpera,
  isFirefox,
} from 'react-device-detect';
import Modal from './Modal';

const WarnBrowser = props => {
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
      title="Warning: This Browser Is Not Supported"
      show={
        state.isChrome === false ||
        state.isOpera === true ||
        state.isFirefox === true
      }
      handleClose={() => close()}
      isCloseable={true}>
      <p>You are using an unsupported browser.</p>
      <p>For better compatibility please use Chrome, Brave or Chromium.</p>
    </Modal>
  );
}

export default WarnBrowser;
