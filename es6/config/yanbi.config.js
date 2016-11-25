/**
 * Created by Mosh Mage on 11/25/2016.
 */
"use strict";
const fs = require('fs');
const Config = require('../classes/config');


const required = ['modules', 'owner'];
const defaultConfig = {
    modules: 'yanbi-modules/',
    owner: '',
    authenticate: ''
};
let conf = fs.readFileSync('yanbi.config.json', 'utf-8');
if (!conf) throw Error('Missing configuration file: yanbi.config.json');

let options = JSON.parse(conf);

const YanbiConfig = new Config(options, required, defaultConfig);

module.exports = YanbiConfig;