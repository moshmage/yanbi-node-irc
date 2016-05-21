/**
 * Created by Mosh Mage on 5/21/2016.
 */
var irc = require('irc');
var fs = require('fs');
var reRequire = require('re-require-module').reRequire;

var ircConf = require('./conf/init.conf.js');
var Eventer = new require('./eventer.js')(irc, ircConf);
var Dispatcher = require('./dispatcher.js')();

var modulesFolderContent;
var Modules = {};

/**
 * calls module.initialize() with Eventer as an argument
 * and assigns the require to @Modules object for later
 * re-require
 * 
 * @param module {string}   path to the module to be required
 * @param rehash {boolean}   reload the module?
 */
function initializeModule(module, rehash) {
    var tempModule;
    if (!rehash) {
        tempModule = require('./modules/' + module)();
    } else {
        tempModule = reRequire('./modules/' + module)();
    }

    console.log((!rehash) ? 'Loaded' : 'Reloaded',
        tempModule.name,tempModule.version || '', tempModule.author || '');

    Modules[tempModule.name] = tempModule;

    if (typeof tempModule.initialize === "function") {
        Modules[tempModule.name].initialize(Eventer);
    }
}

function loadModulesFolder (rehash) {
    modulesFolderContent = fs.readdirSync('modules/');
    modulesFolderContent.forEach(function (module) {
        if (module.indexOf('_') === 0) {
            console.log('Ignored',module,'because of trailing underscore');
            return false;
        }
        if (!Modules[module]) rehash = false;

        initializeModule(module, rehash);
    });

    if (ircConf.nickserv) {
        Eventer.client.say('NickServ','identify ' + ircConf.nickserv);
    }

}

/**
 * Hook on the 'registered' event from node-irc
 * and use that to load our modules
 */
Eventer.createEventType('registered', function () {
    loadModulesFolder(false)
});

/** Hook dispatcher to the Eventer machine */
Dispatcher.initialize(Eventer);


/**
 * ;rehash <module-name>
 *     makes it so we can reload the module without having to
 *     kill the bot each time.
 */
Eventer.catchEvent('notice',';rehash', function (nick, to, message) {
    message = message.split(' ');
    if (nick.toLowerCase() !== ircConf.owner.toLowerCase()) {
        return false;
    }

    if (!Modules[message[1]]) {
        return false;
    }

    // todo: make it so we can unload every module
    if (message.length  === 1) {
        loadModulesFolder(true);
        Eventer.client.say(nick, 'You have to specify the module');
        return false;
    }

    if (typeof Modules[message[1]].rehasher !== "function") {
        Eventer.client.say(nick, 'Module does not have a rehashing function..');
        return false;
    }

    Modules[message[1]].rehasher();
    initializeModule(message[1] + '.js', true);

});