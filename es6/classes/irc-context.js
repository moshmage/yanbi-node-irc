/**
 * Created by Mosh Mage on 11/25/2016.
 */
import {defaultHooks} from 'helpers/default-hooks.js'; 

export class IrcContext {
    constructor(irc, ircConfig) {
        this.client = irc.Client(ircConfig.server, ircConfig.nick, ircConfig);
        this.client.addListener('error', (message) => console.log(message));
        this.events = new Events();

        defaultHooks.create(this.events);
    }
}
