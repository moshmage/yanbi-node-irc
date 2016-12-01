/**
 * Created by Mosh Mage on 11/25/2016.
 */
"use strict";
class DefaultHooks {
    constructor() {
        this.events = null;
    }
    
    create(events) {
        this.events = events;
        this.events.addType('join', (channel, nick) => this.handleJoinEvent(channel, nick), false);
        this.events.addType('part', (channel, nick) => this.handlePartEvent(channel, nick), false);
        this.events.addType('names', (channel, nicks) => this.handleNamesEvent(channel, nicks), false);
        this.events.addType('notice', (nick, to, text) => this.handleNoticeEvent(nick, to, text), false);
        this.events.addType('message#', (nick, to, text) => this.handleMessage('message#', nick, to, text), false);
        this.events.addType('pm', (nick, to, text) => this.handleMessage('pm', nick, to, text), false);

    }

    callJoinPartChilds(type, channel, nick) {
        if (nick === this.events.client.nick) console.log(`Info: self joined ${channel}`);
        this.events.getChilds(type).forEach(event => {
            if (event.onIndex === true && event.matches(nick)
                || event.matches(channel)) {
                event.callback(channel, nick);
            }
        });
    }

    handleNamesEvent(channel, nicks) {
        this.events.getChilds('names').forEach(event => {
            if (event.onIndex === true) {
                Object.keys(nicks).some(nick => {
                    if (event.matches(nick, false)) {
                        event.callback(channel, nicks, nick);
                        return true
                    }
                });
            } else if (event.matches(channel)) {
                event.callback(channel, nicks);
            }
        });
    }

    handleNoticeEvent(nick, to, text) {
        this.events.getChilds('notice').forEach(event => {
            if (event.onIndex === true && event.matches(nick)
                || event.matches(text, true)) {
                event.callback(nick, to, text);
            }
        });
    }

    /**
     * Finds <word|a phrase> ({string} value) in received message
     * callsback with "nick", "to" and "text" as arguments;
     * note: TO might be "text" if you're listening on 'pm'
     * 
     * this.event.listen('message#', {word:'!hello', place: 0}, (nick, to, text) => {})
     * ------ 
     * @param nick      nick of sender
     * @param to        channel or (your) nick if PM
     * @param text      text from message
     */
    handleMessage(type, nick, to, text) {
        this.events.getChilds(type).forEach(event => {
            if (event.onIndex === true && event.matches(nick)
                || event.matches(text, true)) {
                event.callback(nick, to, text);
            }
        })
    }

    handleJoinEvent(channel, nick) { this.callJoinPartChilds('join', channel, nick)  }
    handlePartEvent(channel, nick) { this.callJoinPartChilds('part', channel, nick)  }
}

const defaultHooks = new DefaultHooks();
module.exports = defaultHooks;