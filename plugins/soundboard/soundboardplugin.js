const logger = require('./../../logger.js');
const fs = require('fs');
const Plugin = require('./../../plugin.js');
const botutil = require('./../../botutil.js');

/**
 * SoundboardPlugin supports playing sounds by typing commands.
 * The config file has to be in the form:
 *  {
 *      "sounds": [
 *          {
 *              "command": "mrgl",          //command to type
 *              "files":                    //files to play for command
 *              [
 *                  "sounds/murloc0.mp3",
 *                  "sounds/murloc1.mp3"
 *              ]
 *          }
 *      ]
 *  }
 */
module.exports = class SoundboardPlugin extends Plugin {

    constructor() {
        super("soundboard")
        this.handleMessage = this.handleMessage.bind(this)
    }

    startPlugin() {
        this.addEventHandlers(this.client)
        this.loadSounds()
        this.isReady = true
    }

    stopPlugin() {
        this.removeEventHandlers(this.client)
        this.isReady = false
    }

    handleMessage(message) {
        if(message.author.bot) return
        if (message.content.substring(0, 1) == '!') {
            const cmd = message.content.substring(1).split(' ')[0]
            const sounds = this.config.sounds.filter(sound => sound.command == cmd)
            if(sounds.length > 1) {
                logger.error(`multiple actions for command ${cmd}`)
                return
            } else if(sounds.length===0) {
                return
            }
            const sound = sounds[0]
            const sender = message.member
            if (!sender) {
                message.author.send("Don't send this command to me, but send it in a guild channel instead!").catch(err=>{
                    logger.warning(`Couldn't send dm: ${err}`)
                })
                return
            }
            const channel = sender.voiceChannel
            if(channel) {
                this.playSound(sound, channel)
            }
        }
    }

    defaultConfig() {
        return {
            sounds: []
        }
    }

    addEventHandlers(client) {
        client.on('message', this.handleMessage)
    }

    removeEventHandlers(client) {
        client.removeListener('message', this.handleMessage)
    }

    loadSounds() {
        for(let sound of this.config.sounds) {
            sound.last = -1
            sound.noticeMeTimer = sound.noticeMeTimer || 0
        }
    }

    /**
     * Join a channel and play a sound.
     * If the sound object just has one sound file it chooses that one
     * else it chooses one randomly.
     * @param {object} sound the sound object to choose a sound file from
     * @param {VoiceChannel} channel the channel to join
     * @returns a path to the sound file
     */
    playSound(sound, channel) {
        if(this.isReady) {
            this.isReady = false
            channel.join().then(connection => {
                const files = sound.files
                let file
                if (files.length > 1) {
                    let index
                    do {
                        index = Math.floor(Math.random() * files.length)
                    } while(sound.last === index);
                    sound.last = index
                    file = files[index]
                } else {
                    file = files[0]
                }
                const dispatcher = connection.playFile(`${this.dataDirLocation()}/${file}`)
                dispatcher.on("end", end => {
                    channel.leave()
                    this.isReady = true
                })
            }).catch(err => logger.error(`${err} occured while playing sound.`)) 
        }
    }
}