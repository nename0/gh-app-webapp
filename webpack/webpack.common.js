const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MergeJsonWebpackPlugin = require("merge-jsons-webpack-plugin");

const WebpackPwaManifest = require('webpack-pwa-manifest');
const ServiceWorkerWebpackPlugin = require('serviceworker-webpack-plugin');

const rxPaths = require('rxjs/_esm5/path-mapping')();
rxPaths["rxjs"] = "Error: should not use import 'rxjs'";

const utils = require('./utils.js');

module.exports = (options) => {
    const DATAS = {
        VERSION: `'${utils.parseVersion()}'`,
        DEBUG_INFO_ENABLED: options.env === 'development'
    };
    return {
        resolve: {
            extensions: ['.ts', '.js'],
            modules: ['node_modules'],
            alias: rxPaths // for rxjs https://github.com/ReactiveX/rxjs/blob/c9f69ad795b0d93a2f32bc41b259125c004ba5a4/doc/lettable-operators.md
        },
        stats: {
            children: false
        },
        module: {
            rules: [
                { test: /bootstrap\/dist\/js\/umd\//, loader: 'imports-loader?jQuery=jquery' },
                {
                    test: /\.html$/,
                    loader: 'html-loader',
                    options: {
                        minimize: true,
                        caseSensitive: true,
                        removeAttributeQuotes: false,
                        minifyJS: false,
                        minifyCSS: false
                    },
                    exclude: ['./src/main/webapp/index.html']
                },
                {
                    test: /\.(jpe?g|png|gif|svg|woff2?|ttf|eot)$/i,
                    loader: 'file-loader',
                    options: {
                        hash: 'sha512',
                        digest: 'hex',
                        name: 'content/[hash].[ext]',
                        publicPath: '../'
                    }
                }
            ]
        },
        plugins: [
            new webpack.DefinePlugin({
                'process.env': {
                    NODE_ENV: `'${options.env}'`,
                    VERSION: `'${utils.parseVersion()}'`,
                    DEBUG_INFO_ENABLED: options.env === 'development'
                }
            }),
            new webpack.optimize.CommonsChunkPlugin({
                name: 'polyfills',
                chunks: ['polyfills']
            }),
            new webpack.optimize.CommonsChunkPlugin({
                name: 'vendor',
                chunks: ['main'],
                minChunks: module =>
                    utils.isExternalLib(module) || (module.resource && (/vendor\.css$/).test(module.resource))
            }),
            new webpack.optimize.CommonsChunkPlugin({
                name: ['polyfills', 'vendor'].reverse()
            }),
            new webpack.optimize.CommonsChunkPlugin({
                name: ['manifest'],
                minChunks: Infinity
            }),    
            /**
             * See: https://github.com/angular/angular/issues/11580
             */
            new webpack.ContextReplacementPlugin(
                /(.+)?angular(\\|\/)core(.+)?/,
                utils.root('src/main/webapp/app'), {}
            ),
            new CopyWebpackPlugin([
                { from: './src/main/webapp/favicon.ico', to: 'favicon.ico' },
                // { from: './src/main/webapp/sw.js', to: 'sw.js' },
                { from: './src/main/webapp/robots.txt', to: 'robots.txt' }
            ]),
            new HtmlWebpackPlugin({
                template: './src/main/webapp/index.html',
                chunksSortMode: 'dependency',
                inject: 'body'
            }),
            new WebpackPwaManifest({
                "name": "Musiccloud Webapp",
                "short_name": "Musiccloud",
                "icons": [
                    {
                        src: utils.root('src/main/webapp/content/images/android-icon-192x192.png'),
                        sizes: [36, 72, 96, 192],
                        "type": "image/png",
                        destination: 'content/',
                    }
                ],
                "theme_color": "#303F9F",
                "background_color": "#FFFFFF",
                "start_url": "/",
                "display": "standalone",
                "orientation": "any"
            }),
            new ServiceWorkerWebpackPlugin({
                entry: utils.root('src/main/webapp/app/swImpl.ts'),
                chunksFilename: 'app/[chunkhash].sw.js',
                transformOptions: serviceWorkerOption => {
                    serviceWorkerOption.assets.push('/'); // index.html
                    return {
                        assets: serviceWorkerOption.assets,
                        assetsHash: serviceWorkerOption.assetsHash
                    };
                },
                includes: ["content/*.png",
                    "content/*.woff2",
                    "app/**",
                    "manifest.*.json"
                ],
                excludes: [ "app/*.sw.js"]
            }),
        ]
    };
};
