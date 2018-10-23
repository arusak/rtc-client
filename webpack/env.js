const utils = require('./utils');

const ssl = !!process.env.KEYSTORE && !!process.env.KEYSTORE_PASSWORD;
const hostname = process.env.HOSTNAME || 'localhost';
const apiHostname = process.env.API_HOSTNAME || hostname;
const apiPort = process.env.API_PORT || (ssl ? '8443' : '8080');

module.exports = {
    hostname,
    port: process.env.PORT || 3000,
    keystore: utils.readKeystore(process.env.KEYSTORE),
    keystorePass: process.env.KEYSTORE_PASSWORD,
    ssl,
    apiPort,
    apiHostname,
};