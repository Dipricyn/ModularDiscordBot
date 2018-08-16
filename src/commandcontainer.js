class CommandContainer extends Map {

    constructor() {
        super()
    }

    add(command) {
        this.set(command.identifier, command)
    }
}
module.exports = CommandContainer