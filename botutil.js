const fs = require('fs');
const logger = require('./logger');

/**
 * Load a JSON object from a file if the file exists.
 * Does nothing if the file doesn't exist.
 * @param {string} path the path of the file to load
 */
module.exports.loadJSONSyncIfExists = function(path) {
    try {
        return JSON.parse(fs.readFileSync(path))
    } catch(err) {
        if(err.code !== "ENOENT") {
            logger.error(`error reading JSON from ${path}: ${err}`)
        }
    }
}

/**
 * Write an object in JSON format to a file if the file doesn't exist.
 * Does nothing if the file exists.
 * @param {string} path the path of the file to write to
 * @param {object} object the object that will be written to the file
 */
module.exports.writeJSONObjectSyncIfNotExists = function(path, object) {
    try {
        fs.writeFileSync(path, JSON.stringify(object), { flag: 'wx' })
    } catch(err) {
        if(err.code !== "EEXIST") {
            logger.error(`error writing JSON object to ${path}: ${err}`)
        }
    }
}