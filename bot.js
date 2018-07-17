#!/usr/bin/env node --harmony
const Discord = require('discord.js');
const Winston = require('winston');
const auth = require('./auth.json');
const UserData = require('./userdata.js');
const moment = require('moment');
const fs = require('fs');

const dataDir = 'data/'
const memberDataFile = `${dataDir}memberdata.json`

function loadMemberData() {
    try {
        fs.readFile(memberDataFile, function(err,content) {
            if(err) {
                logger.info(`${err} occured while loading member data.`)
            } else {
                guildMemberData = JSON.parse(content)
                for (const [key, value] of Object.entries(guildMemberData)) {
                    value.startTime = moment(value.startTime)
                    value.totalTime = moment.duration(value.totalTime)
                }
            }
        })
    } catch (err) {
        logger.error(`${err} occured while loading member data.`)        
    }
}

function saveMemberData() {
    try {
        const str = JSON.stringify(guildMemberData)
        fs.writeFile (memberDataFile, JSON.stringify(guildMemberData), function(err) {
            if (err) {
                logger.error(`${err} occured while saving member data.`)
            }
        })
    } catch (err) {
        logger.error(`${err} occured while loading member data.`)        
    }
}

function printTimes(channel) {
    for (const [key, value] of Object.entries(guildMemberData)) {
        channel.send(`${key}: ${value.totalTime.humanize()}.\n`)
    }
}

function updateTimes() {
    for (const [name, data] of Object.entries(guildMemberData)) {
        const current = moment()
        const timeDiff = moment.duration(current.diff(data.startTime))
        data.totalTime.add(timeDiff)
        data.startTime = current
    }
    saveMemberData()
}

// Configure logger settings
const logger = Winston.createLogger({
    level: 'info',
    format: Winston.format.json(),
    transports: [
      //
      // - Write to all logs with level `info` and below to `combined.log` 
      // - Write all logs error (and below) to `error.log`.
      //
      new Winston.transports.File({ filename: `${dataDir}error.log`, level: 'error' }),
      new Winston.transports.File({ filename: `${dataDir}combined.log` })
    ]
  });
  
  //
  // If we're not in production then log to the `console` with the format:
  // `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
  // 
  if (process.env.NODE_ENV !== 'production') {
    logger.add(new Winston.transports.Console({
      format: Winston.format.simple()
    }));
  }

// global variables
let guildMemberData = {}
fs.mkdir(dataDir, err => {
    if(err) logger.warn(`failed to create directory ${dataDir}: ${err}`)
})
loadMemberData()

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
            updateTimes()
            printTimes(message.channel)
            break;
        }
    }
});

client.on('presenceUpdate', (oldMember, newMember) => {
    const status = newMember.user.presence.status
    const name = newMember.user.username
    if (status == 'offline') {
        if (name in guildMemberData) {
            let data = guildMemberData[name]
            if (!data.isOffline) {
                const timeDiff = moment.duration(moment().diff(data.startTime))
                data.totalTime.add(timeDiff)
                saveMemberData()
            }
            data.isOffline = true
        }
    } else {
        if (name in guildMemberData) {
            let data = guildMemberData[name]
            data.isOffline = false
            data.startTime = moment()
        } else {
            let userdata = new UserData(moment())
            guildMemberData[name] = userdata
        }
        saveMemberData()
    }
})

client.login(auth.token)