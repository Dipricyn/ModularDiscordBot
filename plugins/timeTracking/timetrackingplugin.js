const moment = require('moment');
const Plugin = require('./../../plugin.js');
const UserData = require('./userdata.js');
const UserDataContainer = require('./userdatacontainer.js');
const logger = require('./../../logger.js');
const fs = require('fs');

module.exports = class TimeTrackingPlugin extends Plugin {

    constructor() {
        super("timetracking")
        this.handleMessage = this.handleMessage.bind(this)
        this.handlePresenceUpdate = this.handlePresenceUpdate.bind(this)
        this.handleGlobalError = this.handleGlobalError.bind(this)
        this.memberDataFile = `${this.dataDirLocation()}/memberdata.json`
    }

    startPlugin(client) {
        this.client = client
        this.memberDataContainer = new UserDataContainer(this.memberDataFile)
        this.addEventHandlers(client)
        this.memberDataContainer.loadMemberData().then(()=>{
            this.scanPresences(this.client)
        })
    }
    
    stopPlugin(client) {
        this.memberDataContainer.updateTimes()
        this.removeEventHandlers(this.client)
        this.client = null
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
            if(this.shouldTrack(newMember.user) && this.isOnline(status)) {
                if(!(username in this.memberDataContainer.data)) {
                    this.memberDataContainer.data[username] = new UserData()
                }
                this.memberDataContainer.data[username].isOffline = false
                this.memberDataContainer.data[username].startTime = moment()
                logger.debug(`${username} was already online`)
            }
        }
    }

    printTimes(channel) {
        let sorted = []
        for (const [key, value] of Object.entries(this.memberDataContainer.data)) {
            sorted.push([key,value.totalTime.asHours()])
        }
        sorted.sort((a,b)=> b[1]-a[1])
        let msg = ""
        let i=1
        for (const [key, value] of sorted) {
            if(key===this.client.user.username) continue
            msg += `${i}. ${key}: ${value.toFixed(2)} hours.\n`
            i++
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
        if (!this.shouldTrack(newMember.user)) {
            return
        }
        if (!this.isOnline(newStatus) && this.isOnline(oldStatus)) { //someone went offline
            if (user in this.memberDataContainer.data) {
                let data = this.memberDataContainer.data[user]
                const timeDiff = moment.duration(moment().diff(data.startTime))
                logger.debug(`${user} went ${newStatus}: added ${timeDiff.asHours()} to ${data.totalTime.asHours()}`)
                data.totalTime.add(timeDiff)
                data.isOffline = true
                this.memberDataContainer.saveMemberData()
            } else {
                logger.warn(`untracked user ${user} went offline: dropping time`)
            }
        } else if (this.isOnline(newStatus) && !this.isOnline(oldStatus)) { //someone went online
            if (user in this.memberDataContainer.data) {
                let data = this.memberDataContainer.data[user]
                data.isOffline = false
                data.startTime = moment()
            } else {
                let userdata = new UserData()
                this.memberDataContainer.data[user] = userdata
            }
            logger.debug(`${user} went ${newStatus}: totalTime ${this.memberDataContainer.data[user].totalTime.asHours()}`)
            this.memberDataContainer.saveMemberData()
        }
    }

    handleMessage(message) {
        if (message.content.substring(0, 1) == '!') {
            const cmd = message.content.substring(1).split(' ')[0]
            switch (cmd) {
            case 'times': // !times
                this.memberDataContainer.updateTimes()
                this.printTimes(message.channel)
                break;
            }
        }
    }

    handleGlobalError() {
        this.memberDataContainer.updateTimes()
    }

    addEventHandlers(client) {
        client.on('message', this.handleMessage)
        client.on('presenceUpdate', this.handlePresenceUpdate)
        process.on('uncaughtException', this.handleGlobalError)
        process.on('unhandledRejection', this.handleGlobalError)
    }

    removeEventHandlers(client) {
        client.removeListener('message', this.handleMessage)
        client.removeListener('presenceUpdate', this.handlePresenceUpdate)
        process.removeListener('uncaughtException', this.handleGlobalError)
        process.removeListener('unhandledRejection', this.handleGlobalError)
    }

    isOnline(status) {
        switch(status) {
            case "online": return true
            case "idle": return false
            case "dnd": return false
            case "offline": return false
        }
    }

    shouldTrack(user) {
        if(!user.bot) {
            return true
        } else if(user.bot && user.id===this.client.user.id) {
            return true
        } else {
            return false
        }   
    }
}