const webpack = require('webpack');
const writeFilePlugin = require('write-file-webpack-plugin');
const webpackMerge = require('webpack-merge');
const path = require('path');

const utils = require('./utils.js');
const commonConfig = require('./webpack.common.js');

const ENV = 'development';

module.exports = webpackMerge(commonConfig({ env: ENV }), {
    devtool: 'eval-source-map',
    devServer: {
        contentBase: './target/www',
        disableHostCheck: true,
        host: '0.0.0.0',
        port: 9000,
        proxy: {
            "/api": {
                target: "http://backend-gh-app.herokuapp.com/",
                //target: "http://localhost:3000",
                changeOrigin: true,
                ws: true
            }
        },
        watchOptions: {
            ignored: /node_modules/
        }
    },
    entry: {
        polyfills: './src/main/webapp/app/polyfills',
        global: './src/main/webapp/content/css/global.css',
        main: './src/main/webapp/app/app.main'
    },
    output: {
        path: utils.root('target/www'),
        filename: 'app/[name].bundle.js',
        publicPath: './'
    },
    module: {
        rules: [{
            test: /\.ts$/,
            enforce: 'pre',
            loaders: 'tslint-loader',
            exclude: ['node_modules', new RegExp('reflect-metadata\\' + path.sep + 'Reflect\\.ts')]
        },
        {
            test: /\.css$/,
            loaders: ['to-string-loader', 'css-loader'],
            exclude: /(vendor\.css|global\.css)/
        },
        {
            test: /(vendor\.css|global\.css)/,
            loaders: ['style-loader', 'css-loader']
        }]
    },
    plugins: [
        new webpack.NoEmitOnErrorsPlugin(),
        new webpack.NamedModulesPlugin(),
        new writeFilePlugin(),
        new webpack.WatchIgnorePlugin([
            utils.root('src/test'),
        ])
    ]
});
