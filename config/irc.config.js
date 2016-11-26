"use strict";
const fs = require('fs');
const Config = require('../classes/config');

const required = ['server', 'channels', 'nick'];
const defaultConfig = {
    server: '',
    channels: [],
    nick: ''
};

let conf = fs.readFileSync('irc.config.json');
if (!conf) throw Error('Missing configuration file: irc.config.json');

let options = JSON.parse(conf);

const IrcConfig = new Config(options, required, defaultConfig);
module.exports = IrcConfig;