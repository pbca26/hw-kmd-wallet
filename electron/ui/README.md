# Hardware Wallet KMD Reward Claim

> Claim your KMD rewards on your hardware wallet device - [https://pbca26.github.io/hw-kmd-reward-claim/](https://pbca26.github.io/hw-kmd-reward-claim/)

[![](/screenshot.png)](https://pbca26.github.io/hw-kmd-reward-claim/)

## Supported browsers
Current version is tested to work in Chrome. Other browser like Brave or Firefox might not work well in web usb mode.

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

If you encounter any problems, be sure to check the FAQ below. If you still can't resolve the problem then [open an issue](https://github.com/pbca26/hw-kmd-reward-claim/issues/new) with as much information as possible and we'll try and help.

## FAQ

### My Ledger Nano S (firmware v1.6) / Nano X is not detected in browser
Exit Komodo app on your device, grant browser permission to access Ledger, open Komodo app again then try to interact with the page again. This usually happens when you're trying to link your device for the first time. After the authorization procedure is done browser should detect the device automatically next time you connect it.

Also, make sure that you close Ledger Live or any other apps that might be using connection to your device before trying to claim KMD rewards.

### Ledger on Linux
Add udev rules
`wget -q -O - https://raw.githubusercontent.com/LedgerHQ/udev-rules/master/add_udev_rules.sh | sudo bash`

- [I get an error signing or broadcasting my claim transaction, what went wrong?](#i-get-an-error-signing-or-broadcasting-my-claim-transaction-what-went-wrong)
- [Why do all my funds get sent back to a new address?](#why-do-all-my-funds-get-sent-back-to-a-new-address)
- [My browser is unsupported, can you support it?](#my-browser-is-unsupported-can-you-support-it)

### I get an error signing or broadcasting my claim transaction on Ledger, what went wrong?

This is most likely because you are using an outdated version of the KMD app on your Ledger which doesn't support the overwinter hardfork.

Make sure the KMD app and firmware on your Ledger are up to date before trying to claim your rewards.

### I get an error checking rewards, signing or broadcasting my claim transaction on Trezor, what went wrong?

This is most likely because you are using an outdated version of the Trezor firmware which doesn't have KMD integration.

Make sure the firmware on your Trezor is up to date before trying to claim your rewards.

If you are sure your device is up to date then please [open an issue](https://github.com/pbca26/hw-kmd-reward-claim/issues/new) with as much information as possible and we'll try and help.

### Why do all my funds get sent back to a new address?

We follow the same BIP44 standard that Ledger Live/Trezor wallet follows. We will send your reward claim to the next unused address in your account. This means all UTXOs in a single account are consolidated in a single transaction, which does have some privacy implications. However, in the Komodo ecosystem, most wallets just have a single address which is re-used, this is even worse for privacy. If you want privacy you should use a shielded address. Therefore, after consulting with Komodo lead developer jl777, we don't see this to be an issue.

To clarify, to preserve privacy across accounts, UTXOs in different accounts will **never** be mixed together, this is why you need to claim your rewards in each account separately. For increased anonymity, you should claim each account on different days to avoid time analysis linking the separate claims.

If consolidating the UTXOs is an issue for you and you'd like a solution that doesn't link addresses together, then [please let us know](https://github.com/atomiclabs/ledger-kmd-reward-claim/issues/3).

## Build/compile issues
If you are experiencing build issues that lead to minify errors add required modules to [config-overrides.js](https://github.com/pbca26/hw-kmd-reward-claim/blob/master/config-overrides.js#L19) file.

## Credits

While this app was built by Atomic Labs and Komodo Plaform, many community members were a great help.

### Reference reward calculation code

- jl777 (C++)
- pbca26 (JavaScript)
- CHMEX (PHP)

### Consultation

- jl777
- ComputerGenie
- jorian

### Testing

- zatJUM
- TonyL
- SHossain

If you feel you've contributed and aren't listed here, please let us know.

## License

MIT © Atomic Labs<br />
MIT © Luke Childs<br />
MIT © Komodo Platform
