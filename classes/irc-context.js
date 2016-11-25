/**
 * Created by Mosh Mage on 11/25/2016.
 */
const irc = require('irc');
const defaultHooks = require('./helpers/default-hooks.js'); 
const Events = require('./events.js');

class IrcContext {
    constructor(ircConfig) {
        if (!irc.Client) throw Error('Provided IRC Module does not appear to be a node-irc');
        this.ircConfig = ircConfig;
        this.client = new irc.Client(ircConfig.server, ircConfig.nick, ircConfig);
        this.events = new Events(this.client);
        defaultHooks.create(this.events);
    }
}
module.exports = IrcContext;