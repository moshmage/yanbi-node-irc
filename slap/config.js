'use strict';
var CONF = module.exports = function () {
    if (!(this instanceof CONF)) {
        return new CONF();
    }
    
    this.CONST = {
        CMDTRIGGER: '!',
        RECORDS: __dirname + '/records/records.json',
        MYNICK: 'backhand',
        CHANNEL: 'portugal',
        GAMBLEMULTIPLIER: 2,
        STEALDIVIDER: 3,
        BOXES: 3,
        DAMAGEFROMDRUNK: 15,
        DAY: 24 * 60 * 60 * 1000,
        IGNORETIME: 60 * 1000,
        BACKUP: 1800 * 1000
    };
    
    this.FLOOD = {
        MAXCMDS: 2,
        BETWEENMS: 25 * 1000,
        INCREASE: 5
    };
    
    this.PLAYERCONST = {
        MAXHEALTH: 50,
        MINSTR: 1,
        MINAGI: 1,
        MINCASH: 30,
        
    };
    
    this.PRICE = {
        HEALING: 15,
        BEER: 100
    }
}