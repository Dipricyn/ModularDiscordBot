const Plugin = require('./../../plugin.js');
const Command = require('./../../command.js');

/**
 * PluginManagementPlugin enables starting and stopping plugins via commands
 * and provides a list of commands of all the plugins.
 */
class PluginManagementPlugin extends Plugin {

    constructor(bot) {
        super("pluginmanagement")
        this.bot = bot
        this.handleStartCommand = this.handleStartCommand.bind(this)
        this.handleStopCommand = this.handleStopCommand.bind(this)
        this.handleCommandsCommand = this.handleCommandsCommand.bind(this)
        this.handlePluginsCommand = this.handlePluginsCommand.bind(this)
        this.commandContainer.add(new Command()
            .setIdentifier("start")
            .setHandler(this.handleStartCommand)
            .setOptions({
                requiredChannelType: "direct",
                elevated: true
            })
        )
        this.commandContainer.add(new Command()
            .setIdentifier("stop")
            .setHandler(this.handleStopCommand)
            .setOptions({
                requiredChannelType: "direct",
                elevated: true
            })
        )
        this.commandContainer.add(new Command()
            .setIdentifier("plugins")
            .setHandler(this.handlePluginsCommand)
            .setOptions({
                requiredChannelType: "direct",
                elevated: true
            })
        )
        this.commandContainer.add(new Command()
            .setIdentifier("commands")
            .setHandler(this.handleCommandsCommand)
        )
    }

    handleStartCommand(args, message) {
        const channel = message.channel
        const res = this.bot.pluginContainer.startPlugin(args[0], true)
        if(res.success) {
            channel.send(`Successfully started plugin '${args[0]}'.`)
        } else {
            channel.send(res.msg)
        }
    }

    handleStopCommand(args, message) {
        const channel = message.channel
        const res = this.bot.pluginContainer.stopPlugin(args[0], true)
        if(res.success) {
            channel.send(`Successfully stopped plugin '${args[0]}'.`)
        } else {
            channel.send(res.msg)
        }
    }

    handleCommandsCommand(args, message) {
        const channel = message.channel
        let commands = []
        for(const plugin of this.bot.pluginContainer.values()) {
            for(const identifier of plugin.commandContainer.keys()) {
                commands.push(identifier)
            }
        }
        commands.sort()
        let commandsStr = "Commands:\n"
        for(const identifier of commands){
            commandsStr += `!${identifier}\n`
        }
        channel.send(commandsStr)
    }

    handlePluginsCommand(args, message) {
        const channel = message.channel
        let pluginsStr = "Plugins states:\n"
        for(const [identifier, plugin] of this.bot.pluginContainer) {
            pluginsStr += `${identifier}:\n\tcurrently running: ${plugin.running}, `
            pluginsStr += `persistently running: ${this.bot.pluginContainer.getPersistentState(identifier)}\n`
        }
        channel.send(pluginsStr)
    }
}
module.exports = PluginManagementPlugin