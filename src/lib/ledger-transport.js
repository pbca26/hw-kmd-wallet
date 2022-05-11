import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
import TransportWebBLE from '@ledgerhq/hw-transport-web-ble';
import TransportWebHID from '@ledgerhq/hw-transport-webhid';

const transport = {
  webusb: TransportWebUSB,
  ble: TransportWebBLE,
  hid: TransportWebHID,
};

export default transport;
