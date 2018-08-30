const Plugin = require('./../../plugin.js');
const Command = require('./../../command.js');
const ytdl = require('ytdl-core');

/**
 * MusicQueuePlugin supports playing youtube videos.
 */
class MusicQueuePlugin extends Plugin {

    constructor() {
        super("musicqueue")
        this.musicqueue = []
        this.handlePlayCommand = this.handlePlayCommand.bind(this)
        this.handlePauseCommand = this.handlePauseCommand.bind(this)
        this.handleResumeCommand = this.handleResumeCommand.bind(this)
        this.handleNextCommand = this.handleNextCommand.bind(this)
        this.handleQueueCommand = this.handleQueueCommand.bind(this)
        this.currentDispatcher = null
        this.currentMusic = null
        this.commandContainer.add(new Command()
            .setIdentifier("musicplay")
            .setHandler(this.handlePlayCommand)
        )
        this.commandContainer.add(new Command()
            .setIdentifier("musicpause")
            .setHandler(this.handlePauseCommand)
        )
        this.commandContainer.add(new Command()
            .setIdentifier("musicresume")
            .setHandler(this.handleResumeCommand)
        )
        this.commandContainer.add(new Command()
            .setIdentifier("musicnext")
            .setHandler(this.handleNextCommand)
        )
        this.commandContainer.add(new Command()
            .setIdentifier("musicqueue")
            .setHandler(this.handleQueueCommand)
        )
    }

    handlePlayCommand(args, message) {
        const guild = this.client.guilds.first()
        const user = message.author
        const member = guild.member(user)
        if(!member) {
            logger.warn(`User ${user.username} that requested music is not in guild ${guild.name}!`)
            return
        }
        const newMusic = {url: args[0], member: member}
        const nr = this.musicqueue.push(newMusic)
        ytdl.getInfo(args[0], (err, info)=>{
            if(err) {
                logger.error(`ydtl.getInfo error: ${err}`)
                newMusic.title = 'error loading title'
            } else {
                newMusic.title = info.title
            }
        })
        if(!this.currentDispatcher) {
            const music = this.musicqueue.shift()
            if(member.voiceChannel) {
                this.play(music, member.voiceChannel)
            } else {
                music.member.send(`You are not in a channel to play your music.`)
            }
        } else {
            user.send(`Your music is number ${nr} in the queue.`)
        }
    }

    handlePauseCommand(args, message) {
        if(!this.currentDispatcher){
            return
        }
        this.currentDispatcher.pause()
    }

    handleResumeCommand(args, message) {
        if(!this.currentDispatcher && this.currentDispatcher.paused) {
            return
        }
        this.currentDispatcher.resume()
    }

    handleNextCommand(args, message) {
        if(!this.currentDispatcher) {
            return
        }
        this.currentDispatcher.end()
    }

    handleQueueCommand(args, message) {
        let msg = ""
        if(this.currentMusic) {
            msg += `Now playing: ${this.currentMusic.title}\n`
        }
        if(this.musicqueue.length === 0) {
            msg += 'No music queued.'
        } else {
            let i=1
            for (const music of this.musicqueue) {
                msg += `${i}. ${music.member}: ${music.title}\n`
                i++
            }
        }
        message.channel.send(msg)
    }

    play(music, voiceChannel) {
        voiceChannel.join()
        .then(connection => {
            const stream = ytdl(music.url, { filter : "audioonly" })
            const streamOptions = {volume: 0.1}
            this.currentMusic = music
            this.currentDispatcher = connection.playStream(stream, streamOptions)
            this.currentDispatcher.on("end", ()=> {
                if(this.musicqueue.length > 0) {
                    this.play(this.musicqueue.shift(), voiceChannel)
                } else {
                    this.currentDispatcher = null
                    this.currentMusic = null
                    voiceChannel.leave()
                }
            })
        })
        .catch(console.error);
    }
}
module.exports = MusicQueuePlugin