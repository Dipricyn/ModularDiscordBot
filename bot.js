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

fs.mkdir(dataDir, err => {
    if(err) logger.warn(`failed to create directory ${dataDir}: ${err}`)
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
    const status = newMember.user.presence.status
    const name = newMember.user.username
    if (status == 'offline') {
        if (name in memberDataContainer.data) {
            let data = memberDataContainer.data[name]
            if (!data.isOffline) {
                const timeDiff = moment.duration(moment().diff(data.startTime))
                data.totalTime.add(timeDiff)
                memberDataContainer.saveMemberData()
            }
            data.isOffline = true
        }
    } else {
        if (name in memberDataContainer.data) {
            let data = memberDataContainer.data[name]
            data.isOffline = false
            data.startTime = moment()
        } else {
            let userdata = new UserData(moment())
            memberDataContainer.data[name] = userdata
        }
        memberDataContainer.saveMemberData()
    }
})

client.login(auth.token)