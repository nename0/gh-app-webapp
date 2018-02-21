const webpack = require('webpack');
const webpackMerge = require('webpack-merge');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const Visualizer = require('webpack-visualizer-plugin');
const AngularCompilerPlugin = require('@ngtools/webpack').AngularCompilerPlugin;
const utils = require('./utils.js');
const commonConfig = require('./webpack.common.js');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const AppCachePlugin = require('appcache-webpack-plugin');
const BrotliPlugin = require('brotli-webpack-plugin');

const ENV = 'production';
const extractCSS = new ExtractTextPlugin('app/[sha256:contenthash:hex:20].css');

module.exports = webpackMerge(commonConfig({ env: ENV }), {
    // Enable source maps. Please note that this will slow down the build.
    // You have to enable it in UglifyJSPlugin config below and in tsconfig-aot.json as well
    // devtool: 'source-map',
    entry: {
        polyfills: './src/main/webapp/app/polyfills',
        //global: './src/main/webapp/content/css/global.css',
        main: './src/main/webapp/app/app.main'
    },
    output: {
        path: utils.root('target/www'),
        filename: 'app/[name].[chunkHash].bundle.js',
        publicPath: './'
    },
    recordsPath: utils.root('webpack/records.json'),
    module: {
        rules: [
            {
                test: /(?:\.ngfactory\.js|\.ngstyle\.js|\.ts)$/,
                use: {
                    loader: '@ngtools/webpack',
                    options: {
                        tsConfigPath: utils.root('tsconfig-aot.json'),
                    },
                },
            },
            {
                test: /\.css$/,
                loaders: ['to-string-loader', 'css-loader'],
                exclude: /(vendor\.css|global\.css)/
            },
            {
                test: /(vendor\.css|global\.css)/,
                use: extractCSS.extract({
                    fallback: 'style-loader',
                    use: ['css-loader']
                })
            }]
    },
    plugins: [
        extractCSS,
        new webpack.HashedModuleIdsPlugin(),
        //new webpack.optimize.AggressiveSplittingPlugin({
        //    minSize: 350000,
        //    maxSize: 800000
        //}),
        new Visualizer({
            // Webpack statistics in target folder
            filename: '../stats.html'
        }),
        new UglifyJSPlugin({
            parallel: true,
            uglifyOptions: {
                ecma: 8,
                ie8: false,
                // sourceMap: true, // Enable source maps. Please note that this will slow down the build
                compress: {
                    dead_code: true,
                    warnings: false,
                    properties: true,
                    drop_debugger: true,
                    conditionals: true,
                    booleans: true,
                    loops: true,
                    unused: true,
                    toplevel: true,
                    if_return: true,
                    inline: true,
                    join_vars: true
                },
                output: {
                    comments: false,
                    beautify: false,
                    indent_level: 2
                }
             }
        }),
        new AngularCompilerPlugin({
            tsConfigPath: utils.root('tsconfig-aot.json'),
            mainPath: './src/main/webapp/app/app.main.ts'
        }),
        new webpack.LoaderOptionsPlugin({
            minimize: true,
            debug: false
        }),
        new AppCachePlugin({
            cache: ['./'],
            exclude: [
                /index.html$/,
                /favicon.ico$/,
                /robots.txt$/,
                /sw.js$/,
                /manifest\..+\.json$/,
                /content\/icon_.+\.png$/
            ]
        }),
        new BrotliPlugin({
            asset: '[path].br[query]',
            test: /\.(js|css|html)$/,
            threshold: 10240,
            minRatio: 0.8
        })
    ]
});
