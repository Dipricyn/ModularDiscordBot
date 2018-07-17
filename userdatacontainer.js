const logger = require('./logger.js');
const fs = require('fs');
const moment = require('moment');


class UserDataContainer {

    constructor(path) {
        this.data = {}
        this.memberDataFilePath = path
    }

    loadMemberData() {
        let that = this
        try {
            fs.readFile(this.memberDataFilePath, function(err,content) {
                if(err) {
                    logger.info(`${err} occured while loading member data.`)
                } else {
                    try {
                        that.data = JSON.parse(content, (key, value) => {
                            switch(key){
                                case 'startTime': return moment(value)
                                case 'totalTime': return moment.duration(value)
                            }
                            return value
                        })
                        for (let [name, member] of Object.entries(that.data)) {
                            member.isOffline = true
                        }
                    } catch (err) {
                        logger.error(`${err} occured while loading member data.`)        
                    }
                }
            })
        } catch (err) {
            logger.error(`${err} occured while loading member data.`)        
        }
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
        for (const [name, member] of Object.entries(this.data)) {
            const current = moment()
            const timeDiff = moment.duration(current.diff(member.startTime))
            member.totalTime.add(timeDiff)
            member.startTime = current
        }
        this.saveMemberData()
    }

};

module.exports = UserDataContainer