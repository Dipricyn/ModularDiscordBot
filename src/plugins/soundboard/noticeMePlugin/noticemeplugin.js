const Plugin = require('./../../../plugin.js');

/**
 * This plugin supports playing a sound randomly within a timespan in the channel of a randomly chosen user.
 * Depends on the soundboard plugin to run!
 * It reads the property "noticeMeTimer": <milliseconds> from each sound object in the soundboard plugin's config file.
 * @example
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
class NoticeMePlugin extends Plugin {

    constructor(soundboardPlugin) {
        super("noticeme")
        this.soundboardPlugin = soundboardPlugin
        this.onNoticeMe = this.onNoticeMe.bind(this)
        this.timers = new Map()
    }

    startPlugin() {
        this.isReady = true
        this.timers.clear()
        this.setupNoticeMeTimers()
    }

    stopPlugin() {
        for(const [command, timer] of this.timers) {
            clearTimeout(timer)
        }
        this.timers.clear()
        this.isReady = false
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
            const soundFile = this.soundboardPlugin.chooseRandomSoundFile(sound)
            this.soundboardPlugin.playSoundFile(soundFile, member.voiceChannel)
        }
        this.scheduleNoticeMeTimer(sound)
    }

    scheduleNoticeMeTimer(sound) {
        const timeout = Math.random()*sound.noticeMeTimer
        const timer = setTimeout(this.onNoticeMe, timeout, sound)
        this.timers.set(sound.command, timer)
    }
}
module.exports = NoticeMePlugin