import React from 'react';
import './Footer.scss';

const Footer = ({children}) => (
  <footer className="Footer">
    <div className="content has-text-centered">
      {children}
    </div>
  </footer>
);

export default Footer;
