

module.exports = class PluginContainer {

    constructor() {
        this.plugins = new Map()
    }

    add(plugin) {
        this.plugins.set(plugin.identifier, plugin)
    }

    get(identifier) {
        return this.plugins.get(identifier)
    }
    
    has(identifier) {
        return this.plugins.has(identifier)
    }

    [Symbol.iterator]() {
        return this.plugins.entries()
    }
}