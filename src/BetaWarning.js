import React from 'react';
import './BetaWarning.scss';

const BetaWarning = () => (
  <nav className="Beta-warning navbar is-fixed-top" role="navigation" aria-label="main navigation">
    <div className="container">
      <span>
        <strong>Warning:</strong> This is a beta version! Please do not use it to transact any substantial amounts.
      </span>
    </div>
  </nav>
);

export default BetaWarning;
