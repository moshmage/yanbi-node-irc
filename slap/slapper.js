/**
 * Created by Mosh Mage on 5/17/2016.
 */
'use strict';
var irc = require('irc');
var fs = require('fs');
var CONF = require('./config.js')();
var dice = require('rpg-dice');
var isNumeric = require("isnumeric");
var THAT = null;

var SLAPBOT = module.exports = function SLAPBOT() {
    if (!(this instanceof SLAPBOT)) {
        return new SLAPBOT();
    }

    this.RECORDS = JSON.parse(fs.readFileSync(CONF.CONST.RECORDS, 'UTF8'));
    this.ONCHANNEL = [];
    this.PUB = [];
    this.channelEvents = [];
    this.IGNORE = {};
    this.client = new irc.Client('irc.snoonet.org', CONF.CONST.MYNICK, { channels: ['#' + CONF.CONST.CHANNEL], debug: false });

};

SLAPBOT.prototype.stringToArray = function (string) {
    return string.trim().split(' ');
};

SLAPBOT.prototype.listenChannelMessage = function (what, callback) {
    THAT.channelEvents.push({
        wordMatch: what,
        callback: callback
    });
};

SLAPBOT.prototype.speakOut = function (text) {
    THAT.client.say('#' + CONF.CONST.CHANNEL, text);
};

SLAPBOT.prototype.speakIn = function (nick, text) {
    THAT.client.notice(nick, text);
};

SLAPBOT.prototype.isOnChannel = function (nickname) {
    return THAT.ONCHANNEL.some(function (name) {
        return name.toLowerCase() === nickname.toLowerCase();
    });
};

SLAPBOT.prototype.makeNewRecord = function (nick) {
    THAT.RECORDS[nick] = {
        health: CONF.PLAYERCONST.MAXHEALTH,
        coins: CONF.PLAYERCONST.MINCASH,
        str: CONF.PLAYERCONST.MINSTR,
        agi: CONF.PLAYERCONST.MINAGI,
        nick: nick,
        drunk: false,
        kills: 0,
        deaths: 0
    };

    return THAT.RECORDS[nick];
};

SLAPBOT.prototype.actionSlap = function (fromNick, message) {
    message = message.trim().split(' ');
    var slapped = message[1];
    var slap = {};
    
    if (!slapped) {
        THAT.speakOut(fromNick + ': the usage is ' + CONF.CONST.CMDTRIGGER + 'slap <nick>');
        return false;
    }

    if (!THAT.isOnChannel(slapped)) {
        THAT.speakOut(fromNick + ': user <' + slapped + '> isn\'t in the channel, totes not fair.');
        return false;
    }
    
    if (fromNick.toLowerCase() === slapped.toLowerCase()) {
        THAT.speakOut(fromNick + ': Why would you do that...');
        return false;
    }

    if (!THAT.RECORDS[fromNick]) {
        fromNick = THAT.makeNewRecord(fromNick);
    } else {
        fromNick = THAT.RECORDS[fromNick];
    }

    if (!THAT.RECORDS[slapped]) {
        slapped = THAT.makeNewRecord(slapped);
    } else {
        slapped = THAT.RECORDS[slapped];
    }

    if (slapped.health <= 0) {
        THAT.speakOut(fromNick + ': <' + slapped + '> is dead. use ' + CONF.CONST.CMDTRIGGER + 'heal <nick> to bring him back to life (15coins) ');
        return false;
    }
    
    if (dice.roll('1d6').result < dice.roll('1d6').result) {
        THAT.speakOut('*SWOOSH*');
        if (!fromNick.drunk && dice.roll('1d6').result === 1) {
            slap.damage = fromNick.drunk * CONF.CONST.DAMAGEFROMDRUNK;
            fromNick.health -= slap.damage;
            
            slap.moneyDrop = Math.floor((Math.random() * fromNick.coins / CONF.CONST.STEALDIVIDER) + 1);
            slapped.coins += slap.moneyDrop;
            fromNick.coins -= slap.moneyDrop;
            
            THAT.speakOut(fromNick.nick + ', The Jester, just fell on his own taking ' + slap.damage + ' from his drunkness');
            THAT.speakIn(slapped.nick, 'You spot some ' + slap.moneyDrop + 'coins coming from ' + fromNick.nick + 's\' pocket. You picked them.');
            if (fromNick.health <= 0) {
                THAT.speakOut('Oh.. Look! ' + fromNick.nick + ' fell to his death. lol.');
                THAT.speakIn(fromNick.nick, 'You.. just killed yourself, use !ress to comeback');
            }
            
            fromNick.drunk = false;
            THAT.RECORDS[fromNick.nick] = fromNick;
            THAT.RECORDS[slapped.nick] = slapped;
        }
        
        return true;
    } else {

        slap.crit = dice.roll('1d20').result === 20;
        slap.damage = dice.roll('1d6').result + fromNick.str;
        slap.moneyDrop = Math.floor((Math.random() * slapped.coins / CONF.CONST.STEALDIVIDER) + 1);

        if (fromNick.drunk !== false) {
            slap.damage += fromNick.drunk;
            if (fromNick.drunk > 10) {
                slap.damage *= 2;
            }

            fromNick.drunk = false;
        }
        
        if (slap.crit) {
            slap.damage += slap.damage + (Math.random() * 100);
            THAT.speakOut('WOW! Whattaslap!');
        }
        
        slapped.health -= slap.damage;

        slapped.coins -= slap.moneyDrop;
        fromNick.coins += slap.moneyDrop;
        
        THAT.speakOut(fromNick.nick + ' slaps <' + slapped.nick + '> for ' + slap.damage + 'hp');
        THAT.speakIn(fromNick.nick, 'you stole ' + slap.moneyDrop + 'coins from <' + slapped.nick + '>');
        THAT.speakIn(slapped.nick, 'stole ' + slap.moneyDrop + 'coins from your wallet');
        
        if (slapped.health < 0) {
            THAT.speakOut('Aaaaand that\'s a KO, ladies and gents! What a fine backhand!');
            slapped.deaths += 1;
            fromNick.kills += 1;
        }

        THAT.RECORDS[slapped.nick] = slapped;
        THAT.RECORDS[fromNick.nick] = fromNick;

    }

};

