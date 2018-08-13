const util = require('util');
const Discord = require('discord.js');
const logger = require('./logger.js');
const auth = require('./auth.json');
const PluginContainer = require('./plugincontainer.js');
const TimeTrackingPlugin = require('./plugins/timeTracking/timetrackingplugin.js');
const CommandHidingPlugin = require('./plugins/commandHiding/commandhidingplugin.js');
const SoundboardPlugin = require('./plugins/soundboard/soundboardplugin.js');
const NoticeMePlugin = require('./plugins/soundboard/noticeMePlugin/noticemeplugin.js');
const PluginManagementPlugin = require('./plugins/pluginManagement/pluginmanagementplugin.js');


module.exports = class ModularDiscordBot {

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

        const timeTrackingPlugin = new TimeTrackingPlugin()
        const commandHidingPlugin = new CommandHidingPlugin()
        const soundboardPlugin = new SoundboardPlugin()
        const noticeMePlugin = new NoticeMePlugin(soundboardPlugin)
        const pluginManagementPlugin = new PluginManagementPlugin(this)

        this.pluginContainer = new PluginContainer()
        this.pluginContainer.add(timeTrackingPlugin)
        this.pluginContainer.add(commandHidingPlugin)
        this.pluginContainer.add(soundboardPlugin)
        this.pluginContainer.add(noticeMePlugin)
        this.pluginContainer.add(pluginManagementPlugin)

        process.on('unhandledRejection', err => {
            logger.error(`unhandled rejection: ${err.stack}`);
        })
        
        process.on('uncaughtException', err => {
            logger.error(`uncaught exception: ${err.stack}`);
        })
        
        process.on('exit', this.handleExit)
        process.on('SIGINT', this.handleTermination)
        process.on('SIGUSR1', this.handleTermination)
        process.on('SIGUSR2', this.handleTermination)
        process.on('SIGTERM', this.handleTermination)

        this.login()
    }

    login() {
        logger.info("logging in...")
        this.client = null
        this.client = new Discord.Client()
        this.client.login(auth.token).catch(()=>{})
        this.addEventHandlers()    
    }

    addEventHandlers() {
        this.client.on('error', this.handleClientError)
        this.client.on('warn', info => logger.warn(info))
        this.client.on('disconnect', this.handleDisconnect)
        this.client.on('reconnecting', () => logger.info('bot reconnecting...'))
        this.client.on('resume', this.handleResume)
        this.client.on('ready', this.handleReady)
    }

    startPlugins() {
        for(const [identifier, plugin] of this.pluginContainer) {
            if(!plugin.running) {
                plugin._startPluginImpl(this.client)
            }
        }
    }

    stopPlugins() {
        for(const [identifier, plugin] of this.pluginContainer) {
            if(plugin.running) {
                plugin._stopPluginImpl(this.client)
            }
        }
    }

    startPlugin(identifier) {
        if(!this.pluginContainer.has(identifier)) {
            return {success: false, msg: `Can't start: there is no plugin called '${identifier}'!`}
        }
        const plugin = this.pluginContainer.get(identifier)
        if(!plugin.running) {
            plugin._startPluginImpl(this.client)
            return {success: true}
        } else {
            return {success: false, msg: "Can't start: plugin is already running!"}
        }
    }

    stopPlugin(identifier) {
        if(!this.pluginContainer.has(identifier)) {
            return {success: false, msg: `Can't stop plugin: there is no plugin called '${identifier}'!`}
        }
        const plugin = this.pluginContainer.get(identifier)
        if(plugin.running) {
            plugin._stopPluginImpl(this.client)
            return {success: true}
        } else {
            return {success: false, msg: "Can't stop plugin: plugin is not running!"}
        }
    }
    
    scheduleManualReconnect() {
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
        this.client && this.client.destroy()
        this.client = null
        logger.warn(`websocket disconnected: ${util.inspect(errEvent.error)}`) 
        if(!this.reconnectTimerRunning && this.disconnected) {
            this.scheduleManualReconnect()
        }
    }

    handleClientError(errEvent) {
        this.stopPlugins()
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
        if(this.client.guilds.size !== 1){
            logger.error("Bot has to be in exactly one guild!")
            process.exit(-1)
            return
        }
        this.startPlugins()
    }

    handleResume() {
        this.suppressReconnectMessages = false
        this.disconnected = false
        logger.info("websocket has resumed")
        this.startPlugins()
    }

    handleExit() {
        logger.info("process exit")
        this.stopPlugins()
    }

    handleTermination() {
        process.exit(-1)
    }
}