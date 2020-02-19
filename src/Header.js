import React from 'react';
import './Header.scss';

const Header = ({children}) => (
  <nav className="Header navbar is-fixed-top" role="navigation" aria-label="main navigation">
    <div className="container">
      {children}
    </div>
  </nav>
);

export default Header;
