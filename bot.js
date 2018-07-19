#!/usr/bin/env node --harmony
const Discord = require('discord.js');
const logger = require('./logger.js');
const auth = require('./auth.json');
const UserData = require('./userdata.js');
const UserDataContainer = require('./userdatacontainer.js');
const moment = require('moment');
const fs = require('fs');

const dataDir = 'data/'
const memberDataFile = `${dataDir}memberdata.json`


function scanPresences() {
    logger.info("starting scan")
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
                logger.info(`found new user ${username} while scanning`)
            }
            memberDataContainer.data[username].isOffline = false
            memberDataContainer.data[username].startTime = moment()
            logger.info(`${username} was already online while scanning`)
        }
    }
    logger.info("------------finished scan-------------")
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
    logger.info(`${user} is now ${newStatus}.`)
    if (newStatus === 'offline' && oldStatus !== 'offline') { //someone went offline
        if (user in memberDataContainer.data) {
            let data = memberDataContainer.data[user]
            logger.info(`\told time was ${data.totalTime.asMinutes()}`)
            logger.info(`\tstart time was ${data.startTime.format()}`)
            const timeDiff = moment.duration(moment().diff(data.startTime))
            data.totalTime.add(timeDiff)
            logger.info(`\twas on for ${timeDiff.asMinutes()}`)
            data.isOffline = true
            memberDataContainer.saveMemberData()
        } else {
            logger.warn("\tuntracked user went offline")
        }
    } else if (newStatus !== 'offline' && oldStatus === 'offline') { //someone went online
        if (user in memberDataContainer.data) {
            let data = memberDataContainer.data[user]
            data.isOffline = false
            data.startTime = moment()
        } else {
            let userdata = new UserData()
            memberDataContainer.data[user] = userdata
            logger.info(`\tnow tracking`)
        }
        memberDataContainer.saveMemberData()
    }
}

fs.mkdir(dataDir, err => {
    if(err && (err.code !== 'EEXIST')) logger.warn(`failed to create directory ${dataDir}: ${err}`)
})
let memberDataContainer = new UserDataContainer(memberDataFile)
memberDataContainer.loadMemberData()

// Initialize Discord client
const client = new Discord.Client()

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

client.login(auth.token).then( () => {
    scanPresences()
})