SLAPBOT.prototype.actionHeal = function (nick, message) {
    message = THAT.stringToArray(message);
    var healed = message[1] || nick;

    if (THAT.RECORDS[nick].coins < CONF.PRICE.HEALING) {
        THAT.speakOut(nick + ': you lack cash. you need 15 coins to heal someone.');
        return false;
    }

    if (!THAT.RECORDS[healed]) {
        healed = THAT.makeNewRecord(healed);
    }

    if (THAT.RECORDS[healed].health <= 0) {
        THAT.RECORDS[healed].health = CONF.PLAYERCONST.MAXHEALTH;
        THAT.RECORDS[nick].coins -= CONF.PRICE.HEALING;
    } else {
        THAT.speakOut(nick + ': <' + healed + '> is still kicking, no need to heal');
    }
};

SLAPBOT.prototype.actionSayMoneyStats = function (nick, message) {
    message = THAT.stringToArray(message);
    nick = message[1] || nick;
    var coins = THAT.RECORDS[nick] && THAT.RECORDS[nick].coins || 0;
    var daysPassed;
    
    if (!THAT.RECORDS[nick]) {
        THAT.makeNewRecord(nick);
    }
    
    if (THAT.RECORDS[nick].lastBank) {
        daysPassed = THAT.RECORDS[nick].lastBank - new Date().getTime() / CONF.CONST.DAY;
        if (daysPassed < 1) {
            THAT.speakOut(nick + ', bank\'s still closed for you.');
            return false;
        }
    }
    
    if (coins <= 0) {
        THAT.RECORDS[nick].coins = CONF.PLAYERCONST.MINCASH;
        coins = CONF.PLAYERCONST.MINCASH;
        THAT.speakIn(nick, 'You have new currency! 15coins. You\'ll be able to use !money again in 24hrs');
        THAT.RECORDS[nick].lastBank = new Date().getTime();
    }
    
    THAT.speakOut('<' + nick + '> has ' + coins + 'coins');
};

SLAPBOT.prototype.actionSayAvailCommands = function () {
    var string = '';
    THAT.channelEvents.forEach(function(object, index){
        string += object.wordMatch
        if (index < THAT.channelEvents.length - 1) {
            string += ', ';
        }
    });
    THAT.speakOut('SLAP Commands: ' + string);
};

