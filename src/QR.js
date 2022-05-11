import React from 'react';
import QRCode from 'qrcode.react';
import QrReader from 'react-qr-reader';

class QRModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      error: null,
      errorShown: false,
      className: 'hide',
    };
    this.mounted = false;
    this.handleScan = this.handleScan.bind(this);
    this.handleError = this.handleError.bind(this);
  }

  handleScan(data) {
    if (data !== null &&
        this.props.mode === 'scan') {
      this.props.setRecieverFromScan(data);
    }
  }

  componentDidMount() {
    this.mounted = true;
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  handleError(err) {
    if (this.mounted) {
      this.setState({
        error: err.name,
      });
    }
  }

  qRCodeRender() {
    return (
      <QRCode
        value={this.props.content}
        size={Number(this.props.qrSize) || 198} />
    );
  }

  qRCodeReaderRender() {
    if (!this.state.errorShown) {
      return (
        <React.Fragment>
          {!this.state.error &&
            <QrReader
              delay={250}
              className="qr-reader-comp"
              onError={this.handleError}
              onScan={this.handleScan} />
          }
          {this.state.error}
        </React.Fragment>
      );
    } else {
      return null;
    }
  };

  render() {
    return this.props.mode === 'scan' ? this.qRCodeReaderRender() : this.qRCodeRender();
  }
}

export default QRModal;