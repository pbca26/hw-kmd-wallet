import React from 'react';
import {isSupported} from 'u2f-api';
import Modal from './Modal';

class WarnU2fCompatibility extends React.Component {
  state = {
    u2fSupported: null
  };

  async componentDidMount() {
    this.setState({u2fSupported: await isSupported()});
  }

  render() {
    return (
      <Modal title="Warning: U2F Not Supported in This Browser" show={this.state.u2fSupported === false}>
        <p>The U2F API is required for the web browser to communicate with the {this.state.vendor === 'ledger' ? 'Ledger' : 'Trezor'} device.</p>
        <p>Try using Chrome or Opera instead.</p>
        <p>You can view a list of U2F supporting browsers at <a target="_blank" rel="noopener noreferrer" href="https://caniuse.com/#feat=u2f">caniuse.com/#feat=u2f</a>.</p>
      </Modal>
    );
  }
}

export default WarnU2fCompatibility;
