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
        this.events.addType('join', this.handleJoinEvent, false);
        this.events.addType('part', this.handlePartEvent, false);
        this.events.addType('names', this.handleNamesEvent, false);
        this.events.addType('notice', this.handleNoticeEvent, false);
        this.events.addType('message#', this.handleMessageFromChannel, false);
    }

    callJoinPartChilds(type, channel, nick) {
        this.events.getChilds(type).forEach(event => {
            if (event.matches(channel) || event.matches(nick)) {
                event.callback(channel, nick);
            }
        });
    }

    handleNamesEvent(channel, nicks) {
        this.events.getChilds('names').forEach(event => {
            if (event.onIndex === true) {
                nicks.some(nick => {
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
            if (event.matches(text, true) || event.matches(nick)) {
                event.callback(nick, to, text);
            }
        });
    }

    handleMessageFromChannel(nick, to, text) {
        this.events.getChilds('message#').forEach(event => {
            if (event.matches(text, true)) {
                event.callback(nick, to, text);
            }
        })
    }

    handleJoinEvent(channel, nick) { this.callJoinPartChilds('join', channel, nick)  }
    handlePartEvent(channel, nick) { this.callJoinPartChilds('part', channel, nick)  }
}

const defaultHooks = new DefaultHooks();
module.export = defaultHooks;