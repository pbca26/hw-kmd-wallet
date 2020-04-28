const hotLoader = require('react-app-rewire-hot-loader');
const rewireSass = require('react-app-rewire-scss');
const {paths} = require('react-app-rewired');
const path = require('path');

module.exports = {
  webpack: function (config, env) {
    if (env === 'production') {
      config.module.rules[1].oneOf[1].include = [
        paths.appSrc,
        path.resolve(paths.appNodeModules, 'bitcoinjs-lib'),
        path.resolve(paths.appNodeModules, 'ow'),
        path.resolve(paths.appNodeModules, 'create-xpub'),
        path.resolve(paths.appNodeModules, 'build-output-script'),
        path.resolve(paths.appNodeModules, 'get-komodo-rewards'),
        path.resolve(paths.appNodeModules, 'tiny-secp256k1'),
        path.resolve(paths.appNodeModules, 'bip32'),
        path.resolve(paths.appNodeModules, 'typeforce')
      ];
    }

    config = hotLoader(config, env);
    config = rewireSass(config, env);

    return config;
  }
}