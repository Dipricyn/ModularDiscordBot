const mkdirp = require('mkdirp');
const path = require('path');
const botutil = require('./botutil.js');
const CommandContainer = require('./commandcontainer.js')

/**
 * The base class to be extended by all bot plugins.
 * It provides methods to facilitate the implementation of a plugin.
 */
class Plugin {

    /**
     * The identifier is used to identify plugin and to 
     * provide a location to store permanent data.
     * @param {String} identifier the plugins unique identifier
     */
    constructor(identifier) {
        if(!identifier) throw Error("plugin identifier cannot be empty!")
        this._handleCommandImpl = this._handleCommandImpl.bind(this)
        /**
         * The plugin's unique identifier.
         * @type {String}
         */
        this.identifier = identifier
        /**
         * True if the plugin is running.
         * @readonly
         * @type {Boolean}
         */
        this.running = false
        /**
         * A map that stores the commands for this plugin.
         * @type {CommandContainer}
         */
        this.commandContainer = new CommandContainer()
    }

    /**
     * Called when the plugin should be started.
     * The client property is available when this method is called.
     */
    startPlugin() {}

    /**
     * Called when the plugin should be stopped.
     * The plugin must release the client instance.
     */
    stopPlugin() {}

    /**
     * Get the configuration file path for this plugin.
     * @returns {String} a relative path to the configuration file
     */
    configFileLocation() {
        const configLocation = `./config/${this.identifier}_config.json`
        mkdirp.sync(path.dirname(configLocation))
        return configLocation
    }

    /**
     * Get the data directory for this plugin.
     * @returns {String} a relative path without a trailing slash
     */
    dataDirLocation() {
        const dataLocation = `./data/${this.identifier}`
        return dataLocation
    }

    /**
     * Called to specify the default configuration parameters.
     * The config object will not be loaded from the file if the default config returns null.
     * @returns {Object} a object containing the default configuration parameters or 
     * null if a config file is not needed
     */
    defaultConfig() {
        return null
    }

    _handleCommandImpl(message) {
        if(message.content.substring(0, 1) !== '!') {
            return
        }
        const args = message.content.substring(1).split(' ')
        const cmd = args.splice(0, 1)[0]
        const command = this.commandContainer.get(cmd)
        if(!command) return
        if(!command.options.handleBotMsgs) {
            if(message.author.bot) return
        }
        if(command.options.requiredChannelType) {
            switch(command.options.requiredChannelType){
                case "direct":
                    if(["dm", "group"].indexOf(message.channel.type)===-1) {
                        message.channel.send("You must send this command in a direct message!")
                        return
                    }
                    break;
                case "guild":
                    if(["text", "voice", "category"].indexOf(message.channel.type)===-1) {
                        message.channel.send("You must send this command in a channel!")
                        return
                    }
                    break;
                default:
                    throw Error(`unknown required channel type: ${command.options.requiredChannelType}!`)
            }
        }
        const guild = this.client.guilds.cache.first()
        if(command.options.elevated) {
            if(!guild.member(message.author).hasPermission("ADMINISTRATOR")) {
                message.channel.send("Insufficient permissions! You need to be an administrator to do that.")
                return
            }
        }
        command.handler(args, message)
    }

    _startPluginImpl(client) {
        this.client = client
        mkdirp.sync(this.dataDirLocation())
        const config = this.defaultConfig()
        if(config) {
            botutil.writeJSONObjectSyncIfNotExists(this.configFileLocation(), config)
            this.config = botutil.loadJSONSyncIfExists(this.configFileLocation())
        }
        this.running = true
        this.client.on('message', this._handleCommandImpl)
        this.startPlugin()
    }

    _stopPluginImpl() {
        this.stopPlugin()
        this.client.removeListener('message', this._handleCommandImpl)
        this.client = null
        this.running = false
    }
}
module.exports = Plugin