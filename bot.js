#!/usr/bin/env node --harmony
const util = require('util');
const Discord = require('discord.js');
const logger = require('./logger.js');
const auth = require('./auth.json');
const TimeTrackingPlugin = require('./plugins/timeTracking/timetrackingplugin.js');
const CommandHidingPlugin = require('./plugins/commandHiding/commandhidingplugin.js');
const SoundboardPlugin = require('./plugins/soundboard/soundboardplugin.js');

var client
var plugins = [
    new TimeTrackingPlugin(),
    new CommandHidingPlugin(),
    new SoundboardPlugin()
]
let suppressReconnectMessages = false
let reconnectTimerRunning = false
let pluginsRunning = false
let disconnected = true

function login() {
    logger.info("logging in...")
    client = null
    client = new Discord.Client()
    client.login(auth.token).catch(()=>{})
    addEventHandlers()    
}

function addEventHandlers() {
    client.on('error', handleClientError)
    client.on('warn', info => logger.warn(info))
    client.on('disconnect', handleDisconnect)
    client.on('reconnecting', () => logger.info('bot reconnecting...'))
    client.on('resume', ()=>{
        suppressReconnectMessages = false
        disconnected = false
        logger.info("websocket has resumed")
        startPlugins()
    })
    client.on('ready', () => {
        suppressReconnectMessages = false
        disconnected = false
        logger.info("bot is ready")
        startPlugins()
    })
}

function startPlugins() {
    if(!pluginsRunning) {
        for(let plugin of plugins) {
            plugin._startPluginImpl(client)
        }
        pluginsRunning = true
    }
}

function stopPlugins() {
    if(pluginsRunning) {
        for(let plugin of plugins) {
            plugin._stopPluginImpl(client)
        }
        pluginsRunning = false
    }
}

function handleDisconnect(errEvent) {
    disconnected = true
    client && client.destroy()
    client = null
    logger.warn(`websocket disconnected: ${util.inspect(errEvent.error)}`) 
    if(!reconnectTimerRunning && disconnected) {
        scheduleManualReconnect()
    }
}

function scheduleManualReconnect() {
    client && client.destroy()
    client = null
    logger.info('fallback reconnect timer started')
    setTimeout(()=>{
        reconnectTimerRunning = false
        login()
    }, 30000)
    reconnectTimerRunning = true
}

function handleClientError(errEvent) {
    stopPlugins()
    switch(errEvent.error.code){
    case 'ECONNRESET':
    case 'ENOTFOUND':
        if(suppressReconnectMessages === false) {
            suppressReconnectMessages = true
            logger.warn(`client lost connection: ${util.inspect(errEvent.error)}`) 
        }
        if(!reconnectTimerRunning && disconnected) {
            scheduleManualReconnect()
        }
        break
    default:
        logger.error(`client error: ${util.inspect(errEvent.error)}`) 
    } 
}

function handleExit() {
    logger.info("process exit")
    stopPlugins()
}

function handleTermination() {
    process.exit(-1)
}

process.on('unhandledRejection', err => {
    logger.error(`unhandled rejection: ${err.stack}`);
})

process.on('uncaughtException', err => {
    logger.error(`uncaught exception: ${err.stack}`);
})

process.on('exit', handleExit)
process.on('SIGINT', handleTermination)
process.on('SIGUSR1', handleTermination)
process.on('SIGUSR2', handleTermination)
process.on('SIGTERM', handleTermination)

login()
