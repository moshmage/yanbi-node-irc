/**
 * Created by Mosh Mage on 11/25/2016.
 */
class Greeter {
    constructor(events) {
        this.name = "Greeter";
        this.version = "1.0";
        this.author = "moshmage@gmail.com";
        this.events = null;
    }

    initialize(events) {
        this.events = events;
        this.events.listen('join', '#yanbi', this.greetNick);
    }

    rehasher() {}

    greetNick(channel, nick) {
        this.events.client.say(channel, `Hello, ${nick}`);
    }
}

module.exports = Greeter;