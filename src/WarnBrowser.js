import React from 'react';
import {isChrome} from 'react-device-detect';
import Modal from './Modal';

class WarnBrowser extends React.Component {
  state = {
    isChrome: false
  };

  componentDidMount() {
    this.setState({isChrome,});
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
        show={this.state.isChrome === false}
        handleClose={() => this.close()}
        isCloseable={true}>
        <p>You are using an unsupported browser.</p>
        <p>For better compatibility please use Chrome, Brave or Chromium.</p>
      </Modal>
    );
  }
}

export default WarnBrowser;
