const util = require('util');
const Discord = require('discord.js');
const logger = require('./logger.js');
const auth = require('./../auth.json');
const PluginContainer = require('./plugincontainer.js');
const TimeTrackingPlugin = require('./plugins/timeTracking/timetrackingplugin.js');
const CommandHidingPlugin = require('./plugins/commandHiding/commandhidingplugin.js');
const SoundboardPlugin = require('./plugins/soundboard/soundboardplugin.js');
const NoticeMePlugin = require('./plugins/soundboard/noticeMePlugin/noticemeplugin.js');
const PluginManagementPlugin = require('./plugins/pluginManagement/pluginmanagementplugin.js');
const MusicQueuePlugin = require('./plugins/musicQueue/musicqueueplugin.js');

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

        const timeTrackingPlugin = new TimeTrackingPlugin()
        const commandHidingPlugin = new CommandHidingPlugin()
        const soundboardPlugin = new SoundboardPlugin()
        const noticeMePlugin = new NoticeMePlugin(soundboardPlugin)
        const pluginManagementPlugin = new PluginManagementPlugin(this)
        const musicQueuePlugin = new MusicQueuePlugin()

        this.pluginContainer = new PluginContainer("./data/pluginstates.json")
        this.pluginContainer.add(timeTrackingPlugin)
        this.pluginContainer.add(commandHidingPlugin)
        this.pluginContainer.add(soundboardPlugin)
        this.pluginContainer.add(noticeMePlugin)
        this.pluginContainer.add(pluginManagementPlugin)
        this.pluginContainer.add(musicQueuePlugin)

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
        this.client = new Discord.Client()
        this.pluginContainer.client = this.client
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
        if(this.client.guilds.size !== 1){
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