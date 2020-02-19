const hotLoader = require('react-app-rewire-hot-loader');
const rewireSass = require('react-app-rewire-scss');

module.exports = function override(config, env) {
  config = hotLoader(config, env);
  config = rewireSass(config, env);
  return config;
}