#!/usr/bin/env node --harmony
const Discord = require('discord.js');
const logger = require('./logger.js');
const auth = require('./auth.json');
const UserData = require('./userdata.js');
const UserDataContainer = require('./userdatacontainer.js');
const moment = require('moment');
const fs = require('fs');
const util = require('util');

const dataDir = 'data/'
const memberDataFile = `${dataDir}memberdata.json`
var client

function scanPresences() {
    if(client.guilds.size===0){
        return
    }
    const guild = client.guilds.values().next().value
    const values = guild.members.values()
    for(let newMember of values) {
        const username = newMember.user.username
        const status = newMember.presence.status        
        if(status!=="offline") {
            if(!(username in memberDataContainer.data)) {
                memberDataContainer.data[username] = new UserData()
            }
            memberDataContainer.data[username].isOffline = false
            memberDataContainer.data[username].startTime = moment()
        }
    }
}

function printTimes(channel) {
    let msg = ""
    for (const [key, value] of Object.entries(memberDataContainer.data)) {
        msg += `${key}: ${value.totalTime.humanize()}.\n`
    }
    if (!msg || msg === "") {
        msg = "No one listed."
    }
    channel.send(msg)
}

function handlePresenceUpdate(user, oldStatus, newStatus) {
    if (newStatus === 'offline' && oldStatus !== 'offline') { //someone went offline
        if (user in memberDataContainer.data) {
            let data = memberDataContainer.data[user]
            const timeDiff = moment.duration(moment().diff(data.startTime))
            data.totalTime.add(timeDiff)
            data.isOffline = true
            memberDataContainer.saveMemberData()
        } else {
            logger.warn(`untracked user ${user} went offline: dropping time`)
        }
    } else if (newStatus !== 'offline' && oldStatus === 'offline') { //someone went online
        if (user in memberDataContainer.data) {
            let data = memberDataContainer.data[user]
            data.isOffline = false
            data.startTime = moment()
        } else {
            let userdata = new UserData()
            memberDataContainer.data[user] = userdata
        }
        memberDataContainer.saveMemberData()
    }
}

function login() {
    logger.info("logging in...")
    client = null
    client = new Discord.Client()
    client.login(auth.token)
    addEventHandlers(client)
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

function addEventHandlers(client) {
    client.on('message', message => {
        // Our bot needs to know if it will execute a command
        // It will listen for messages that will start with `!`
        if (message.content.substring(0, 1) == '!') {
            var args = message.content.substring(1).split(' ')
            var cmd = args[0]
    
            args = args.splice(1)
            switch (cmd) {
                // !ping
            case 'ping':
                message.channel.send('pong')
                break;
                // !times
            case 'times':
                memberDataContainer.updateTimes()
                printTimes(message.channel)
                break;
            }
        }
    });
    
    client.on('presenceUpdate', (oldMember, newMember) => {
        handlePresenceUpdate(newMember.user.username, 
            oldMember.presence.status, 
            newMember.presence.status)
    })
    
    client.on('ready', () => {
        logger.info("bot is ready")
        scanPresences()
    })
    
    client.on('error', handleClientError)
}

fs.mkdir(dataDir, err => {
    if(err && (err.code !== 'EEXIST')) logger.warn(`failed to create directory ${dataDir}: ${err}`)
})
let memberDataContainer = new UserDataContainer(memberDataFile)
memberDataContainer.loadMemberData()

login()

process.on('unhandledRejection', err => {
    logger.error(`unhandledRejection: ${util.inspect(err,false,null)}`)  
})

process.on('uncaughtException', err => {
    logger.error(`uncaughtException: ${util.inspect(err,false,null)}`)  
})