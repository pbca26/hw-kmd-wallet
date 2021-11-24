import React from 'react';
import Modal from './Modal';
import Boolean from './Boolean';
import './ActionListModal.scss';

const ActionListModal = ({
  children,
  actions = [],
  error,
  success,
  className,
  childrenPosition,
  topText,
  display = true,
  ...modalProps
}) => (
  <div className={`ActionListModal${className ? ' ' + className : ''}`}>
    <Modal isCloseable={error || success} {...modalProps}>
      {topText &&
        <p>{topText}</p>
      }
      {!childrenPosition || (childrenPosition && childrenPosition === 'top') ? children : ''}
      {display &&
        <div className="panel">
          {Object.keys(actions).map(action => {
            const {
              icon,
              description,
              state
            } = actions[action];

            return (
              <div
                key={action}
                className={`panel-block ${state === 'loading' ? 'is-active' : ''}`}>
                <span className="left-icon icon has-text-grey">
                  <i className={icon}></i>
                </span>
                {description}
                <div className="right-icon">
                  {typeof state === 'boolean' ? (
                    <Boolean value={state} />
                  ) : state === 'loading' ? (
                    <span className="icon has-text-grey">
                      <i className="fas fa-circle-notch fa-spin" aria-hidden="true"></i>
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      }

      {error ? (
        <div className="notification is-danger">
          <strong>Error</strong>
          <p>{error}</p>
        </div>
      ) : null}

      {success ? (
        <div className="notification is-success">
          <strong>Success</strong>
          <p>{success}</p>
        </div>
      ) : null}

      {childrenPosition && childrenPosition === 'bottom' ? children : ''}
    </Modal>
  </div>
);

export default ActionListModal;
