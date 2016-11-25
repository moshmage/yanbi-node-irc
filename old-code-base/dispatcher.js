/**
 * Created by Mosh Mage on 5/21/2016.
 */

var Eventer;
var Dispatcher;
Dispatcher = module.exports = function DISPATCHER() {
    'use strict';
    if (!(this instanceof DISPATCHER)) {
        return new DISPATCHER();
    }

    this.EVENTS = {};
    this.EVENTSNET = {};

};

function handleMessageToChannelEvent(nick, to, text) {
    var catchOnIndex;
    Eventer.HOOKS.EVENTSNET['message#'].forEach(function (action) {
        catchOnIndex = action.catchOnIndex || 0;
        if (text.indexOf(action.wordMatch) === catchOnIndex) {
            action.callback(nick, to, text);
        }
    });
}

function handleNamesEvent(channel, nicks) {
    Eventer.HOOKS.EVENTSNET['names'].forEach(function (action) {
        if (action.catchOnIndex === true) {
            nicks.forEach(function (nick) {
                if (nick === action.wordMatch) {
                    action.callback(nick);
                }
            });
        }

        if (action.wordMatch.toLowerCase() == channel.toLowerCase()) {
            action.callback(channel, nicks);
        }
    })
}

function joinPartHandle(eventType, channel, nick) {
    Eventer.HOOKS.EVENTSNET[eventType].forEach(function (action) {
        if (action.wordMatch === channel || action.wordMatch === nick) {
            action.callback(channel, nick);
        }
    })
}

function handleNoticeEvent(nick, to, text) {
    var catchOnIndex;
    Eventer.HOOKS.EVENTSNET['notice'].forEach(function (action) {
        catchOnIndex = action.catchOnIndex || 0;
        if (text.indexOf(action.wordMatch) === catchOnIndex || action.wordMatch === nick && nick.toLowerCase()) {
            action.callback(nick, to, text);
        }
    });
}

function handleJoinEvent(channel, nick) {
    joinPartHandle('join', channel, nick);
}

function handlePartEvent(channel, nick) {
    joinPartHandle('part', channel, nick);
}

Dispatcher.prototype.initialize = function (EventService) {
    Eventer = EventService;

    Eventer.createEventType('join', handleJoinEvent, false);
    Eventer.createEventType('part', handlePartEvent, false);
    Eventer.createEventType('names', handleNamesEvent, false);
    Eventer.createEventType('notice', handleNoticeEvent, false);
    Eventer.createEventType('message#', handleMessageToChannelEvent, false);
    
    Eventer.forceKeep(['join','part','names','notice','message#']);

};