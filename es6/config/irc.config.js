import {Config} from '../classes/config'

const required = ['server', 'channel', 'nickname'];
const defaultConfig = {
    server: '',
    channel: [],
    nick: ''
};

export const IrcConfig = Config;