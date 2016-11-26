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

        if (!this.matchString) throw Error('Event needs a matchString parameter of type string string or object of {word: string, place: number}');
    }

    matches(input, withIndex) {
        input = new RegExp(input,'i');
        if (!withIndex) return this.matchString.search(input) > -1;
        return this.matchString.search(input) === this.onIndex;
    }
}

class Events {
    constructor(client) {
        this.parent = {};
        this.childs = {};
        this.client = client;
        this.client.addListener('error', (message) => {
            console.log('Error:', message);
        });
    }

    /**
     * Adds a Parent Event as EventListener of Irc.Client() object
     * @param eventName {string}
     * @param callback {function}
     * @param once {boolean}        use .once instead of addListener
     * @void
     */
    addType(eventName, callback, once) {
        if (typeof this.parent[eventName] === 'EventType' && !once) return false;

        if (once) {
            this.client.once(eventName, callback);
        } else {
            this.parent[eventName] = new EventType(eventName, callback);
            this.childs[eventName] = [];
            this.client.addListener(eventName, this.parent[eventName].callback);
        }
        console.log(`Info: Created ${eventName} type: ${(once) ? 'once' : 'forever'}`);
    }

    /**
     * Removes a Type Event and its children
     * @param eventName {string}
     * @param callback {Function}
     */
    removeType(eventName, callback) {
        if (this.created(eventName)) {
            this.client.removeListener(eventName);
            delete this.parent[eventName];
            delete this.childs[eventName];
        }

        if (callback) callback({
            removed: !this.created(eventName),
            type: eventName
        });
    }

    /**
     * Creates a new Child Event inside the Event Type
     * @param eventName {string}
     * @param matchObject {string|object}          "string" or {word: "string", place: 0}
     * @param callback {Function}
     * @void
     */
    listen(eventName, matchObject, callback) {
        if (!this.created(eventName)) throw Error(`No such EventType: ${eventName}`);
        let event = new Event(matchObject, callback);
        this.childs[eventName].push(event);
        // console.log(`Info: on ${eventName} -> ${event.matchString} @ ${event.onIndex}`);
    }

    /**
     * releases a previously hooked event
     * @param eventName {string}
     * @param matchObject {string|object}          "string" or {word: "string", place: 0}
     * @param allFromType {boolean}
     */
    mute(eventName, matchObject, allFromType) {
        if (!this.created(eventName)) throw Error(`No such EventType: ${eventName}`);
        let count = 0;
        if (allFromType) {
            this.childs[eventName] = [];
        } else {
            this.childs[eventName].forEach((event, index) => {
                let match = matchObject && matchObject.word || matchObject;
                let onIndex = matchObject && matchObject.place || 0;
                if (event.matchString === match && event.onIndex === onIndex) {
                    this.childs.splice(index, 1);
                    count++;
                }
            });
        }

        console.log(`Info: Removed ${(allFromType) ? 'all' : count} from ${eventName} when ${matchObject}`);
    }

    created(eventName) { return this.parent[eventName] instanceof EventType };

    getType(eventName) { return this.created(eventName) && this.parent[eventName]; }
    getChilds(eventName) { return this.childs[eventName]; }
}

module.exports = Events;