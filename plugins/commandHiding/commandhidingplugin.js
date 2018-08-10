const logger = require('./../../logger.js');
const Plugin = require('./../../plugin.js');

module.exports = class CommandHidingPlugin extends Plugin {

    constructor() {
        super("commandhiding")
        this.handleMessage = this.handleMessage.bind(this)
    }

    startPlugin(client) {
        this.addEventHandlers(client)
    }

    stopPlugin(client) {
        this.timer && clearTimeout(this.timer)
        this.timer = null
        this.removeEventHandlers(client)
    }

    handleMessage(message) {
        if (message.content.substring(0, 1) == '!') {
            if(message.deletable){
                if(this.config.delay > 0) {
                    this.timer = setTimeout(()=>{
                            message.delete()
                    }, this.config.delay)
                } else {
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