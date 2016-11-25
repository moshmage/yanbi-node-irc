import {Confg} from '../classes/config'

const required = ['server', 'channel', 'nickname'];
const defaultConfig = {
    server: '',
    channel: [],
    nick: ''
};

export const IrcConfig = new Confg(options, required, defaultConfig);