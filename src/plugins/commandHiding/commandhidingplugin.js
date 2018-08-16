const Plugin = require('./../../plugin.js');

/**
 * CommandHidingPlugin deletes commands automatically after they were sent.
 * Direct messages can't be deleted.
 * The config file has to be in the form:
 * @example
 * {
 *     "delay": 0 //delay in ms until the message is deleted
 * }
 */
class CommandHidingPlugin extends Plugin {

    constructor() {
        super("commandhiding")
        this.handleMessage = this.handleMessage.bind(this)
    }

    startPlugin() {
        this.addEventHandlers(this.client)
    }

    stopPlugin() {
        this.timer && clearTimeout(this.timer)
        this.timer = null
        this.removeEventHandlers(this.client)
    }

    handleMessage(message) {
        if(message.author.bot) return
        if (message.content.substring(0, 1) == '!') {
            if(message.deletable){
                if(this.config.delay > 0) {
                    this.timer = setTimeout(()=> message.delete(), this.config.delay)
                } else if(this.config.delay === 0) {
                    message.delete()
                }
            }
        }
    }

    defaultConfig() {
        return {
            delay: 0
        }
    }

    addEventHandlers(client) {
        client.on('message', this.handleMessage)
    }

    removeEventHandlers(client) {
        client.removeListener('message', this.handleMessage)
    }
}
module.exports = CommandHidingPlugin