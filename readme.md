# YANBI
### Yet Another Node-IRC Bot Implementation
---
tl;dr YANBI aims to be a moduler on top of [irc](https://www.npmjs.com/package/irc). It should be easier to write bots.

### Initializing
create a `yanbi.config.json` file with
```
{
  "modulesPath": "path/to/yanbi/modules/",
  "owner": "bot-owner"
}
```
and a `irc.config.json` with (at least)
```
{
  "server": "irc.snoonet.org",
  "nick": "yanbi",
  "channels": ["#yanbi"]
}
```
then issue `npm install yanbi --save`, create a `bot.js` and type
```
const Yanbi = require('yanbi');
```



### What's that about modules?
A Yanbi module is the same as it was on previous versions: a simple way for us to organize bot-scripts.
A simple `Greeter` example:
```
class Greeter {
    constructor(events) {
        this.name = "Greeter";
        this.version = "1.0";
        this.author = "moshmage@gmail.com";

        this.events = events;
        this.events.listen('join', '#yanbi', (channel, nick) => this.greetNick(channel, nick));
    }

    initialize() {}
    rehasher() {}

    greetNick(channel, nick) {
        this.events.client.say(channel, `Hello, ${nick}`);
    }
}

module.exports = Greeter;
```

Paste that under the `modulesPath` you configured.
Go into the console and issue `node bot.js`, hop on the same server and channel and you should see your bot.

*note: `initializer()` and `rehasher()` functions are mandatory and will be called uppon said states*
*`name` `version` and `author` are used for console.log purposes*

This file will be loaded by `ModuleManager` and given an `Event` context when loaded (via new!).

### This.events
Avoid using `irc.addListener` so we don't bloat the Event Emitter; That way we free it
to actually do stuff that matters (sending and receiving messages) while we let the Event arrays do the logical
work.

To do so, you `addType` events, really just a mask for the unique `addListener` of that kind, and then you `listen` on that same time for "events".

### Even Simpler Example?

```
const Yanbi = require('yanbi.js');

function onReady(events) {
    "use strict";

    /**
     * Answering to "hello" at the start of the sentences
     */
    events.listen('message#',"hello", (nick, to, text) => {
        "use strict";
        if (text.indexOf('world') < 0) events.client.say(to, `WORLD! world is what you should say ${nick}`);
        else events.client.say(to, `yo! ${nick} knows his dev memes :)`);
    });

    /**
     * Counting joins and parts and welcoming user
     */
    let joins = 0; let parts = 0;
    events.listen('join',"#channel", (channel, nick) => {
        "use strict";
        events.client.say(channel, `welcome, ${nick}. People joined this channel ${++joins} times.`)
    });

    events.listen('part',"#channel", (channel, nick) => {
        "use strict";
        events.client.say(channel, `... and left ${++parts} times. There goes ${nick}..`);
    });

    /**
     * checking for Nick to join in *any* channel we are in
     */
    events.listen('join',"Nick", (channel, nick) => {
        "use strict";
        events.client.say(channel, `... have you been following me, ${nick}?`);
    });

    /**
     * Checking if Nick sends as a /notice saying hello
     */
    events.listen('notice',"Nick", (nick, me, text) => {
        "use strict";
        if (text.indexOf('hello') > -1) events.notice(nick, `hi, ${nick}.`);
        else events.client.notice(nick, `sup, ${nick}`);
    });

    /**
     * checking if a /notice by anyone starts with "hello"
     */
    events.listen('notice',"hello", (nick, me, text) => {
        "use strict";
        events.client.notice(nick, `hi, ${nick}.`);
    });

    /**
     * checking if Nick is a channel we join
     * *place: true MUST be used*
     * this is the only use case where `place` is not a number.
     */
    events.listen('names',{place: true, word: "Nick"}, (channel, nicks, nick) => {
        "use strict";
        events.client.say(channel, `hi, ${nick}, you're in my ${channel}.`);
    });

    /**
     * checking who joins a channel where you are at
     */
    events.listen('names',"#channel", (channel, nicks, nick) => {
        "use strict";
        let totalPeople = nicks.length;
        events.client.say(channel, `wow! there's ${totalPeople} nicks in my ${channel} :D`);
        events.client.say(channel, `but.. ${nick} is the special one`);
    });

}

const yanbi = new Yanbi(onReady);
```

### Event Hooking, Creating an Defaults
By default, ModuleManager is in charge of creating has the following hooks
- join
- part
- names
- notice
- message#

To access events on these types, use the `this.events.listen()` function inside your module (or `events` if you're directly using the `onReady` function).

#### Creating new events
```
this.events.addType('message#mychannel', (from, message) => {
    if (message.indexOf('ho ho ho') > -1 || from == "Santa") {
        this.events.client.say('Go and find Rudolf!');
    }
})
```

Remember, YANBI is a moduler on top of node-irc, so we have the exact same events available as in node-irc. In time, I'll add one or another I'm thinking are missing - as well as auto-authentication.