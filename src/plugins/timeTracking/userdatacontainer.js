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
        return new Promise((resolve, reject)=>{
            try {
                fs.readFile(this.memberDataFilePath, (err, content) => {
                    if(err) {
                        if(err.code !== "ENOENT") {
                            throw err
                        }    
                        resolve()
                    } else {
                        try {
                            if(content==""){
                                resolve()
                                return
                            }
                            const jsonData = JSON.parse(content)
                            for (let [username, data] of Object.entries(jsonData)) {
                                const user = new UserData()
                                user.totalTime = moment.duration(data["totalTime"])
                                user.isOffline = true
                                that.data[username] = user
                            }
                            resolve()
                        } catch(err) {
                            logger.error(`${err} occured while parsing member data:\n${content}`)
                            reject(err)
                        }
                    }
                })
            } catch(err) {
                if(err && (err.code !== "ENOENT")) {
                    logger.error(`${err} occured while loading member data.`)    
                }  
                resolve()
            }
        })
    }
    
    saveMemberData(mode='async') {
        let data = this.data
        try {
            const jsonStr = JSON.stringify(data, (key, value) => {
                switch(key) {
                    case 'startTime': return undefined
                    case 'isOffline': return undefined
                }
                return value
            })
            if(mode==='sync') {
                fs.writeFileSync(this.memberDataFilePath, jsonStr)
            } else if(mode==='async') {
                fs.writeFile(this.memberDataFilePath, jsonStr, err => {
                    if (err) {
                        logger.error(`${err} occured while saving member data.`)
                    }
                })
            } else {
                throw Error(`unknown saveMemberData parameter mode ${mode}`)
            }
        } catch(err) {
            logger.error(`${err} occured while saving member data.`)        
        }
    }
    
    updateTimes(mode='async') {
        for (const [key, member] of Object.entries(this.data)) {
            this.updateTime(member)
        }
        this.saveMemberData(mode)
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