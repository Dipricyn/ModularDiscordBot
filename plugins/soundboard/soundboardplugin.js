const logger = require('./../../logger.js');
const fs = require('fs');
const Plugin = require('./../../plugin.js');
const botutil = require('./../../botutil.js');

module.exports = class SoundboardPlugin extends Plugin {

    constructor() {
        super("soundboard")
        this.handleMessage = this.handleMessage.bind(this)
    }

    startPlugin(client) {
        this.client = client
        this.addEventHandlers(client)
        this.loadSounds()
        this.isReady = true
    }

    stopPlugin(client) {
        this.removeEventHandlers(this.client)
        this.isReady = false
        this.client = null
    }

    handleMessage(message) {
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
            const files = sound.files
            let index
            do {
                index = Math.floor(Math.random() * files.length)
            } while(sound.last === index);
            sound.last = index
            const sender = message.member
            if (!sender) {
                message.author.send("Don't send this command to me, but send it in a guild channel instead!").catch(err=>{
                    logger.warning(`Couldn't send dm: ${err}`)
                })
                return
            }
            const channel = sender.voiceChannel
            if(channel) {
                this.playSound(`${this.dataDirLocation()}/${files[index]}`, channel)
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
        }
    }

    playSound(path, channel) {
        if(this.isReady) {
            this.isReady = false
            channel.join().then(connection => {
                const dispatcher = connection.playFile(path)
                dispatcher.on("end", end => {
                    channel.leave()
                    this.isReady = true
                })
            }).catch(err => logger.error(`${err} occured while playing sound.`)) 
        }
    }
}