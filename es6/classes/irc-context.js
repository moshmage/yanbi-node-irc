/**
 * Created by Mosh Mage on 11/25/2016.
 */
"use strict";
export class IrcContext {
    constructor(irc, ircConfig) {
        this.client = irc.Client(ircConfig.server, ircConfig.nick, ircConfig);
        this.client.addListener('error', (message) => console.log(message));
        this.events = new Events();
    }
}
