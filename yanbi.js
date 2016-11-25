/**
 * Created by Mosh Mage on 11/25/2016.
 */

const IrcContext = require('./classes/irc-context.js');
const ModuleManager = require('./classes/module-manager.js');

class Yanbi {
    constructor(onReady) {
        const IrcConfig = require('./config/irc.config.js');
        const YanbiConfig = require('./config/yanbi.config.js');

        this.yanbiConfig = YanbiConfig;
        this.ircContext = new IrcContext(IrcConfig);
        try {
            this.moduleManager = new ModuleManager(this.ircContext.events, this.yanbiConfig, onReady);
        } catch (e) {
            console.log(e);
        }

    }
}

module.exports = Yanbi;