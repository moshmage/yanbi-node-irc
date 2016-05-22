/**
 * Created by Mosh Mage on 5/22/2016.
 */

var Eventer;
var fs = require('fs');
var Owner = require('./conf/init.conf.js').owner;
var reRequire = require('re-require-module').reRequire;

module.exports = function ModuleMan() {
    var modulesFolderContent;
    var List = {};

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
            if (!fs.existsSync(module)) module = './modules/' + module;
            tempModule = reRequire(module)();
        }

        console.log((!rehash) ? 'Loaded' : 'Reloaded',
            tempModule.name,tempModule.version || '', tempModule.author || '');

        List[tempModule.name] = tempModule;
        List[tempModule.name].path = !fs.existsSync(module) ? './modules/' + module : module;

        if (typeof tempModule.initialize === "function") {
            List[tempModule.name].initialize(Eventer);
        }
    }
    
    function loadModulesFolder (rehash) {
        modulesFolderContent = fs.readdirSync('modules/');
        modulesFolderContent.forEach(function (module) {
            if (module.indexOf('_') === 0) {
                console.log('Ignored',module,'because of trailing underscore');
                return false;
            }
            if (!List[module]) rehash = false;

            initializeModule(module, rehash);
        });
    }

    function initialize(EventService) {
        Eventer = EventService;

        /**
         * ;rehash <module-name>
         *     makes it so we can reload the module without having to
         *     kill the bot each time.
         */
        Eventer.catchEvent('notice',';rehash', function (nick, to, message) {
            message = message.split(' ');
            if (nick.toLowerCase() !== Owner.toLowerCase()) {
                return false;
            }

            if (!List[message[1]]) {
                return false;
            }

            // todo: make it so we can unload every module
            if (message.length  === 1) {
                loadModulesFolder(true);
                Eventer.client.say(nick, 'You have to specify the module');
                return false;
            }

            if (typeof List[message[1]].rehasher !== "function") {
                Eventer.client.say(nick, 'Module does not have a rehashing function..');
                return false;
            }

            List[message[1]].rehasher();
            initializeModule(List[message[1]].path, true);
            Eventer.client.notice(nick, 'Reloaded ' + List[message[1]].name + ' v' + List[message[1]].version);
        });

    }
    
    return {
        List: List,
        initialize: initialize,
        loadModulesFolder: loadModulesFolder,
        initializeModule: initializeModule
    }
};