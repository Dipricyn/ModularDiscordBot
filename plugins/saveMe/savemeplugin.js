const Plugin = require('./../../plugin.js');

module.exports = class SaveMePlugin extends Plugin {

    constructor() {
        super("saveme")
        this.handleMessage = this.handleMessage.bind(this)
        this.handlePresenceUpdate = this.handlePresenceUpdate.bind(this)
        this.handleGlobalError = this.handleGlobalError.bind(this)
    }

    startPlugin(client) {
        this.client = client
        this.addEventHandlers(client)
    }

    stopPlugin(client) {
        this.removeEventHandlers(this.client)
        this.client = null
    }

    handleMessage(message) {
        if (message.content.substring(0, 1) == '!') {
            const cmd = message.content.substring(1).split(' ')[0]
            switch (cmd) {
            case 'times': // !times
                break;
            }
        }
    }

    handleGlobalError() {
    }

    addEventHandlers(client) {
        client.on('message', this.handleMessage)
        client.on('presenceUpdate', this.handlePresenceUpdate)
        process.on('uncaughtException', this.handleGlobalError)
        process.on('unhandledRejection', this.handleGlobalError)
    }

    removeEventHandlers(client) {
        client.removeListener('message', this.handleMessage)
        client.removeListener('presenceUpdate', this.handlePresenceUpdate)
        process.removeListener('uncaughtException', this.handleGlobalError)
        process.removeListener('unhandledRejection', this.handleGlobalError)
    }
}