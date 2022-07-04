import React, {useState, useEffect} from 'react';
import QRCode from 'qrcode.react';
import QrReader from 'react-qr-reader';

let mounted = false;

const QRModal = props => {
  const initialState = {
    open: false,
    error: null,
    errorShown: false,
    className: 'hide',
  };
  const [state, setState] = useState(initialState);

  const handleScan = data => {
    if (data !== null &&
        props.mode === 'scan') {
      props.setRecieverFromScan(data);
    }
  }

  useEffect(() => {
    mounted = true;

    return () => {
      mounted = false;
    };
  }, []);

  const handleError = err => {
    if (mounted) {
      setState(prevState => ({
        ...prevState,
        error: err.name,
      }));
    }
  }

  const qRCodeRender = () => {
    return (
      <QRCode
        value={props.content}
        size={Number(props.qrSize) || 198} />
    );
  }

  const qRCodeReaderRender = () => {
    if (!state.errorShown) {
      return (
        <React.Fragment>
          {!state.error &&
            <QrReader
              delay={250}
              className="qr-reader-comp"
              onError={handleError}
              onScan={handleScan} />
          }
          {state.error}
        </React.Fragment>
      );
    } else {
      return null;
    }
  };

  return props.mode === 'scan' ? qRCodeReaderRender() : qRCodeRender();
}

export default QRModal;