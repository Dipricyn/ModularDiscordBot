module.exports = class CommandContainer {

    constructor() {
        this.commands = new Map()
    }

    add(command) {
        this.commands.set(command.identifier, command)
    }

    get(identifier) {
        return this.commands.get(identifier)
    }
    
    has(identifier) {
        return this.commands.has(identifier)
    }

    [Symbol.iterator]() {
        return this.commands.entries()
    }
}