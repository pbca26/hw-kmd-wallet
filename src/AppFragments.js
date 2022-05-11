import React from 'react';
import Header from './Header';
import {
  voteCoin,
  VENDOR,
} from './constants';

export const DesktopDownloadButton = () => (
  <div className="download-desktop-block">
    <a
      href="https://github.com/pbca26/hw-kmd-wallet/releases"
      target="_blank"
      rel="noopener noreferrer">
      <button
        className="button is-light">
        <i className="fa fa-download"></i>Download for desktop
      </button>
    </a>
  </div>
);

export const HeaderNonAuth = ({coin}) => (
  <Header>
    <div className="navbar-brand">
      <div className="navbar-item">
        <img
          src={`${process.env.NODE_ENV === 'development' ? process.env.PUBLIC_URL + '/' : ''}favicon.png`}
          className="KmdIcon"
          alt="Komodo logo" />
      </div>
      <h1 className="navbar-item">
        <strong>HW KMD {coin === voteCoin ? 'Notary Elections' : ' wallet'}</strong>
      </h1>
    </div>
  </Header>
);

export const HeaderAuth = ({coin, vendor, syncInProgress}) => (
  <Header>
    <div className="navbar-brand">
      <div className="navbar-item">
        <img
          src={`${process.env.NODE_ENV === 'development' ? process.env.PUBLIC_URL + '/' : ''}favicon.png`}
          className="KmdIcon"
          alt="Komodo logo" />
      </div>
      <h1 className="navbar-item">
        {!vendor &&
          <strong>HW KMD {coin === voteCoin ? 'Notary Elections' : ' wallet'}</strong>
        }
        {vendor &&
          <strong>{VENDOR[vendor]} KMD HW {coin === voteCoin ? 'Notary Elections' : ' wallet'}</strong>
        }
        {syncInProgress &&
          <i
            className="fa fa-redo-alt sync-progress-icon"
            title="Sync in progress..."></i>
        }
      </h1>
    </div>
  </Header>
);

export const VendorSelector = ({setVendor}) => (
  <div className="vendor-selector">
    <h3>Choose your vendor</h3>
    <div className="vendor-selector-items">
      <img
        className="vendor-ledger"
        src={`${process.env.NODE_ENV === 'development' ? process.env.PUBLIC_URL + '/' : ''}ledger-logo.png`}
        alt="Ledger"
        onClick={() => setVendor('ledger')} />
      <img
        className="vendor-trezor"
        src={`${process.env.NODE_ENV === 'development' ? process.env.PUBLIC_URL + '/' : ''}trezor-logo.png`}
        alt="Trezor"
        onClick={() => setVendor('trezor')} />
    </div>
  </div>
);

export const VendorImage = ({vendor}) => (
  <img
    className="hw-graphic"
    src={`${process.env.NODE_ENV === 'development' ? process.env.PUBLIC_URL + '/' : ''}${vendor}-logo.png`}
    alt={VENDOR[vendor]} />
);