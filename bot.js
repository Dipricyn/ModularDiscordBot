const Discord = require('discord.js');
const Winston = require('winston');
const auth = require('./auth.json');
const UserData = require('./userdata.js')
const moment = require('moment');
const mysql = require('mysql');

var dbcon = mysql.createConnection({
    host: "localhost",
    user: "dipricyn",
    password: "dipricyn"
});
con.connect(function(err) {
  if (err) {
      console.log("Error connecting to DB!");
  } else {
      client.login(auth.token)
  }
});
// Configure logger settings
const logger = Winston.createLogger({
    level: 'info',
    format: Winston.format.json(),
    transports: []
})
logger.add(new Winston.transports.Console({
    format: Winston.format.simple()
}));

// global variables
let guildMemberData = [];

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
}

// Initialize Discord client
const client = new Discord.Client();

client.on('message', message => {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.content.substring(0, 1) == '!') {
        var args = message.content.substring(1).split(' ');
        var cmd = args[0];

        args = args.splice(1);
        switch (cmd) {
            // !ping
        case 'ping':
            message.channel.send('pong')
            break;
            // !times
        case 'times':
            updateTimes();
            printTimes(message.channel);
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
            if (data.isOffline) {
                const timeDiff = moment.duration(moment().diff(data.startTime))
                data.totalTime.add(timeDiff)
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
    }
})
