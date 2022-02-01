import React from 'react';
import './Modal.scss';

class Modal extends React.Component {
  componentDidUpdate() {
    const modals = document.getElementsByClassName('Modal modal is-active');
    const docroot = document.getElementsByTagName('html')[0];
    
    docroot.className = modals.length ? 'no-scroll' : 'scroll';
  }

  render() {
    const {
      children,
      title,
      show,
      isCloseable,
      handleClose,
      className
    } = this.props;

    return (
      <div className={`Modal modal ${show ? 'is-active' : ''}${className ? ' ' + className : ''}`}>
        <div onClick={() => isCloseable && handleClose && handleClose()}>
          <div className="modal-background"></div>
          <button className={`modal-close is-large ${!isCloseable ? 'is-invisible' : ''}`}></button>
        </div>
        <div className="modal-content">
          <div className="card">
            <header className="card-header">
              <p className="card-header-title">
                {title}
              </p>
            </header>
            <div className="card-content">
              <div className="content">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default Modal;
