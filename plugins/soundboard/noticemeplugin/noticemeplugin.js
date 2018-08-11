const logger = require('./../../../logger.js');
const fs = require('fs');
const Plugin = require('./../../../plugin.js');
const botutil = require('./../../../botutil.js');


/**
 * This plugin supports playing a sound randomly within a timespan in the channel of a randomly chosen user.
 * It reads the property "noticeMeTimer": <milliseconds> from each sound object in the config file.
 * {
 *     sounds: [
 *         {
 *             "command": "mrgl",
 *             "files": ["sounds/murloc0.mp3"],
 *             "noticeMeTimer": 3600000
 *         }
 *     ]
 * }
 */
module.exports = class NoticeMePlugin extends Plugin {

    constructor(soundboardPlugin) {
        super("soundboard")
        this.soundboardPlugin = soundboardPlugin
        this.onNoticeMe = this.onNoticeMe.bind(this)
        this.timers = new Map()
    }

    startPlugin(client) {
        this.client = client
        this.isReady = true
        this.timers.clear()
        this.setupNoticeMeTimers()
    }

    stopPlugin(client) {
        for(const [command, timer] of this.timers) {
            clearInterval(timer)
        }
        this.timers.clear()
        this.isReady = false
        this.client = null
    }

    defaultConfig() {
        return null
    }

    setupNoticeMeTimers() {
        const noticeMeSounds = this.soundboardPlugin.config.sounds.filter(sound => sound.noticeMeTimer > 0)
        for(const sound of noticeMeSounds) {
            this.scheduleNoticeMeTimer(sound)
        }
    }
    
    onNoticeMe(sound){
        const guild = this.client.guilds.first()
        if(!guild){
            logger.warn("bot is not in a guild to use for notice me timer!")
            return
        }
        let count = 0
        let member
        for(const [key, m] of guild.members) {
            if(m.voiceChannel !== undefined) {
                if(Math.random() < 1/++count) {
                    member = m
                }
            }
        }
        if(member) {
            this.soundboardPlugin.playSound(sound, member.voiceChannel)
        }
        this.scheduleNoticeMeTimer(sound)
    }

    scheduleNoticeMeTimer(sound) {
        const timeout = Math.random()*sound.noticeMeTimer
        const timer = setTimeout(this.onNoticeMe, timeout, sound)
        this.timers.set(sound.command, timer)
    }
}