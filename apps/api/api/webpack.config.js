const { composePlugins, withNx } = require('@nx/webpack');
const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

// Nx plugins for webpack.
module.exports = composePlugins(withNx(), (config) => {
  // Update the webpack config as needed here.
  // e.g. `config.plugins.push(new MyPlugin())`
  config.output = {
    path: join(__dirname, '../../../dist/apps/api/api'),
  };

  config.plugins = [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
    }),
  ];

  return config;
});
