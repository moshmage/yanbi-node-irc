const Config = require('../classes/config');

const required = ['server', 'channel', 'nickname'];
const defaultConfig = {
    server: '',
    channel: [],
    nick: ''
};


if (!fs.existsSync('/irc.config.json')) throw Error('Missing configuration file: irc.config.json');
let options = JSON.parse(fs.readFileSync('irc.config.json', 'utf-8'));

const IrcConfig = new Config(options, required, defaultConfig);
module.exports = IrcConfig;