SLAPBOT.prototype.actionGamble = function (nick, message) {
    message = THAT.stringToArray(message);
    var gambledMoney = parseInt(message[1],10);
    var gambleOption = parseInt(message[2],10);
    var randomChosenBox = Math.floor(Math.random() * CONF.CONST.BOXES) + 1;
    var gotTheBunny = dice.roll('1d20').result === 20;
    var prize = gambledMoney * CONF.CONST.GAMBLEMULTIPLIER;
    var wonMessage;
    
    nick = THAT.RECORDS[nick] || THAT.makeNewRecord(nick);
    
    if (!isNumeric(gambleOption) || !isNumeric(gambledMoney)) {
        THAT.speakOut('Sir, both arguments need to be numeric');
        return false;
    }
    
    if (gambleOption > CONF.CONST.BOXES || gambleOption === 0 || !gambleOption) {
        THAT.speakOut(nick.nick + ': !gamble <money> <1 ... ' + CONF.CONST.BOXES + '>');
        return false;
    }
    
    if (nick.coins < gambledMoney) {
        THAT.speakOut('Mate, you\'r short on cash.');
        return false;
    }
    
    if (gambleOption == randomChosenBox) {
        
        if (gotTheBunny) {
            prize = prize + THAT.RECORDS['-gambleTehBunny-'].coins;
            wonMessage = 'WOWOWOWWOWO!!111! ' + nick.nick + ' just won TEHBUNNY!';
            THAT.speakIn(nick.nick, 'Only the VIP get to get this, have a !beer');
            THAT.PUB.push(nick.nick);
            
            THAT.RECORDS[nick.nick].pub = setTimeout(function removeFromPub() {
                THAT.PUB.slice(THAT.PUB.indexOf(nick.nick), 1);
                if (THAT.isOnChannel(nick.nick)) {
                    THAT.speakIn(nick.nick, 'The pub has closed. !gamble again ;)');
                }
            }, 3600 * 1000);
            
            THAT.RECORDS['-gambleTehBunny-'].coins = 0;
            
        } else {
            wonMessage = 'Wow! ' + nick.nick + ' won the bet!';
        }
        
        nick.coins += prize;
        THAT.speakOut(wonMessage);
        THAT.speakIn(nick.nick, 'You won ' + prize + 'coins');
        THAT.RECORDS[nick.nick] = nick;
        
    } else {
        THAT.RECORDS['-gambleTehBunny-'].coins += parseInt(gambledMoney,10);
        THAT.speakOut('Better luck next time, ' + nick.nick + '.');
        THAT.speakOut('tehBunny value is ' + THAT.RECORDS['-gambleTehBunny-'].coins + 'coins.');
        nick.coins -= gambledMoney;
    }

};

SLAPBOT.prototype.actionSayStats = function (nick, message) {
    message = THAT.stringToArray(message);
    nick = THAT.RECORDS[message[1]] || THAT.RECORDS[nick] || THAT.makeNewRecord(nick);
    THAT.speakOut(nick.nick + ' Kills: ' + nick.kills + ', Deaths: ' + nick.deaths + ', Coins: ' + nick.coins);
};

SLAPBOT.prototype.actionSayLadder = function () {
    var ladder = [];
    var score; var string;
    
    Object.keys(THAT.RECORDS).forEach(function (nickname, index) {
        if (THAT.RECORDS[nickname].kills < THAT.RECORDS[nickname].deaths) {
            score = (THAT.RECORDS[nickname].kills - (0.5 * THAT.RECORDS[nickname].deaths)) * THAT.RECORDS[nickname].coins / 100;
        } else {
            score = (THAT.RECORDS[nickname].kills - THAT.RECORDS[nickname].deaths) * THAT.RECORDS[nickname].coins / 100;
        }
        
        if (score > 0) {
            ladder.push({nick: nickname, score: score});
        }
    });
    
    if (ladder.length === 0) {
        THAT.speakOut('Wow. There\'s no ladder. Either everyone sucks at this or noone played yet.');
        return false;
    }
    
    ladder.sort(function (a, b){
        if (a.score > b.score) {
            return 1;
        }
        
        if (a.score < b.score) {
            return -1;
        }
        return 0;
    });

    ladder.forEach(function (object, index) {
        string += object.nick + ': ' + object.score;
        if (index < ladder.length -1) {
            string += ', ';
        } else {
            string += '.';
        }
    });
    
    THAT.speakOut('SLAP LADDER: ' + string);

};

SLAPBOT.prototype.actionDrinkBeer = function (nick, message) {
    message = THAT.stringToArray(message);
    var amount = message[2] || 1;
    var costs = amount * CONF.PRICE.BEER
    var fromNick = nick;
    
    nick = THAT.RECORDS[message[1]] || THAT.RECORDS[nick] || THAT.makeNewRecord(nick);

    if (THAT.PUB.indexOf(nick.nick) < 0) {
        THAT.speakOut('Members only...');
        return false;
    }
    
    if (!isNumeric(amount)) {
        THAT.speakOut('How many is that again, sir?');
        return false;
    }
    
    if (nick.coins <= costs) {
        THAT.speakOut('I\'m not serving a moneyless bum!');
        THAT.speakIn(fromNick, 'You still have <time>m of Pub access');
        return false;
    }

    nick.drunk = (nick.drunk === false) ? 0 : nick.drunk;
    nick.coins -= costs;
    THAT.RECORDS['-gambleTehBunny-'].coins += costs;
    nick.drunk += amount;
    
    if (fromNick !== nick.nick) {
        THAT.speakOut(fromNick + ' got some beers to ' + nick.nick);
    } else {
        THAT.speakOut('Drunkard notice: If you fall, you\'ll die. Please, don\'t drink and slap.');
    }
    THAT.speakIn(fromNick,'You lost ' + costs + 'coins to tehBunny');
    
};

