# Hardware Komodo wallet

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

## Known Ledger issues
- If you're using Ledger Nano S firmware 1.6 please select WEBUSB mode for it to work properly
- If you're using Ledger Nano S firmware below 1.6 you can chose either U2F or WEBUSB
- If you're using Ledger Nano X on Windows please select U2F mode for it to work properly

## Ledger on Linux
Add udev rules
`wget -q -O - https://raw.githubusercontent.com/LedgerHQ/udev-rules/master/add_udev_rules.sh | sudo bash`

## License

MIT © Atomic Labs<br />
MIT © Luke Childs<br />
MIT © Komodo Platform<br />
