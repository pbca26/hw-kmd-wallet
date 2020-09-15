import TransportU2F from '@ledgerhq/hw-transport-u2f';
import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
import TransportWebBLE from '@ledgerhq/hw-transport-web-ble';
import TransportWebHID from '@ledgerhq/hw-transport-webhid';

const transport = {
  u2f: TransportU2F,
  webusb: TransportWebUSB,
  ble: TransportWebBLE,
  hid: TransportWebHID,
};

export default transport;
