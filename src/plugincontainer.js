const logger = require('./logger.js');
const fs = require('fs');

/**
 * Datastructure to facilitate managing multiple plugins. 
 */
class PluginContainer extends Map {

    /**
     * @param {String} stateFile location where the state file should be saved
     */
    constructor(stateFile) {
        super()
        this.stateFile = stateFile
        /**
         * object containing [String, Boolean] pairs to store which plugins are persistently enabled
         * @type {object.<String, Boolean>}
         */
        this.persistentStates = {}
        this.loadPluginStates()
        this._client = null
    }

    /**
     * Add a plugin to the container.
     * @param {Plugin} plugin the plugin to add
     */
    add(plugin) {
        this.set(plugin.identifier, plugin)
    }
    
    loadPluginStates() {
        return new Promise((resolve)=>{
            try {
                fs.readFile(this.stateFile, (err, content) => {
                    if(err) {
                        if(err.code === "ENOENT") {
                        } else {
                            throw err                            
                        }
                    } else {
                        this.persistentStates = JSON.parse(content)
                    }
                    resolve()
                })
            } catch(err) {
                logger.error(`${err} occured while loading plugin states.`)
                resolve()
            }
        })
    }

    savePluginStates() {
        const jsonStr = JSON.stringify(this.persistentStates)
        fs.writeFile(this.stateFile, jsonStr, err => {
            if (err) {
                logger.error(`${err} occured while saving plugin states.`)
            }
        })
    }

    /**
     * Start a plugin by a given plugin identifier.
     * @param {String} identifier the plugin's identifier
     * @param {Boolean} persistent true if the plugin should run after a bot restart
     */
    startPlugin(identifier, persistent) {
        if(!this.has(identifier)) {
            return {success: false, msg: `Can't start: there is no plugin called '${identifier}'!`}
        }
        const plugin = this.get(identifier)
        if(persistent) {
            this.persistentStates[identifier] = true
            this.savePluginStates()
        }
        if(!plugin.running) {
            plugin._startPluginImpl(this._client)
            return {success: true}
        } else {
            return {success: false, msg: "Can't start: plugin is already running!"}
        }
    }

    /**
     * Stop a plugin by a given plugin identifier.
     * @param {String} identifier the plugin's identifier
     * @param {Boolean} persistent true if the plugin shouldn't run after a bot restart
     */
    stopPlugin(identifier, persistent) {
        if(!this.has(identifier)) {
            return {success: false, msg: `Can't stop plugin: there is no plugin called '${identifier}'!`}
        }
        const plugin = this.get(identifier)
        if(persistent) {
            this.persistentStates[identifier] = false
            this.savePluginStates()
        }
        if(plugin.running) {
            plugin._stopPluginImpl()
            return {success: true}
        } else {
            return {success: false, msg: "Can't stop plugin: plugin is not running!"}
        }
    }

    /**
     * Start all plugins besides those that were disabled by an entry in the 
     * [persistentStates object]{@link PluginContainer#persistentStates}.
     */
    startPlugins() {
        for(const [identifier, plugin] of this.entries()) {
            if(!this.getPersistentState(identifier)) continue
            if(!this.has(identifier)) {
                logger.warn(`Can't load plugin state: no plugin found for identifier ${identifier}!`)
                continue
            }
            if(!plugin.running) {
                plugin._startPluginImpl(this._client)
            }
        }
    }

    /**
     * Stop all currently running plugins.
     */
    stopPlugins() {
        for(const plugin of this.values()) {
            if(plugin.running) {
                plugin._stopPluginImpl()
            }
        }
    }

    getPersistentState(identifier) {
        return this.persistentStates[identifier] == null ? true : this.persistentStates[identifier]
    }

    set client(client) {
        this._client = client
    }
}
module.exports = PluginContainer