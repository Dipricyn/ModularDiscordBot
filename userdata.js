const moment = require('moment');

class UserData {
    constructor(startTime) {
        this.isOffline = false
        this.startTime = startTime
        this.totalTime = moment.duration(0)
    }

};

module.exports = UserData