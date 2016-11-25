/**
 * Created by Mosh Mage on 11/25/2016.
 */
const irc = require('irc');
const IrcContext = require('./classes/irc-context.js');
const ModuleManager = require('./classes/module-manager.js');

class Yanbi {
    constructor(onReady) {
        const IrcConfig = require('./config/irc.config.js');
        const YanbiConfig = require('./config/yanbi.config.js');

        this.yanbiConfig = YanbiConfig;
        this.ircContext = new IrcContext(irc, IrcConfig);
        this.moduleManager = new ModuleManager(this.ircContext.events, this.yanbiConfig, onReady);
    }
}

module.exports = Yanbi;