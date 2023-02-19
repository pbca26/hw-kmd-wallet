import React from 'react';
import './BetaWarning.scss';
import Translate from './Translate';

const BetaWarning = () => (
  <nav
    className="Beta-warning"
    aria-label="main navigation">
    <div className="container">
      <span>
        <strong><Translate name="beta_warning_modal" />:</strong> <Translate name="beta_warning_modal_beta_version" />
      </span>
    </div>
  </nav>
);

export default BetaWarning;
