/**
 * Created by Mosh Mage on 11/25/2016.
 */
"use strict";
class Config {
    constructor(options, required = [], defaults={}) {
        this._required = required;
        this._options = (Object.keys(options).length > 0) ? options : defaults || {};
        let optionKeys = Object.keys(this._options);

        if (optionKeys.length < this._required.length)
            throw Error(`Missing required configuration values: ${this._required.join(', ')}`);

        this._required.every(key => {
            if (optionKeys.indexOf(key) > -1
                && this._options[key].length > 0) {
                return true;
            }
            throw Error(`Missing required configuration value: ${key}`);
        });
    }

    get options() {return this._options; }
}

module.exports = Config;