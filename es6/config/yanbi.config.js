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

if (!fs.existsSync('/yanbi.config.json')) throw Error('Missing configuration file: yanbi.config.json');
let options = JSON.parse(fs.readFileSync('/yanbi.config.json', 'utf-8'));

const YanbiConfig = new Config(options, required, defaultConfig);

module.export = YanbiConfig;