import TransportU2F from '@ledgerhq/hw-transport-u2f';
import TransportWebUSB from '@ledgerhq/hw-transport-webusb';

const transport = {
  u2f: TransportU2F,
  webusb: TransportWebUSB,
};

export default transport;