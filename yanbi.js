/**
 * Created by Mosh Mage on 5/21/2016.
 */
var irc = require('irc');

function checkConfig(config) {
    if (config.server && config.channelsArray && config.selfNickname) {
        return config;
    }

    return false;
}

var YANBI = function(ircConf) {
    ircConf = checkConfig(ircConf) || require('./conf/init.conf.js');
    var Eventer = new require('./eventer.js')(irc, ircConf);

    var Dispatcher = require('./dispatcher.js')();
    var ModuleMan = require('./module-manager')(ircConf.owner);

    Dispatcher.initialize(Eventer);
    ModuleMan.initialize(Eventer);

    /**
     * Hook on the 'registered' event from node-irc
     * and use that to load our modules
     */
    Eventer.createEventType('registered', function () {
        ModuleMan.loadModulesFolder(false);

        if (ircConf.nickserv) {
            Eventer.client.say('NickServ','identify ' + ircConf.nickserv);
        }
    });

    return {
        Eventer: Eventer,
        ModuleMan: ModuleMan
    }
};

module.exports = YANBI;