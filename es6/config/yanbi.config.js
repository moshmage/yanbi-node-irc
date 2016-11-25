/**
 * Created by Mosh Mage on 11/25/2016.
 */
"use strict";
import {Confg} from '../classes/config'
const required = ['modules', 'owner'];

const defaultConfig = {
    modules: 'yanbi-modules/',
    owner: '',
    authenticate: ''
};

export const YanbiConfig = new Confg(options, required, defaultConfig);