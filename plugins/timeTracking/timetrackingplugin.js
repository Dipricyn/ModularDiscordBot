const moment = require('moment');
const UserData = require('./userdata.js');
const UserDataContainer = require('./userdatacontainer.js');
const logger = require('./../../logger.js');
const fs = require('fs');

const dataDir = 'data/'
const memberDataFile = `${dataDir}memberdata.json`


module.exports = class TimeTrackingPlugin {

    constructor() {
        this.handleMessage = this.handleMessage.bind(this)
        this.handlePresenceUpdate = this.handlePresenceUpdate.bind(this)
        this.handleReady = this.handleReady.bind(this)
    }

    startPlugin(client) {
        this.client = client
        fs.mkdir(dataDir, err => {
            if(err && (err.code !== 'EEXIST')) logger.warn(`failed to create directory ${dataDir}: ${err}`)
        })
        this.memberDataContainer = new UserDataContainer(memberDataFile)
        this.memberDataContainer.loadMemberData()
        this.addEventHandlers(client)
    }
    
    stopPlugin() {
        this.client.removeListener('message', this.handleMessage)
        this.client.removeListener('presenceUpdate', this.handlePresenceUpdate)
        this.client.removeListener('ready', this.handleReady)
    }

    scanPresences(client) {
        if(client.guilds.size===0){
            return
        }
        const guild = client.guilds.values().next().value
        const values = guild.members.values()
        for(let newMember of values) {
            const username = newMember.user.username
            const status = newMember.presence.status        
            if(status!=="offline") {
                if(!(username in this.memberDataContainer.data)) {
                    this.memberDataContainer.data[username] = new UserData()
                }
                this.memberDataContainer.data[username].isOffline = false
                this.memberDataContainer.data[username].startTime = moment()
            }
        }
    }

    printTimes(channel) {
        let msg = ""
        for (const [key, value] of Object.entries(this.memberDataContainer.data)) {
            msg += `${key}: ${value.totalTime.humanize()}.\n`
        }
        if (!msg || msg === "") {
            msg = "No one listed."
        }
        channel.send(msg)
    }

    handlePresenceUpdate(oldMember, newMember) {
        const user = newMember.user.username
        const oldStatus = oldMember.presence.status
        const newStatus = newMember.presence.status
        if (newStatus === 'offline' && oldStatus !== 'offline') { //someone went offline
            if (user in this.memberDataContainer.data) {
                let data = this.memberDataContainer.data[user]
                const timeDiff = moment.duration(moment().diff(data.startTime))
                data.totalTime.add(timeDiff)
                data.isOffline = true
                this.memberDataContainer.saveMemberData()
            } else {
                logger.warn(`untracked user ${user} went offline: dropping time`)
            }
        } else if (newStatus !== 'offline' && oldStatus === 'offline') { //someone went online
            if (user in this.memberDataContainer.data) {
                let data = this.memberDataContainer.data[user]
                data.isOffline = false
                data.startTime = moment()
            } else {
                let userdata = new UserData()
                this.memberDataContainer.data[user] = userdata
            }
            this.memberDataContainer.saveMemberData()
        }
    }

    handleMessage(message) {
        if (message.content.substring(0, 1) == '!') {
            var args = message.content.substring(1).split(' ')
            var cmd = args[0]
            args = args.splice(1)
            switch (cmd) {
            case 'times': // !times
                this.memberDataContainer.updateTimes()
                this.printTimes(message.channel)
                break;
            }
        }
    }

    handleReady() {
        this.scanPresences(this.client)
    }

    addEventHandlers(client) {
        client.on('message', this.handleMessage)
        client.on('presenceUpdate', this.handlePresenceUpdate)
        client.on('ready', this.handleReady)
    }
}