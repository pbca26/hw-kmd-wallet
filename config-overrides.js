const hotLoader = require('react-app-rewire-hot-loader');
const rewireSass = require('react-app-rewire-scss');
const {paths} = require('react-app-rewired');
const path = require('path');

module.exports = {
  webpack: function (config, env) {
    // workaround for es6 node_modules minify errors
    config.module.rules[1].oneOf[1].include = [
      paths.appSrc,
      path.resolve(paths.appNodeModules, 'bitcoinjs-lib'),
      path.resolve(paths.appNodeModules, 'ow'),
      path.resolve(paths.appNodeModules, 'create-xpub'),
      path.resolve(paths.appNodeModules, 'build-output-script'),
      path.resolve(paths.appNodeModules, 'get-komodo-rewards'),
      path.resolve(paths.appNodeModules, 'tiny-secp256k1'),
      path.resolve(paths.appNodeModules, 'bip32'),
      path.resolve(paths.appNodeModules, 'typeforce'),
      path.resolve(paths.appNodeModules, 'semver'),
      path.resolve(paths.appNodeModules, 'lru-cache'),
      path.resolve(paths.appNodeModules, 'yallist'),
      path.resolve(paths.appNodeModules, 'u2f-api'),
      path.resolve(paths.appNodeModules, 'asn1.js'),
      path.resolve(paths.appNodeModules, 'bech32'),
      path.resolve(paths.appNodeModules, '@trezor/utxo-lib'),
      path.resolve(paths.appNodeModules, '@ledgerhq/hw-app-btc'),
      path.resolve(paths.appNodeModules, '@ledgerhq/hw-transport/lib-es'),
      path.resolve(paths.appNodeModules, '@ledgerhq/hw-transport-webusb/lib-es'),
      path.resolve(paths.appNodeModules, '@ledgerhq/hw-transport-u2f/lib-es'),
      path.resolve(paths.appNodeModules, '@ledgerhq/hw-transport-webhid/lib-es'),
    ];

    config = hotLoader(config, env);
    config = rewireSass(config, env);

    return config;
  }
}