import React, {useEffect} from 'react';
import './Modal.scss';

const Modal = props => {
  useEffect(() => {
    const modals = document.getElementsByClassName('Modal modal is-active');
    const docroot = document.getElementsByTagName('html')[0];
    
    docroot.className = modals.length ? 'no-scroll' : 'scroll';
  });

  const render = () => {
    const {
      children,
      title,
      show,
      isCloseable,
      handleClose,
      className
    } = props;

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
  
  return render();
};

export default Modal;
