/**
 * Created by Mosh Mage on 11/25/2016.
 */
"use strict";
const Yanbi = require('../yanbi.js');

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

