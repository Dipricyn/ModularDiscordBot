## ModularDiscordBot
This bot is built to provide you a minimal environment to implement your own Discord bot targeting your special requirements.
It is built with [node.js] and ES6 and features a highly modular approach based on plugins that can be enabled and disabled as you need.
### Build your own bot!
Implement your own plugin:
 ```
class PingPongPlugin extends Plugin {
    constructor() {
        super("pingpong")
        this.commandContainer.add(new Command()
            .setIdentifier("ping")
            .setHandler((args, message)=>{
                message.channel.send("pong")
            })
        )
    }
}
module.exports = PingPongPlugin
 ```
Add it to the bot's plugin container:
```
class ModularDiscordBot {
    constructor() {
        //...
        const pingPongPlugin = new PingPongPlugin()
        this.pluginContainer.add(pingPongPlugin)
    }
}
```
Create a bot in the discord console and [get a bot token][1].
Add your authentication token to the `auth.json` file in the bot's root directory:
```
{
    "token": "tokenstring1234567890"
}
```
Start the bot:
```
$ npm start
```

[//]: #
   [node.js]: <http://nodejs.org>
   [1]: <https://github.com/reactiflux/discord-irc/wiki/Creating-a-discord-bot-&-getting-a-token>
