const logger = require('./../../logger.js');
const Plugin = require('./../../plugin.js');
const Command = require('./../../command.js');

/**
 * SoundboardPlugin supports playing sounds by typing commands.
 * The config file has to be in the form:
 * @example
 * {
 *     "sounds": [
 *         {
 *             "command": "mrgl",          //command to type
 *             "files":                    //files to play for command
 *             [
 *                 "sounds/murloc0.mp3",
 *                 "sounds/murloc1.mp3"
 *             ]
 *         }
 *     ]
 * }
 */
class SoundboardPlugin extends Plugin {

    constructor() {
        super("soundboard")
    }

    startPlugin() {
        this.loadSounds()
        this.isReady = true
    }

    stopPlugin() {
        this.isReady = false
    }

    defaultConfig() {
        return {
            sounds: []
        }
    }

    loadSounds() {
        for(let sound of this.config.sounds) {
            sound.last = -1
            sound.noticeMeTimer = sound.noticeMeTimer || 0

            this.commandContainer.add(new Command()
                .setIdentifier(sound.command)
                .setHandler((args, message)=>{
                    const soundFile = this.chooseRandomSoundFile(sound)
                    const channel = message.member.voiceChannel
                    if(channel) {
                        this.playSoundFile(soundFile, channel)
                    } else {
                        message.channel.send('You must be in a voice channel to do that.')
                    }
                })
                .setOptions({requireChannelType: "guild"})
            )
            if(sound.files.length > 1) {
                for(let i=0; i<sound.files.length; i++) {
                    const file = sound.files[i]
                    this.commandContainer.add(new Command()
                        .setIdentifier(sound.command+i)
                        .setHandler((args, message)=>{
                            const soundFile = sound.files[i]
                            const channel = message.member.voiceChannel
                            if(channel) {
                                this.playSoundFile(soundFile, channel)
                            } else {
                                message.channel.send('You must be in a voice channel to do that.')
                            }
                        })
                        .setOptions({requireChannelType: "guild"})
                    )
                }
            }
        }
    }

    /**
     * Join a channel and play a sound.
     * If the sound object just has one sound file it chooses that one
     * else it chooses one randomly.
     * @param {object} file the sound file to play
     * @param {VoiceChannel} channel the channel to join
     */
    playSoundFile(file, channel) {
        if(this.isReady) {
            this.isReady = false
            channel.join().then(connection => {
                const dispatcher = connection.playFile(`${this.dataDirLocation()}/${file}`)
                dispatcher.on("end", end => {
                    channel.leave()
                    this.isReady = true
                })
            }).catch(err => logger.error(`${err} occured while playing sound.`)) 
        }
    }

    /**
     * Choose a sound file randomly from a sound object.
     * If the sound contains only one sound file it chooses that one.
     * @param {object} sound the sound object to choose the sound file from
     * @returns {string} a path to the sound file
     */
    chooseRandomSoundFile(sound) {
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
        return file
    }
}
module.exports = SoundboardPlugin