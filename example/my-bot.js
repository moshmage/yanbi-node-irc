/**
 * Created by Mosh Mage on 11/25/2016.
 */

const Yanbi = require('../old-code-base/yanbi');
const yanbi = new Yanbi();


/**
 * Answering to "hello" at the start of the sentences
 */
yanbi.ircContext.events.listen('message#',"hello", (nick, to, text) => {
    "use strict";
    if (text.indexOf('world') < 0) yanbi.ircContext.client.say(to, `WORLD! world is what you should say ${nick}`);
    else yanbi.ircContext.client.say(to, `yo! ${nick} knows his dev memes :)`);
});

/**
 * Counting joins and parts and welcoming user
 */
let joins = 0; let parts = 0;
yanbi.ircContext.events.listen('join',"#channel", (channel, nick) => {
    "use strict";
    yanbi.ircContext.client.say(channel, `welcome, ${nick}. People joined this channel ${++joins} times.`)
});
yanbi.ircContext.events.listen('part',"#channel", (channel, nick) => {
    "use strict";
    yanbi.ircContext.client.say(channel, `... and left ${++parts} times. There goes ${nick}..`);
});

/**
 * checking for Nick to join in *any* channel we are in
 */
yanbi.ircContext.events.listen('join',"Nick", (channel, nick) => {
    "use strict";
    yanbi.ircContext.client.say(channel, `... have you been following me, ${nick}?`);
});

/**
 * Checking if Nick sends as a /notice saying hello
 */
yanbi.ircContext.events.listen('notice',"Nick", (nick, me, text) => {
    "use strict";
    if (text.indexOf('hello') > -1) yanbi.ircContext.events.notice(nick, `hi, ${nick}.`);
    else yanbi.ircContext.client.notice(nick, `sup, ${nick}`);
});

/**
 * checking if a /notice by anyone starts with "hello"
 */
yanbi.ircContext.events.listen('notice',"hello", (nick, me, text) => {
    "use strict";
    yanbi.ircContext.client.notice(nick, `hi, ${nick}.`);
});

/**
 * checking if Nick is a channel we join
 * *place: true MUST be used*
 * this is the only use case where `place` is not a number.
 */
yanbi.ircContext.events.listen('names',{place: true, word: "Nick"}, (channel, nicks, nick) => {
    "use strict";
    yanbi.ircContext.client.say(channel, `hi, ${nick}, you're in my ${channel}.`);
});

/**
 * checking who joins a channel where you are at
 */
yanbi.ircContext.events.listen('names',"#channel", (channel, nicks, nick) => {
    "use strict";
    let totalPeople = nicks.length;
    yanbi.ircContext.client.say(channel, `wow! there's ${totalPeople} nicks in my ${channel} :D`);
    yanbi.ircContext.client.say(channel, `but.. ${nick} is the special one`);
});