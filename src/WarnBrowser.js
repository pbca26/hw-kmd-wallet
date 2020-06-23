import React from 'react';
import {
  isChrome,
  isOpera,
  isFirefox,
} from 'react-device-detect';
import Modal from './Modal';

class WarnBrowser extends React.Component {
  state = {
    isChrome: false,
    isOpera: false,
    isFirefox,
  };

  componentDidMount() {
    this.setState({
      isChrome,
      isOpera,
      isFirefox,
    });
  }

  close() {
    this.setState({
      isChrome: true,
    });
  }

  render() {
    return (
      <Modal
        title="Warning: This Browser Is Not Supported"
        show={
          this.state.isChrome === false ||
          this.state.isOpera === true ||
          this.state.isFirefox === true
        }
        handleClose={() => this.close()}
        isCloseable={true}>
        <p>You are using an unsupported browser.</p>
        <p>For better compatibility please use Chrome, Brave or Chromium.</p>
      </Modal>
    );
  }
}

export default WarnBrowser;
