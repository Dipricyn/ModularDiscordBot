const moment = require('moment');

class UserData {
    constructor() {
        this.isOffline = false
        this.startTime = moment()
        this.totalTime = moment.duration(0)
    }

}
module.exports = UserData