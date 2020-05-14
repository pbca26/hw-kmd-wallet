# Hardware Komodo wallet

[![](/screenshot.png)](https://pbca26.github.io/hw-kmd-wallet/)

## Usage

- Make sure the KMD app and firmware on your Ledger are up to date.
- Connect your Ledger.
- Open the KMD app on your Ledger.
- Open the Ledger KMD Reward Claim app on your computer.
- Click the "Check Rewards" button.

If you encounter any problems, be sure to check the FAQ below. If you still can't resolve the problem then [open an issue](https://github.com/pbca26/hw-vote/issues/new) with as much information as possible and we'll try and help.

## Tested browsers
Chrome

Other browsers such as Firefox or Brave might not work properly

## My Ledger Nano S (firmware v1.6) is not detected in browser
Exit Komodo app on your device, grant browser permission to access Ledger, open Komodo app again then try to interact with the page again. This usually happens when you're trying to link your device for the first time. After the authorization procedure is done browser should detect the device automatically next time you connect it.

## Ledger on Linux
Add udev rules
`wget -q -O - https://raw.githubusercontent.com/LedgerHQ/udev-rules/master/add_udev_rules.sh | sudo bash`

## License

MIT © Atomic Labs<br />
MIT © Luke Childs<br />
MIT © Komodo Platform<br />
