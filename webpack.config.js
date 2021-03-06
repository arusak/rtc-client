const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WriteFilePlugin = require('write-file-webpack-plugin');
const env = require('./webpack/env');
const dir = require('./webpack/dir');


module.exports = {
    mode: 'development',
    entry: {
        patient: dir.src + '/patient/patient.boot.ts',
        doctor: dir.src + '/doctor/doctor.boot.ts',
    },
    output: {
        path: dir.build,
        filename: '[name].js',
        chunkFilename: '[id].chunk.js'
    },
    resolve: {
        extensions: ['.ts', '.js'],
        // пути для поиска модулей
        modules: [dir.lib],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'awesome-typescript-loader'
            },
            {
                test: /\.less$/,
                use: ['style-loader', 'css-loader', 'less-loader']
            }
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            chunks: ['patient'],
            excludeChunks: ['doctor'],
            template: path.join(dir.src, 'index.html'),
            filename: 'patient.html',
        }),
        new HtmlWebpackPlugin({
            chunks: ['doctor'],
            excludeChunks: ['patient'],
            template: path.join(dir.src, 'index.html'),
            filename: 'doctor.html',
        }),
        new WriteFilePlugin(),

    ],
    devServer: {
        before(app) {
            // по умолчанию открываем пациентское
            app.get('/', function (req, res) {
                res.redirect(301, '/patient.html');
            });
            // по умолчанию открываем пациентское
            app.get('/p', function (req, res) {
                res.redirect(301, '/patient.html');
            });
            // по умолчанию открываем пациентское
            app.get('/d', function (req, res) {
                res.redirect(301, '/doctor.html');
            });
        },
        hot: false,
        inline: true,
        // полный путь к статике
        contentBase: dir.build,
        // полный урл нужен для работы HMR
        publicPath: `${env.ssl ? 'https' : 'http'}://${env.hostname}:${env.port}`,
        historyApiFallback: true,
        stats: 'normal',
        port: env.port,
        host: env.hostname,
        overlay: true,
        https: env.ssl ? {
            pfx: env.keystore,
            passphrase: env.keystorePass,
        } : false,
        proxy: {
            '/api': {
                target: `${env.ssl ? 'https' : 'http'}://${env.apiHostname}:${env.apiPort}`,
                changeOrigin: true,
                secure: false,
                logLevel: 'debug',
            },
            '/ws': {
                target: `${env.ssl ? 'wss' : 'ws'}://${env.apiHostname}:${env.apiPort}`,
                changeOrigin: true,
                secure: false,
                ws: true,
            }
        },
        watchOptions: {
            aggregateTimeout: 300,
            poll: 1000
        }
    }

};