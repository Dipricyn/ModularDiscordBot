#!/usr/bin/env node --harmony
const util = require('util');
const Discord = require('discord.js');
const logger = require('./logger.js');
const auth = require('./auth.json');
const TimeTrackingPlugin = require('./plugins/timeTracking/timetrackingplugin.js')

var client
var plugins = []

function login() {
    logger.info("logging in...")
    client = null
    client = new Discord.Client()
    client.login(auth.token)
    addEventHandlers()    
}

function addEventHandlers() {
    client.on('error', handleClientError)
    client.on('ready', () => {
        logger.info("bot is ready")
    })
}

function startPlugins() {
    const timeTracking = new TimeTrackingPlugin()
    timeTracking.startPlugin(client)
    plugins.push(timeTracking)
}

function handleClientError(err) {
    switch(err.code){
    case 'ECONNRESET':
        logger.warning("client lost connection") 
        client && client.destroy()
        client = null
        setTimeout(()=>{
            login()
        },30000)
        break
    default:
        logger.error(`client error: ${util.inspect(err,false,null)}`) 
    } 
}

process.on('unhandledRejection', err => {
    logger.error(`unhandledRejection: ${util.inspect(err,false,null)}`)  
})

process.on('uncaughtException', err => {
    logger.error(`uncaughtException: ${util.inspect(err,false,null)}`)  
})

login()
startPlugins()
