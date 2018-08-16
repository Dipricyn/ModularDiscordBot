
/**
 * The command class encapsulates a command stored in a plugin's commandContainer.
 */
class Command {
    /**
     * Handler to be executed when a command is recognized.
     * @callback Command#commandHandler
     * @param {String[]} args additional parameters for the command
     * @param {Message} message the message that was received
     */

    /**
     * @typedef {Object} Command~options
     * @property {('direct'|'guild')} options.requireChannelType requires the message to be sent either 
     * as a direct message or in a guild channel
     * @property {Boolean} options.handleBotMsgs true if the handler should trigger on bot messages
     * @property {Boolean} options.elevated true if the command requires adminstrator privileges
     */

    constructor() {
        /**
         * The identifier that triggers the command.
         * @type {String}
         */
        this.identifier = null
        /**
         * The handler to be executed when the command is recognized.
         * @type {Command#commandHandler}
         */
        this.handler = null
        /**
         * Additional options controlling when the handler is triggered.
         * @type {Command#options}
         */
        this.options = {
            requireChannelType: null,
            handleBotMsgs: false,
            elevated: false
        }
    }

    /**
     * Set the identifier for this command.
     * The handler function will be triggered by a message beginning with 
     * the command prefix and the identifier: `${prefix}${identifier}`
     * @param {String} identifier 
     */
    setIdentifier(identifier) {
        this.identifier = identifier
        return this
    }

    /**
     * Set the handler to be invoked when the command is recognized.
     * @param {Command#commandHandler} handler the handler to be invoked
     */
    setHandler(handler) {
        this.handler = handler
        return this
    }

    /**
     * Set additional options controlling when the handler is triggered.
     * @param {Command#options} options options to filter invocation of the handler
     */
    setOptions(options) {
        if(!options) return
        if(options.requireChannelType != null) {
            this.options.requireChannelType = options.requireChannelType
        }
        if(options.handleBotMsgs != null) {
            this.options.handleBotMsgs = options.handleBotMsgs
        }
        if(options.elevated != null) {
            this.options.elevated = options.elevated
        }
        return this
    }
}
module.exports = Command