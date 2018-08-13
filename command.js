
module.exports = class Command {

    constructor() {
        this.options = {
            requireDM: false,
            handleBotMsgs: false,
            elevated: false
        }
    }

    setIdentifier(identifier) {
        this.identifier = identifier
        return this
    }

    setHandler(handler) {
        this.handler = handler
        return this
    }

    setOptions(options) {
        if(!options) return
        if(options.requireDM != null) {
            this.options.requireDM = options.requireDM
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