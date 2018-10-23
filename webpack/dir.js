const path = require('path');

const root = process.cwd();

module.exports = {
    src: path.join(root, 'src'),
    build: path.join(root, 'build'),
    lib: path.join(root, 'node_modules'),
};