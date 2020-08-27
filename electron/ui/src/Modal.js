import React from 'react';
import './Modal.scss';

const Modal = ({
  children,
  title,
  show,
  isCloseable,
  handleClose,
}) => (
  <div className={`Modal modal ${show ? 'is-active' : ''}`}>
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

export default Modal;
