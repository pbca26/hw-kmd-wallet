import React from 'react';
import Modal from './Modal';
import Footer from './Footer';
import {
  repository,
  version,
} from '../package.json';
//import './AboutModal.scss';

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

  render() {
    return (
      <React.Fragment>
        <li onClick={() => this.open()}>
          <i className="fa fa-copyright"></i>
        </li>
        <Modal
          title="About"
          show={this.state.isClosed === false}
          handleClose={() => this.close()}
          isCloseable={true}
          className="Modal-about">
          <p>
            <strong>KMD hardware wallet</strong> by <a target="_blank" rel="noopener noreferrer" href="https://github.com/atomiclabs">Atomic Labs</a> and <a target="_blank" rel="noopener noreferrer" href="https://github.com/komodoplatform">Komodo Platform</a>.
          </p>
          <p>
            The <a target="_blank" rel="noopener noreferrer" href={`https://github.com/${repository}`}>source code</a> is licensed under <a target="_blank" rel="noopener noreferrer" href={`https://github.com/${repository}/blob/master/LICENSE`}>MIT</a>.
            <br />
            View the <a target="_blank" rel="noopener noreferrer" href={`https://github.com/${repository}#usage`}>README</a> for usage instructions.
          </p>
        </Modal>
      </React.Fragment>
    );
  }
}

export default AboutModal;