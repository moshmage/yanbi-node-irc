/**
 * Created by Mosh Mage on 11/25/2016.
 */
"use strict";
const irc = require('irc');
const Events = require('./events.js');

class IrcContext {
    constructor(ircConfig) {
        if (!irc.Client) throw Error('Provided IRC Module does not appear to be a node-irc');
        this.ircConfig = ircConfig;
        this.client = new irc.Client(ircConfig.server, ircConfig.nick, ircConfig);
        this.events = new Events(this.client);
        
    }
}
module.exports = IrcContext;