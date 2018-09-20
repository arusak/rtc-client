const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WriteFilePlugin = require('write-file-webpack-plugin');
const root = process.cwd();

const dir = {
    src: path.join(root, 'src'),
    build: path.join(root, 'build'),
    lib: path.join(root, 'node_modules'),
};

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
        hot: false,
        inline: true,
        // полный путь к статике
        contentBase: dir.build,
        // полный урл нужен для работы HMR
        publicPath: 'http://localhost:3000/',
        historyApiFallback: true,
        stats: 'normal',
        port: 3000,
        host: 'localhost',
        overlay: true,
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                secure: false,
                logLevel: 'debug',
                onError: (err, req, res, url) => {
                    console.log(err);
                }
            }
        },
        watchOptions: {
            aggregateTimeout: 300,
            poll: 1000
        }
    }

};