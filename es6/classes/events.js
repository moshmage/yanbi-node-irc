/**
 * Created by Mosh Mage on 11/25/2016.
 */
class EventType {
    constructor(type, callback) {
        this.type = type;
        this.callback = callback;
    }
}

class Event {
    constructor(matchObject, callback) {
        if (!matchObject || !callback) throw Error('new Event: Missing some arguments');
        this.matchString = matchObject && matchObject.word || matchObject;
        this.onIndex = matchObject && matchObject.place || 0;
        this.callback = callback;

        if (!this.match) throw Error('Event needs a match parameter of type string string or object of {word: string, place: number}');
    }
}

export class Events {
    constructor(client) {
        this.typeList = {};
        this.typeEvents = {};
        this.client = client;
    }

    /**
     * Adds a Parent Event as EventListener of Irc.Client() object
     * @param eventType {string}
     * @param callback {function}
     * @param once {boolean}        use .once instead of addListener
     * @returns {boolean}           false if eventType
     */
    addType(eventType, callback, once) {
        if (typeof this.typeList[eventType] === 'EventType' && !once) return false;

        if (once) {
            this.client.once(eventType, callback);
            return true;
        }

        this.typeList[eventType] = new EventType(eventType, callback);
        this.typeEvents[eventType] = [];
        this.client.addListener(eventType, this.eventTypes[eventType].callback);
        return true;
    }

    /**
     * Removes a Type Event and its children
     * @param eventType {string}
     * @param callback {Function}
     */
    removeType(eventType, callback) {
        if (this.created(eventType)) {
            this.client.removeListener(eventType);
            delete this.typeList[eventType];
            delete this.typeEvents[eventType];
        }

        if (callback) callback({
            removed: !this.created(eventType),
            type: eventType
        });
    }

    /**
     * Creates a new Child Event inside the Event Type
     * @param eventType {string}
     * @param matchObject {string|object}          "string" or {word: "string", place: 0}
     * @param callback {Function}
     * @void
     */
    listen(eventType, matchObject, callback) {
        if (!this.created(eventType)) throw Error(`No such EventType: ${eventType}`);
        this.typeEvents[eventType].push(new Event(matchObject, callback));
    }

    /**
     * releases a previously hooked event
     * @param eventType {string}
     * @param matchObject {string|object}          "string" or {word: "string", place: 0}
     * @param allFromType {boolean}
     */
    mute(eventType, matchObject, allFromType) {
        if (!this.created(eventType)) throw Error(`No such EventType: ${eventType}`);

        if (allFromType) {
            this.typeEvents[eventType] = [];
            return;
        }

        this.typeEvents[eventType].forEach((event, index) => {
            let match = matchObject && matchObject.word || matchObject;
            let onIndex = matchObject && matchObject.place || 0;
            if (event.matchString === match && event.onIndex === onIndex) {
                this.typeEvents.splice(index, 1);
            }
        });
    }

    created(eventType) {return typeof this.typeList[eventType] === 'EventType'};
}
