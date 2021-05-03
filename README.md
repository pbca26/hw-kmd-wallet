# Hardware Komodo wallet

> Claim your KMD rewards on your hardware wallet device - [https://pbca26.github.io/hw-kmd-wallet/](https://pbca26.github.io/hw-kmd-wallet/)

[![](/screenshot.png)](https://pbca26.github.io/hw-kmd-wallet/)

## Supported browsers
Current version is tested to work in Chrome. Other browser like Opera or Firefox might not work well in WEB USB mode.

Also, you can consult with this page to see if your browser is capable to commuicate with Ledger/Trezor device [U2F](https://caniuse.com/#feat=u2f), [WEBUSB](https://caniuse.com/#feat=webusb).

## Usage on Ledger

- Make sure the KMD app and firmware on your Ledger are up to date.
- Connect your Ledger.
- Open the KMD app on your Ledger.
- Open the Hardware Wallet KMD Reward Claim app on your computer.
- Click the "Check Rewards" button.

## Usage on Trezor

- Make sure firmware on your Trezor is up to date.
- Install Trezor Bridge if you haven't done it yet.
- Connect your Trezor.
- Open the Hardware Wallet KMD Reward Claim app on your computer.
- Click the "Check Rewards" button.

If you encounter any problems, be sure to check the FAQ below. If you still can't resolve the problem then [open an issue](https://github.com/pbca26/hw-kmd-wallet/issues/new) with as much information as possible and we'll try and help.

## FAQ

### My Ledger Nano S (firmware v1.6) / Nano X is not detected in browser
Exit Komodo app on your device, grant browser permission to access Ledger, open Komodo app again then try to interact with the page again. This usually happens when you're trying to link your device for the first time. After the authorization procedure is done browser should detect the device automatically next time you connect it.

Also, make sure that you close Ledger Live or any other apps that might be using connection to your device before trying to use Komodo Hardware Wallet app.

### Ledger on Linux
Add udev rules
`wget -q -O - https://raw.githubusercontent.com/LedgerHQ/udev-rules/master/add_udev_rules.sh | sudo bash`

### Ledger on Latest Chrome browser
If you're experiencing issues connecting your Ledger device open the following url chrome://flags#new-usb-backend in Chrome browser and disable it. Alternatively you can try Chromium or Brave browsers.

## Build/compile issues
If you are experiencing build issues that lead to minify errors add required modules to [config-overrides.js](https://github.com/pbca26/hw-kmd-wallet/blob/master/config-overrides.js#L19) file.

## License

MIT © Atomic Labs<br />
MIT © Luke Childs<br />
MIT © Komodo Platform
