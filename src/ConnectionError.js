import React from 'react';
import './ConnectionError.scss';

const ConnectionError = () => (
  <nav
    className="Connection-error navbar is-fixed-top"
    aria-label="main navigation">
    <div className="container">
      <span>
        <strong>Error:</strong> unable to connect to API endpoint. Please retry later.
      </span>
    </div>
  </nav>
);

export default ConnectionError;
