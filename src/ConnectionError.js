import React from 'react';
import './ConnectionError.scss';
import Translate from './Translate';

const ConnectionError = () => (
  <nav
    className="Connection-error navbar is-fixed-top"
    aria-label="main navigation">
    <div className="container">
      <span>
        <strong><Translate name="conn_error_modal_err" />:</strong> <Translate name="conn_error_modal_unable_to_connect" />
      </span>
    </div>
  </nav>
);

export default ConnectionError;
