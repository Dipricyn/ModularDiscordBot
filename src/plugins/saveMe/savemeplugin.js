const Plugin = require('./../../plugin.js');

class SaveMePlugin extends Plugin {

    constructor() {
        super("saveme")
        this.handlePresenceUpdate = this.handlePresenceUpdate.bind(this)
        this.handleGlobalError = this.handleGlobalError.bind(this)
    }

    startPlugin() {
        this.addEventHandlers(client)
    }

    stopPlugin() {
        this.removeEventHandlers(this.client)
    }

    handleGlobalError() {
    }

    addEventHandlers(client) {
        client.on('presenceUpdate', this.handlePresenceUpdate)
        process.on('uncaughtException', this.handleGlobalError)
        process.on('unhandledRejection', this.handleGlobalError)
    }

    removeEventHandlers(client) {
        client.removeListener('presenceUpdate', this.handlePresenceUpdate)
        process.removeListener('uncaughtException', this.handleGlobalError)
        process.removeListener('unhandledRejection', this.handleGlobalError)
    }
}
module.exports = SaveMePlugin
