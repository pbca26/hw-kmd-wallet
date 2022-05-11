const webpack = require('webpack');
const {paths} = require('react-app-rewired');
const path = require('path');

module.exports = function override(config) {
  config.ignoreWarnings = [/Failed to parse source map/];
  
  const fallback = config.resolve.fallback || {};
  Object.assign(fallback, {
    'crypto': require.resolve('crypto-browserify'),
    'buffer': require.resolve('buffer'),
    'stream': require.resolve('stream-browserify'),
  })
  config.resolve.fallback = fallback;
  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer']
    })
  ]);

  return config;
}