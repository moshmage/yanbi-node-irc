/**
 * Created by Mosh Mage on 5/17/2016.
 */
'use strict';
var irc = require('irc');
var fs = require('fs');
var dice = require('rpg-dice'); // dice.roll('1d6')

var CONST = {
    RECORDS: __dirname + '/records/records.json',
    CMDTRIGGER: '!'
};

var SLAPBOT = module.exports = function SLAPBOT() {
    if (!(this instanceof SLAPBOT)) {
        return new SLAPBOT();
    }

    this.RECORDS = JSON.parse(fs.readFileSync(CONST.RECORDS, 'UTF8'));
    this.ONCHANNEL = [];
    this.client = new irc.Client('caligula.snoonet.org', 'backhand', { channels: ['#portugal'] });

};

SLAPBOT.prototype.listenChannelMessage = function (on, what, callback) {
    this.client.addListener('message#' + on, what, callback);
};

SLAPBOT.prototype.speakOut = function (text) {
    this.client.say('#portugal', text);
};

SLAPBOT.prototype.isOnChannel = function (nickname) {
    return this.ONCHANNEL.some(function (name) {
        return name.toLowerCase() === nickname.toLowerCase();
    });
};

SLAPBOT.prototype.makeNewRecord = function (nick) {
    this.RECORDS[nick] = {
        health: 100,
        coins: 15,
        str: 1,
        agi: 1,
        drunk: false
    };

    return this.RECORDS[nick];
};

SLAPBOT.prototype.actionSlap = function (fromNick, message) {
    message = message.trim().split(' ');
    var slapped = message[1];

    if (!slapped) {
        this.speakOut(fromNick + ': the usage is ' + CONST.CMDTRIGGER + 'slap <nick>');
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

    if (slapped.health === 0) {
        this.speakOut(fromNick + ': <' + slapped + '> is dead. use ' + CONST.CMDTRIGGER + 'heal <nick> to bring him back to life (15coins) ');
        return false;
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
    this.listenChannelMessage('portugal', CONST.CMDTRIGGER + 'slap', SLAPBOT.actionSlap);
    this.listenChannelMessage('portugal', CONST.CMDTRIGGER + 'heal', SLAPBOT.actionHeal);
    this.listenChannelMessage('portugal', CONST.CMDTRIGGER + 'gamble', SLAPBOT.actionGamble);
    this.listenChannelMessage('portugal', CONST.CMDTRIGGER + 'money', SLAPBOT.actionSayMoneyStats);
    this.listenChannelMessage('portugal', CONST.CMDTRIGGER + 'thegame', SLAPBOT.actionSayAvailCommands);

    this.client.addListener('names#portugal', SLAPBOT.updateOnChannel);
    this.client.addListener('join#portugal', SLAPBOT.addUserToChannel);
    this.client.addListener('part#portugal', SLAPBOT.removeUserFromChannel);
};