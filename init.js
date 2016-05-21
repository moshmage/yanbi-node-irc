/**
 * Created by Mosh Mage on 5/21/2016.
 */
var irc = require('irc');
var fs = require('fs');
var ircConf = require('./conf/init.conf.js');
var Eventer = new require('./eventer.js')(irc, ircConf);

var Dispatcher = require('./dispatcher.js')();

var modulesFolderContent;
var tempModule;
var Modules = {};

Eventer.startIrcService();

Dispatcher.initialize(Eventer);



Eventer.createEventType('registered', function () {
    modulesFolderContent = fs.readdirSync('modules/');
    modulesFolderContent.forEach(function (module) {
        if (module.indexOf('_') === 0) {
            console.log('Ignored',module,'because of trailing underscore');
            return false;
        }

        tempModule = require('./modules/' + module)();
        console.log('Loaded',tempModule.name,tempModule.version || '',tempModule.author || '');

        Modules[tempModule.name] = tempModule;
        if (typeof tempModule.initialize === "function") {
            Modules[tempModule.name].initialize(Eventer);
        }

    });

    if (ircConf.nickserv) {
        Eventer.client.say('NickServ','identify ' + ircConf.nickserv);
    }

});