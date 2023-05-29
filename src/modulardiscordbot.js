const util = require('util');
const { Client, Discord, IntentsBitField, Event, Partials } = require('discord.js');
const logger = require('./logger.js');
const auth = require('./../auth.json');
const PluginContainer = require('./plugincontainer.js');
const CommandHidingPlugin = require('./plugins/commandHiding/commandhidingplugin.js');
const PluginManagementPlugin = require('./plugins/pluginManagement/pluginmanagementplugin.js');
const QuizPlugin = require('./plugins/quiz/quizplugin.js');

class ModularDiscordBot {

    constructor() {
        this.suppressReconnectMessages = false
        this.reconnectTimerRunning = false
        this.disconnected = true

        this.handleExit = this.handleExit.bind(this)
        this.handleTermination = this.handleTermination.bind(this)
        this.handleClientError = this.handleClientError.bind(this)
        this.handleDisconnect = this.handleDisconnect.bind(this)
        this.handleReady = this.handleReady.bind(this)
        this.handleResume = this.handleResume.bind(this)

        const quizPlugin = new QuizPlugin()
        const commandHidingPlugin = new CommandHidingPlugin()
        const pluginManagementPlugin = new PluginManagementPlugin(this)

        this.pluginContainer = new PluginContainer("./data/pluginstates.json")
        this.pluginContainer.add(quizPlugin)
        this.pluginContainer.add(commandHidingPlugin)
        this.pluginContainer.add(pluginManagementPlugin)

        process.on('unhandledRejection', err => {
            logger.error(`unhandled rejection: ${err.stack}`);
        })
        
        process.on('uncaughtException', err => {
            logger.error(`uncaught exception: ${err.stack}`);
        })
        
        process.on('exit', this.handleExit)
        process.on('SIGINT', this.handleTermination)
        process.on('SIGTERM', this.handleTermination)

        this.login()
    }

    login() {
        logger.info("logging in...")
        this.client = null
		
		const myIntents = new IntentsBitField()
		myIntents.add([IntentsBitField.Flags.DirectMessageTyping,
			IntentsBitField.Flags.DirectMessages,
			IntentsBitField.Flags.GuildMessages,
			IntentsBitField.Flags.Guilds,
			IntentsBitField.Flags.MessageContent])
			
		const myPartials = [Partials.Channel,
			Partials.Message
		]

        this.client = new Client({ intents: myIntents, partials: myPartials })
        this.pluginContainer.client = this.client
        this.addEventHandlers()
        this.client.login(auth.token).catch(error => logger.info(`error logging in: ${error}`))
    }

    addEventHandlers() {
        this.client.on(Client.Error, this.handleClientError)
        this.client.on(Client.Warn, info => logger.warn(info))
        this.client.on('messageCreate', info => logger.warn(info))
        this.client.on('disconnect', this.handleDisconnect)
        this.client.on('reconnecting', () => logger.info('bot reconnecting...'))
        this.client.on('resume', this.handleResume)
        this.client.on('ready', this.handleReady)
    }
    
    scheduleManualReconnect() {
        this.pluginContainer.client = null
        this.client && this.client.destroy()
        this.client = null
        logger.info('fallback reconnect timer started')
        setTimeout(()=>{
            this.reconnectTimerRunning = false
            login()
        }, 30000)
        this.reconnectTimerRunning = true
    }

    handleDisconnect(errEvent) {
        this.disconnected = true
        this.pluginContainer.client = null
        this.client && this.client.destroy()
        this.client = null
        logger.warn(`websocket disconnected: ${util.inspect(errEvent.error)}`) 
        if(!this.reconnectTimerRunning && this.disconnected) {
            this.scheduleManualReconnect()
        }
    }

    handleClientError(errEvent) {
        this.pluginContainer.stopPlugins()
        switch(errEvent.error.code){
        case 'ECONNRESET':
        case 'ENOTFOUND':
            if(this.suppressReconnectMessages === false) {
                this.suppressReconnectMessages = true
                logger.warn(`client lost connection: ${util.inspect(errEvent.error)}`) 
            }
            if(!this.reconnectTimerRunning && this.disconnected) {
                this.scheduleManualReconnect()
            }
            break
        default:
            logger.error(`client error: ${util.inspect(errEvent.error)}`) 
        } 
    }

    handleReady() {
        this.suppressReconnectMessages = false
        this.disconnected = false
        logger.info("bot is ready")
        if(this.client.guilds.cache.size !== 1){
            logger.error("Bot has to be in exactly one guild!")
            process.exit(-1)
            return
        }
        this.pluginContainer.startPlugins()
    }

    handleResume() {
        this.suppressReconnectMessages = false
        this.disconnected = false
        logger.info("websocket has resumed")
        this.pluginContainer.startPlugins(this.client)
    }

    handleExit() {
        logger.info("process exit")
        this.pluginContainer.stopPlugins()
    }

    handleTermination() {
        process.exit(-1)
    }
}
module.exports = ModularDiscordBot