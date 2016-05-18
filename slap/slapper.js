/**
 * Created by Mosh Mage on 5/17/2016.
 */
'use strict';
var irc = require('irc');
var fs = require('fs');
var CONF = require('./config.js')();
var dice = require('rpg-dice');
var THAT = null;

var SLAPBOT = module.exports = function SLAPBOT() {
    if (!(this instanceof SLAPBOT)) {
        return new SLAPBOT();
    }

    this.RECORDS = JSON.parse(fs.readFileSync(CONF.CONST.RECORDS, 'UTF8'));
    this.ONCHANNEL = [];
    this.PUB = [];
    this.client = new irc.Client('irc.snoonet.org', CONF.CONST.MYNICK, { channels: ['#' + CONF.CONST.CHANNEL], debug: true });

};

SLAPBOT.prototype.stringToArray = function (string) {
    return string.trim().split(' ');
};

SLAPBOT.prototype.listenChannelMessage = function (on, what, callback) {
    THAT.client.addListener('message#' + on, function(nick, message) {
        if (message.indexOf(what) === 1) {
            callback(nick, message);
        }

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
    }

    if (!THAT.RECORDS[slapped]) {
        slapped = THAT.makeNewRecord(slapped);
    }

    if (slapped.health <= 0) {
        THAT.speakOut(fromNick + ': <' + slapped + '> is dead. use ' + CONF.CONST.CMDTRIGGER + 'heal <nick> to bring him back to life (15coins) ');
        return false;
    }

    if (dice.roll('1d6').result < dice.roll('1d6').result) {
        THAT.speakOut('*SWOOSH*');
        if (fromNick.drunk !== false && dice.roll('1d6').result === 1) {
            slap.damage = fromNick.drunk * CONF.CONST.DAMAGEFROMDRUNK;
            fromNick.health -= slap.damage;
            THAT.speakOut(fromNick.nick + ', The Jester, just fell on his own taking ' + slap.damage + ' from his drunkness');
            if (fromNick.health <= 0) {
                THAT.speakOut('Oh.. Look! ' + fromNick.nick + ' fell to his death. lol.');
                THAT.speakIn(fromNick.nick, 'You.. just killed yourself, use !ress to comeback');
            }
            
            fromNick.drunk = false;
            THAT.RECORDS[fromNick.nick] = fromNick;
        }
        
        return true;
    } else {
        if (!fromNick.str) fromNick = THAT.RECORDS[fromNick];
        if (!slapped.str) slapped = THAT.RECORDS[slapped];

        slap.crit = dice.roll('1d20').result === 20;
        slap.damage = dice.roll('1d6').result + fromNick.str;
        slap.moneyDrop = Math.floor((Math.random() * slapped.coins / CONF.CONST.STEALDIVIDER) + 1);
        slapped.coins -= slap.moneyDrop || 0;
        fromNick.coins += slap.moneyDrop || 0;
        
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
    if (coins <= 0) {
        THAT.RECORDS[nick].coins = CONF.PLAYERCONST.MINCASH;
        coins = CONF.PLAYERCONST.MINCASH;
    }
    
    THAT.speakOut('<' + nick + '> has ' + coins + 'coins');
};

SLAPBOT.prototype.actionSayAvailCommands = function () {
    THAT.speakOut('SLAP Commands: !slap, !ress, !gamble, !money');
};

SLAPBOT.prototype.actionGamble = function (nick, message) {
    message = THAT.stringToArray(message);
    var gambledMoney = message[1];
    var gambleOption = message[2];
    var randomChosenBox = ((Math.random() * CONF.CONST.BOXES) + 1);
    var gotTheBunny = dice.roll('1d20').result === 20;
    var prize = gambledMoney * CONF.CONST.GAMBLEMULTIPLIER;
    var wonMessage;
    
    nick = THAT.RECORDS[nick] || THAT.makeNewRecord(nick);
    
    if (gambleOption > CONF.CONST.BOXES || gambleOption === 0 || !gambleOption) {
        THAT.speakOut(nick.nick + ': !gamble <money> <1 ... ' + CONF.CONST.BOXES + '>');
    }
    
    if (nick.coins < gambledMoney) {
        THAT.speakOut('Mate, you\'r short on cash.');
        return false;
    }
    
    if (gambleOption == randomChosenBox) {
        
        if (tehBunny) {
            prize = prize + THAT.RECORDS['-gambleTehBunny-'].coins;
            wonMessage = 'WOWOWOWWOWO!!111! ' + nick.nick + ' just won TEHBUNNY!';
            THAT.speakIn(nick.nick, 'Only the VIP get to get this, have a !beer');
            THAT.PUB.push(nick.nick);
            
            setTimeout(function removeFromPub() {
                THAT.PUB.slice(THAT.PUB.indexOf(nick.nick), 1);
                if (THAT.isOnChannel(nick.nick)) {
                    THAT.speakIn(nick.nick, 'The pub has closed. !gamble again ;)');
                }
            }, 3600);
            
            THAT.RECORDS['-gambleTehBunny-'].coins = 0;
            
        } else {
            wonMessage = 'Wow! ' + nick.nick + ' won the bet!';
        }
        
        nick.coins += prize;
        THAT.speakOut(wonMessage);
        THAT.speakIn(nick.nick, 'You won ' + prize + 'coins');
        THAT.RECORDS[nick.nick] = nick;
        
    } else {
        THAT.RECORDS['-gambleTehBunny-'].coins += gambledMoney;
        THAT.speakOut('Better luck next time, ' + nick.nick + '.');
        THAT.speakOut('tehBunny value is ' + THAT.RECORDS['-gambleTehBunny-'].coins + 'coins.');
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
SLAPBOT.prototype.actionDrinkBeer = function (nick) {
    
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
    var index = this.ONCHANNEL.indexOf(nick);
    if (index === -1) {
        return false;
    }

    THAT.ONCHANNEL.slice(index, 1);
};

SLAPBOT.prototype.startListening = function startListening() {
    
    THAT = this;
    
    this.listenChannelMessage(CONF.CONST.CHANNEL, CONF.CONST.CMDTRIGGER + 'slap', this.actionSlap);
    this.listenChannelMessage(CONF.CONST.CHANNEL, CONF.CONST.CMDTRIGGER + 'ress', this.actionHeal);
    this.listenChannelMessage(CONF.CONST.CHANNEL, CONF.CONST.CMDTRIGGER + 'money', this.actionSayMoneyStats);
    this.listenChannelMessage(CONF.CONST.CHANNEL, CONF.CONST.CMDTRIGGER + 'thegame', this.actionSayAvailCommands);
    this.listenChannelMessage(CONF.CONST.CHANNEL, CONF.CONST.CMDTRIGGER + 'gamble', this.actionGamble);

    this.listenChannelMessage(CONF.CONST.CHANNEL, CONF.CONST.CMDTRIGGER + 'beer', this.actionDrinkBeer);
    this.listenChannelMessage(CONF.CONST.CHANNEL, CONF.CONST.CMDTRIGGER + 'ladder', this.actionSayLadder);
    this.listenChannelMessage(CONF.CONST.CHANNEL, CONF.CONST.CMDTRIGGER + 'stats', this.actionSayStats);

    this.client.addListener('names', this.updateOnChannel);
    this.client.addListener('join#' + CONF.CONST.CHANNEL, this.addUserToChannel);
    this.client.addListener('part#' + CONF.CONST.CHANNEL, this.removeUserFromChannel);
    
    this.client.addListener('registered', function () {
        console.log('Hooked :)');
    });
    
    this.client.addListener('error', function(message) {
        console.log('error: ', message);
    });
    
    
};