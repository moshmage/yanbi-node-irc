/**
 * Created by Mosh Mage on 5/17/2016.
 */
'use strict';
var irc = require('irc');
var fs = require('fs');
var CONF = require('./conf.js');
var dice = require('rpg-dice'); // dice.roll('1d6')


var CONST = {
    RECORDS: __dirname + '/records/records.json',
    CMDTRIGGER: '!',
    MAXHEALTH: 100
};

var SLAPBOT = module.exports = function SLAPBOT() {
    if (!(this instanceof SLAPBOT)) {
        return new SLAPBOT();
    }

    this.RECORDS = JSON.parse(fs.readFileSync(CONST.RECORDS, 'UTF8'));
    this.ONCHANNEL = [];
    this.client = new irc.Client('caligula.snoonet.org', 'backhand', { channels: ['#portugal'] });

};
SLAPBOT.prototype.stringToArray = function (string) {
    return string.trim().split(' ');
};

SLAPBOT.prototype.listenChannelMessage = function (on, what, callback) {
    this.client.addListener('message#' + on, what, callback);
};

SLAPBOT.prototype.speakOut = function (text) {
    this.client.say('#portugal', text);
};

SLAPBOT.prototype.speakIn = function (nick, text) {
    this.client.notice(nick, text);
};

SLAPBOT.prototype.isOnChannel = function (nickname) {
    return this.ONCHANNEL.some(function (name) {
        return name.toLowerCase() === nickname.toLowerCase();
    });
};

SLAPBOT.prototype.makeNewRecord = function (nick) {
    this.RECORDS[nick] = {
        health: CONF.PLAYERCONST.MAXHEALTH,
        coins: CONF.PLAYERCONST.MINCASH,
        str: CONF.PLAYERCONST.MINSTR,
        agi: CONF.PLAYERCONST.MINAGI,
        nick: nick
        drunk: false
    };

    return this.RECORDS[nick];
};

SLAPBOT.prototype.actionSlap = function (fromNick, message) {
    message = message.trim().split(' ');
    var slapped = message[1];
    var slap = {};
    
    if (!slapped) {
        this.speakOut(fromNick + ': the usage is ' + CONF.CONST.CMDTRIGGER + 'slap <nick>');
        return false;
    }

    if (!this.isOnChannel(slapped)) {
        this.speakOut(fromNick + ': user <' + slapped + '> isn\'t in the channel, totes not fair.');
        return false;
    }

    if (!this.RECORDS[fromNick]) {
        fromNick = this.makeNewRecord(fromNick);
    }

    if (!this.RECORDS[slapped]) {
        slapped = this.makeNewRecord(slapped);
    }

    if (slapped.health <= 0) {
        this.speakOut(fromNick + ': <' + slapped + '> is dead. use ' + CONF.CONST.CMDTRIGGER + 'heal <nick> to bring him back to life (15coins) ');
        return false;
    }

    if ((dice.roll('1d6') < dice.roll('1d6') + slapped.agi)) {
        this.speakOut('*SWOOSH*');
        return true;
    } else {
        slap.crit = dice.roll('1d20') === 20;
        slap.damage = dice.roll('1d6') + fromNick.str;
        slap.moneyDrop = (Math.random() * slapped.coins/3) + 1;
        nick.coins -= slap.moneyDrop;
        fromNick.coins += slap.moneyDrop;
        
        if (slap.crit) {
            slap.damage += slap.damage + (Math.random() * 100);
            this.speakOut('WOW! Whattaslap!');
        }
        
        slapped.health -= slap.damage;

        this.RECORDS[slapped.nick] = slapped;
        this.RECORDS[fromNick.nick] = fromNick;
        
        this.speakOut(fromNick.nick + ' slaps <' + slapped.nick + '> for ' + slap.damage + 'hp');
        this.speakIn(fromNick.nick, 'you stole ' + slap.moneyDrop + 'coins from <' + slapped.nick + '>');
        this.speakIn(slapped.nick, 'stole ' + slap.moneyDrop + 'coins from your wallet');
    }

};

SLAPBOT.prototype.actionHeal = function (nick, message) {
    message = this.stringToArray(message);
    var healed = message[1] || nick;

    if (this.RECORDS[nick].coins < CONF.PRICE.HEALING) {
        this.speakOut(nick + ': you lack cash. you need 15 coins to heal someone.');
        return false;
    }

    if (!this.RECORDS[healed]) {
        healed = this.makeNewRecord(healed);
    }

    if (this.RECORDS[healed].health <= 0) {
        this.RECORDS[healed].health = CONF.PLAYERCONST.MAXHEALTH;
        this.RECORDS[nick].coins -= CONF.PRICE.HEALING;
    } else {
        this.speakOut(nick + ': <' + healed + '> is still kicking, no need to heal');
    }
};

SLAPBOT.prototype.updateOnChannel = function (nicks) {
    var that = this;
    that.ONCHANNEL = [];

    Object.keys(nicks).forEach(function (nickname) {
        that.ONCHANNEL.push(nickname);
    });
};

SLAPBOT.prototype.addUserToChannel = function (nick) {
    if (nick.toLowerCase() === this.client.nick.toLowerCase()) {
        return false;
    }

    this.ONCHANNEL.push(nick);
};

SLAPBOT.prototype.removeUserFromChannel = function (nick) {
    var index = this.ONCHANNEL.indexOf(nick);
    if (index === -1) {
        return false;
    }

    this.ONCHANNEL.slice(index, 1);
};

SLAPBOT.prototype.startListening = function startListening() {
    this.listenChannelMessage('portugal', CONF.CONST.CMDTRIGGER + 'slap', SLAPBOT.actionSlap);
    this.listenChannelMessage('portugal', CONF.CONST.CMDTRIGGER + 'ress', SLAPBOT.actionHeal);
    this.listenChannelMessage('portugal', CONF.CONST.CMDTRIGGER + 'gamble', SLAPBOT.actionGamble);
    this.listenChannelMessage('portugal', CONF.CONST.CMDTRIGGER + 'money', SLAPBOT.actionSayMoneyStats);
    this.listenChannelMessage('portugal', CONF.CONST.CMDTRIGGER + 'thegame', SLAPBOT.actionSayAvailCommands);

    this.client.addListener('names#portugal', SLAPBOT.updateOnChannel);
    this.client.addListener('join#portugal', SLAPBOT.addUserToChannel);
    this.client.addListener('part#portugal', SLAPBOT.removeUserFromChannel);
};