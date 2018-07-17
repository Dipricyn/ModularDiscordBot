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
const moveDataFile = `${dataDir}moveData.json`
var bot = new Discord.Client();
var isReady = true

bot.login("NDY4ODM2Njg0MjM1Mjc2Mjk5.DjAFew.xRSGOaL8dhM2k11jcjLYPM2P82I")

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
        case 'safeMeFrom':
            fs.readFile(moveDataFile, function(err,content) {
                if(err) {
                    logger.info(`${err} occured while loading move data.`)
                    let newSaved = message.mentions.members.first().id
                    let data = {}
                    data[newSaved] = []
                    data[newSaved].push(message.author.id)
                    const jsonStr = JSON.stringify(data)
                    fs.writeFile (moveDataFile, jsonStr, function(err) {
                        if (err) {
                            logger.error(`${err} occured while saving move data.`)
                        }
                    })
                } else {
                    try {
                        let newSaved = message.mentions.members.first().id
                        logger.info(`${message.author.id} safed from ${newSaved}`)
                        let data = JSON.parse(content)
                        let containsKey = false
                        for (let [key, toMove] of Object.entries(data)) {
                            if(key == newSaved) {
                                containsKey = true
                                let contained = false
                                for(id of toMove) {
                                    if(id == message.author.id) {
                                        contained = true
                                    }
                                }
                                if(!contained) {
                                    toMove.push(message.author.id)
                                    const jsonStr = JSON.stringify(data)
                                    fs.writeFile (moveDataFile, jsonStr, function(err) {
                                        if (err) {
                                            logger.error(`${err} occured while saving move data.`)
                                        }
                                    })
                                }
                            }
                        }
                        if(!containsKey) {
                            data[newSaved] = []
                            data[newSaved].push(message.author.id)
                            const jsonStr = JSON.stringify(data)
                            fs.writeFile (moveDataFile, jsonStr, function(err) {
                                if (err) {
                                    logger.error(`${err} occured while saving move data.`)
                                }
                            })
                        }
                    } catch (err) {
                        logger.error(`${err} occured while loading member data.`)        
                    }
                }
            })
            message.delete();
            break;
        case 'sacrificeMeFor':
            fs.readFile(moveDataFile, function(err,content) {
                if (err) {
                    logger.error(`${err} occured while saving move data.`)
                } else {
                    try {
                        let data = JSON.parse(content)
                        let newSaved = message.mentions.members.first().id
                        data[newSaved].splice(data[newSaved].indexOf(message.author.id), 1)
                        const jsonStr = JSON.stringify(data)
                        fs.writeFile (moveDataFile, jsonStr, function(err) {
                            if (err) {
                                logger.error(`${err} occured while saving move data.`)
                            }
                        })
                    } catch (err) {
                        logger.error(`${err} occured while loading member data.`)        
                    }
                }
            })
            message.delete()
            break
        case 'mrgl':
            if(isReady) {
                isReady = false
                let voiceChannel = message.member.voiceChannel
                voiceChannel.join().then(connection => {
                    console.debug("Joined channel")
                    const dispatcher = connection.playFile(`${dataDir}murloc.mp3`)
                    dispatcher.on("end", end => {
                        voiceChannel.leave()
                        isReady = true
                    })
                }).catch(err => logger.error(`${err} occured while saving move data.`))
            }
            message.delete();
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
    if(status == 'online') {
        fs.readFile(moveDataFile, function(err,content) {
            if (err) {
                logger.error(`${err} occured while saving move data.`)
            } else {
                try {
                    let data = JSON.parse(content)
                    for (let [key, toMove] of Object.entries(data)) {
                        if(key == newMember.id) {
                            for(idT of toMove) {
                                client.guilds.get("259460880742350848").members.find("id", idT).setVoiceChannel(client.channels.find("id", "431931044913086474"))
                            }
                        }
                    }
                } catch (err) {
                    logger.error(`${err} occured while loading member data.`)        
                }
            }
        })
    }
})

client.login(auth.token)