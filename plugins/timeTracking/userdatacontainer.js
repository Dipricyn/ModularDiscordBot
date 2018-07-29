const logger = require('./../../logger.js');
const fs = require('fs');
const moment = require('moment');
const UserData = require('./userdata.js')

class UserDataContainer {

    constructor(path) {
        this.data = {}
        this.memberDataFilePath = path
    }

    loadMemberData() {
        let that = this
        return new Promise((resolve)=>{
            try {
                fs.readFile(this.memberDataFilePath, function(err,content) {
                    if(err) {
                        if(err && (err.code !== "ENOENT")) {
                            logger.error(`${err} occured while loading  member data.`)    
                        } 
                    } else {
                        try {
                            const jsonData = JSON.parse(content)
                            for (let [username, data] of Object.entries(jsonData)) {
                                const user = new UserData()
                                user.totalTime = moment.duration(data["totalTime"])
                                user.isOffline = true
                                that.data[username] = user
                            }
                            resolve()
                        } catch (err) {
                            logger.error(`${err} occured while parsing member data:\n${content}`)        
                        }
                    }
                })
            } catch (err) {
                if(err && (err.code !== "ENOENT")) {
                    logger.error(`${err} occured while loading  member data.`)    
                }  
            }
        })
    }
    
    saveMemberData() {
        let data = this.data
        try {
            const jsonStr = JSON.stringify(data, (key, value) => {
                switch(key) {
                    case 'startTime': return undefined
                    case 'isOffline': return undefined
                }
                return value
            })
            fs.writeFile (this.memberDataFilePath, jsonStr, function(err) {
                if (err) {
                    logger.error(`${err} occured while saving member data.`)
                }
            })
        } catch (err) {
            logger.error(`${err} occured while loading member data.`)        
        }
    }
    
    updateTimes() {
        for (const [key, member] of Object.entries(this.data)) {
            this.updateTime(member)
        }
        this.saveMemberData()
    }

    updateTime(member) {
        if (member.isOffline===false) {
            const current = moment()
            const timeDiff = moment.duration(current.diff(member.startTime))
            member.totalTime.add(timeDiff)
            member.startTime = current
        }
    }
}

module.exports = UserDataContainer