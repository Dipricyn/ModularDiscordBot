const mkdirp = require('mkdirp');
const path = require('path');
const botutil = require('./botutil.js');

/**
 * The base class to be extended by all bot plugins.
 */
module.exports = class Plugin {

    /**
     * The identifier is used to identify plugin and to 
     * provide a location to store permanent data.
     * @param {string} identifier the plugins unique identifier
     */
    constructor(identifier) {
        if(!identifier) throw Error("plugin identifier cannot be empty!")
        this.identifier = identifier
    }

    /**
     * Called when the plugin should be started.
     * The client property is available when this method is called.
     * @param {Client} client the discord client to be used by the plugin
     */
    startPlugin(client) {
        throw new Error("implement the startPlugin() method!")
    }

    /**
     * Called when the plugin should be stopped.
     * The plugin must release the client instance.
     * @param {Client} client the discord client to unsubscribe from
     */
    stopPlugin(client) {}

    /**
     * Get the configuration file path for this plugin.
     * @returns {string} a relative path to the configuration file
     */
    configFileLocation() {
        const configLocation = `./config/${this.identifier}_config.json`
        mkdirp.sync(path.dirname(configLocation))
        return configLocation
    }

    /**
     * Get the data directory for this plugin.
     * @returns {string} a relative path without a trailing slash
     */
    dataDirLocation() {
        const dataLocation = `./data/${this.identifier}`
        return dataLocation
    }

    /**
     * Called to specify the default configuration parameters.
     * The config object will not be loaded from the file if the default config returns null.
     * @returns {object} a object containing the default configuration parameters or 
     *          null if a config file is not needed
     */
    defaultConfig() {
        return null
    }

    _startPluginImpl(client) {
        mkdirp.sync(this.dataDirLocation())
        const config = this.defaultConfig()
        if(config) {
            botutil.writeJSONObjectSyncIfNotExists(this.configFileLocation(), config)
            this.config = botutil.loadJSONSyncIfExists(this.configFileLocation())
        }
        this.startPlugin(client)
    }

    _stopPluginImpl(client) {
        this.stopPlugin(client)
    }
}