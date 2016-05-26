/**
 * Created by Mosh Mage on 5/21/2016.
 */
var Eventer;

/**
 * @param IrcLib    require('irc')
 * @param IrcConf   {object}        {channelArray: [], selfNickname: 'string', debug: false, server: 'string' }
 */
Eventer = module.exports = function Eventer(IrcLib, IrcConf) {
    'use strict';
    var self = {
        EVENTS : {},
        EVENTSNET : {},
        conf : {}
    };

    var client = new IrcLib.Client(IrcConf.server, IrcConf.selfNickname, {
        channels: IrcConf.channelsArray,
        debug: IrcConf.debug
    });

    client.addListener('error', function (message) {
        console.log('error: ', message);
    });

    /**
     * Adds a new Parent Event as EventListener of Irc.Client() object
     *
     * @param eventType {string}    the event you want to catch
     * @param callback {function}   a callback function to be invoked
     * @param once     {boolean}    if true, `once` is used instead of `addListener` and no eventType (or NET) is created
     *
     * @returns {boolean}           true if successful
     */
    var createEventType = function (eventType, callback, once) {
        if (typeof self.EVENTS[eventType] === "function" && !once) {
            return false;
        }
        if (!once) {
            self.EVENTS[eventType] = callback;
            self.EVENTSNET[eventType] = [];
            client.addListener(eventType, self.EVENTS[eventType]);
        } else {
            client.once(eventType, callback);
        }

        return true;
    };

    /**
     * Creates a new child-event within the EventListner created by @Eventer.createEvent
     *
     * @param eventType {string}    The event you want to hook to
     * @param wordMatch {object}    The string you want to listen to and the index is supposed to be at
     *          {word: "string",
 *           place: 0}
     * @param callback              a callback function to be invoked
     * @returns {boolean}           returns false if the Parent Event does not exist
     */
    var catchEvent = function (eventType, wordMatch, callback) {
        if (!self.EVENTS[eventType] || !wordMatch || !callback) {
            return false;
        }

        self.EVENTSNET[eventType].push({
            wordMatch: wordMatch && wordMatch.word || wordMatch,
            catchOnIndex: wordMatch && wordMatch.place || 0,
            callback: callback
        });
    };

    /**
     * Removes a child event from the list
     * @param eventType {string}
     * @param wordMatch {string}
     * @param removeAll {boolean}   true = removes all child events that match
     * @returns {boolean}
     */
    var releaseEvent = function (eventType, wordMatch, removeAll) {
        var found, childMatchWord;
        if (!self.EVENTS[eventType]) {
            return false;
        }

        self.EVENTSNET[eventType].some(function(object, index){
            childMatchWord = object.wordMatch && object.wordMatch.word || object.wordMatch;
            if (childMatchWord === wordMatch) {
                found = index;
                if (!removeAll) return true;
            }
        });

        if (self.EVENTSNET[eventType].length === 0) {
            client.removeListener(eventType, self.EVENTS[eventType]);
            delete self.EVENTS[eventType];
            return true;
        }


        if (found >= 0) {
            self.EVENTSNET[eventType].splice(found,1);
            return true;
        }

        return false;
    };

    return {
        HOOKS: self,
        client: client,
        releaseEvent: releaseEvent,
        catchEvent: catchEvent,
        createEventType: createEventType
    }
};

