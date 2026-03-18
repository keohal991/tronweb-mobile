const path = require('path');
const webpack = require('webpack');
const package = require('./package.json')
const TerserPlugin = require("terser-webpack-plugin");

const basePlugins = [
    '@babel/plugin-transform-runtime',
    '@babel/plugin-transform-optional-chaining',
    ['@babel/plugin-transform-class-properties', { loose: true }],
    ['@babel/plugin-transform-template-literals', { loose: true }],
    ['@babel/plugin-transform-private-methods', { loose: true }],
    ['@babel/plugin-transform-private-property-in-object', { loose: true }],
];

const mode = process.env.NODE_ENV || 'production'

const baseConfig = {
    entry: path.resolve(__dirname, 'src', 'index.js'),
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            ['@babel/preset-env', {
                                targets: {
                                    // browsers: [
                                    //     '>0.25%',
                                    //     'not dead'
                                    // ]
                                }
                            }]
                        ],
                        plugins: basePlugins
                    }
                }
            }
        ]
    },
    resolve: {
        modules: [
            'node_modules',
            path.resolve(__dirname, 'src')
        ],
    },
    // devtool: 'source-map',
    mode
};

nodePlugins = [
    ...basePlugins
]

if (mode === 'development') {
    nodePlugins.push('source-map-support')
}

module.exports = [
    {
        ...baseConfig,
        output: {
            path: path.resolve(__dirname, 'build'),
            filename: `tronweb-mobile-${package.version}.js`,
            library: 'tronweb-mobile',
            libraryTarget: 'umd',
            libraryExport: 'default',
            umdNamedDefine: true
        },
        plugins: [
            new webpack.BannerPlugin(`version:${package.version}`),
            new webpack.ProvidePlugin({
                Buffer: ['buffer', 'Buffer'],
            }),
        ],
        optimization: {
            minimize: true,
            minimizer: [
                new TerserPlugin({
                    extractComments: false,
                }),
            ],
        },
        resolve: {
            fallback: {
                buffer: require.resolve('buffer/'),
                crypto: require.resolve('crypto-browserify'),
            },
        },
 
    }
];