SLAPBOT.prototype.updateOnChannel = function (channel, nicks) {
    THAT.ONCHANNEL = [];
    
    Object.keys(nicks).forEach(function (nickname) {
        if (nickname !== CONF.CONST.MYNICK) {
            THAT.ONCHANNEL.push(nickname);
        }
    });
};

SLAPBOT.prototype.addUserToChannel = function (nick) {
    if (nick.toLowerCase() === CONF.CONST.MYNICK.toLowerCase()) {
        return false;
    }

    THAT.ONCHANNEL.push(nick);
};

SLAPBOT.prototype.removeUserFromChannel = function (nick) {
    var index = this.ONCHANNEL && this.ONCHANNEL.indexOf(nick);
    if (index === -1 || false) {
        return false;
    }

    THAT.ONCHANNEL.slice(index, 1);
};

SLAPBOT.prototype.startListening = function startListening() {
    
    THAT = this;
    this.channelEvents.push({wordMatch: CONF.CONST.CMDTRIGGER + 'slap', callback: this.actionSlap});
    this.channelEvents.push({wordMatch: CONF.CONST.CMDTRIGGER + 'ress', callback: this.actionHeal});
    this.channelEvents.push({wordMatch: CONF.CONST.CMDTRIGGER + 'beer', callback: this.actionDrinkBeer});
    this.channelEvents.push({wordMatch: CONF.CONST.CMDTRIGGER + 'money', callback: this.actionSayMoneyStats});
    this.channelEvents.push({wordMatch: CONF.CONST.CMDTRIGGER + 'stats', callback: this.actionSayStats});
    this.channelEvents.push({wordMatch: CONF.CONST.CMDTRIGGER + 'gamble', callback: this.actionGamble});
    this.channelEvents.push({wordMatch: CONF.CONST.CMDTRIGGER + 'ladder', callback: this.actionSayLadder});
    this.channelEvents.push({wordMatch: CONF.CONST.CMDTRIGGER + 'thegame', callback: this.actionSayAvailCommands});

    this.client.addListener('message#' + CONF.CONST.CHANNEL, function(nick, message) {
        var minsPassed;
        
        if (message.indexOf(CONF.CONST.CMDTRIGGER) === 0) {
            if (!THAT.IGNORE[nick]) {
                THAT.IGNORE[nick] = { 
                    warned: false,
                    count: 1
                };
            } else {
                if (THAT.IGNORE[nick].count > CONF.FLOOD.MAXCMDS) {
                    if (!THAT.IGNORE[nick].warned) {
                        THAT.speakIn(nick, 'You are on a cooldown, chill :)');
                    }
                    return false;
                }
            }
            
            THAT.channelEvents.forEach(function (object) {
                if (message.indexOf(object.wordMatch) === 0) {
                    object.callback(nick, message);
                    
                    THAT.IGNORE[nick].warned = false;
                    THAT.IGNORE[nick].count += 1;
                    
                    if (THAT.IGNORE[nick].count > CONF.FLOOD.MAXCMDS) {
                        THAT.IGNORE[nick].count = CONF.FLOOD.INCREASE;
                    }
                    
                    console.log({event: object.wordMatch, nick: nick, date: new Date().getTime()});
                }
            });
        }
    });

    this.client.addListener('names', this.updateOnChannel);
    this.client.addListener('join#' + CONF.CONST.CHANNEL, this.addUserToChannel);
    this.client.addListener('part#' + CONF.CONST.CHANNEL, this.removeUserFromChannel);
    
    this.client.addListener('registered', function () {
        console.log('Hooked :)');
    });
    
    this.client.addListener('error', function(message) {
        console.log('error: ', message);
    });
    
    setInterval(function () {
      fs.writeFile(CONF.CONST.RECORDS, JSON.stringify(THAT.RECORDS), function (err) {
        if (err) {
          console.log('Error writing to file');
        } else {
          console.log('Wrote to results file. ');
        }
      });
    }, CONF.CONST.BACKUP);
    
    setInterval(function () {
        Object.keys(THAT.IGNORE).forEach(function(name) {
            if (THAT.IGNORE[name].count > 0) {
                THAT.IGNORE[name].count -= 1;
            }
        });
    }, CONF.FLOOD.BETWEENMS);
    
};