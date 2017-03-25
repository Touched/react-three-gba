import * as path from 'path';

import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import SystemBellPlugin from 'system-bell-webpack-plugin';
import CleanWebpackPlugin from 'clean-webpack-plugin';
import merge from 'webpack-merge';

const pkg = require('./package.json');

const config = {
  paths: {
    dist: path.join(__dirname, 'dist'),
    src: path.join(__dirname, 'src'),
    demo: path.join(__dirname, 'demo')
  },
  filename: 'react-three-gba',
  library: 'react-three-gba',
};

const common = {
  resolve: {
    extensions: ['.js', '.jsx', '.css', '.png', '.jpg'],
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        include: [
          config.paths.demo,
          config.paths.src
        ],
        use: [
          'babel-loader',
        ],
      },
      {
        test: /\.(vert|frag)$/,
        use: ['raw-loader'],
      },
      {
        test: /\.png$/,
        loader: 'url-loader?limit=100000&mimetype=image/png',
        include: config.paths.demo
      },
      {
        test: /\.jpg$/,
        loader: 'file-loader',
        include: config.paths.demo
      },
      {
        test: /\.json$/,
        loader: 'json-loader',
        include: path.join(__dirname, 'package.json')
      }
    ]
  },
  plugins: [
    new SystemBellPlugin()
  ]
};

const siteCommon = {
  plugins: [
    new HtmlWebpackPlugin({
      template: require('html-webpack-template'), // eslint-disable-line global-require
      inject: false,
      mobile: true,
      title: pkg.name,
      appMountId: 'app'
    }),
    new webpack.DefinePlugin({
      NAME: JSON.stringify(pkg.name),
      USER: JSON.stringify(pkg.user),
      VERSION: JSON.stringify(pkg.version)
    })
  ]
};

if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
  module.exports = merge(common, siteCommon, {
    devtool: 'eval-source-map',
    entry: {
      demo: [config.paths.demo]
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': '"development"'
      }),
      new webpack.HotModuleReplacementPlugin()
    ],
    module: {
      loaders: [
        {
          test: /\.css$/,
          loaders: ['style-loader', 'css-loader']
        },
        {
          test: /\.jsx?$/,
          loaders: ['babel-loader?cacheDirectory', 'eslint-loader'],
          include: [
            config.paths.demo,
            config.paths.src
          ]
        }
      ]
    },
    devServer: {
      historyApiFallback: true,
      hot: true,
      inline: true,
      host: process.env.HOST,
      port: process.env.PORT,
      stats: 'errors-only',
    }
  });
}

const distCommon = {
  devtool: 'source-map',
  output: {
    path: config.paths.dist,
    libraryTarget: 'commonjs',
    library: config.library
  },
  entry: config.paths.src,
  externals: {
    react: {
      commonjs: 'react',
      commonjs2: 'react',
      amd: 'React',
      root: 'React'
    }
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        use: ['babel-loader'],
        include: [config.paths.src],
      }
    ]
  },
  plugins: [
    new SystemBellPlugin()
  ]
};

if (process.env.NODE_ENV === 'production') {
  module.exports = merge(common, distCommon, {
    output: {
      filename: `${config.filename}.js`
    },
    plugins: [
      new webpack.DefinePlugin({
          'process.env.NODE_ENV': '"production"',
      }),
      /* new webpack.optimize.UglifyJsPlugin({
         compress: {
         warnings: false,
         },
         }), */
    ],
  });

  console.log(module.exports);
}
