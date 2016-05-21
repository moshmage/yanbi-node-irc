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
            action.callback(nick, text);
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
        
        if (action.wordMatch === channel) {
            action.callback(channel, nicks);
        }
    })
}

function joinPartHandle(eventType, channel, nick) {
    Eventer.HOOKS.EVENTSNET[eventType].forEach(function (action) {
        if (action.wordMatch === channel || action.wordMatch === nick) {
            console.log('sending callback');
            action.callback(channel, nick);
        }
    })
}

function handleJoinEvent(channel, nick) {
    joinPartHandle('join', channel, nick);
}

function handlePartEvent(channel, nick) {
    joinPartHandle('part', channel, nick);
}

Dispatcher.prototype.initialize = function (EventService) {
    Eventer = EventService;

    Eventer.createEventType('join', handleJoinEvent);
    Eventer.createEventType('part', handlePartEvent);
    Eventer.createEventType('names', handleNamesEvent);
    // Eventer.createEventType('message#', handleMessageToChannelEvent);

};