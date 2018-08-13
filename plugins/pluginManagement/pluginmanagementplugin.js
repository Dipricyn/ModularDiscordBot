const Plugin = require('./../../plugin.js');
const logger = require('./../../logger.js');
const Command = require('./../../command.js')

module.exports = class PluginManagementPlugin extends Plugin {

    constructor(bot) {
        super("pluginmanagement")
        this.bot = bot
        this.handleStartCommand = this.handleStartCommand.bind(this)
        this.handleStopCommand = this.handleStopCommand.bind(this)
        
        this.commandContainer.add(new Command()
            .setIdentifier("start")
            .setHandler(this.handleStartCommand)
            .setOptions({
                requireDM: true,
                elevated: true
            })
        )

        this.commandContainer.add(new Command()
            .setIdentifier("stop")
            .setHandler(this.handleStopCommand)
            .setOptions({
                requireDM: true,
                elevated: true
            })
        )
    }

    handleStartCommand(args, channel) {
        const res = this.bot.startPlugin(args[0])
        if(res.success) {
            channel.send(`Successfully started plugin '${args[0]}'.`)
        } else {
            channel.send(res.msg)
        }
    }

    handleStopCommand(args, channel) {
        const res = this.bot.stopPlugin(args[0])
        if(res.success) {
            channel.send(`Successfully stopped plugin '${args[0]}'.`)
        } else {
            channel.send(res.msg)
        }
    }
}