const fs = require('fs');

let cache;

module.exports = {
    readKeystore: function readKeystore(filename) {
        if (!process.env.KEYSTORE) return;

        if (!cache) {
            try {
                cache = fs.readFileSync(filename)
            } catch (e) {
                console.error('Не удалось прочитать хранилище ключей');
            }
        }
        return cache.keystore;
    }
};