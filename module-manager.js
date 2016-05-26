/**
 * Created by Mosh Mage on 5/22/2016.
 */

var Eventer;
var fs = require('fs');
var reRequire = require('re-require-module').reRequire;

module.exports = function ModuleMan(Owner, modulesFolder) {
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
            tempModule = require(modulesFolder + module)();
        } else {
            if (!fs.existsSync(module)) module = modulesFolder + module;
            tempModule = reRequire(module)();
        }

        console.log((!rehash) ? 'Loaded' : 'Reloaded',
            tempModule.name,tempModule.version || '', tempModule.author || '');

        List[tempModule.name] = tempModule;
        List[tempModule.name].path = !fs.existsSync(module) ? modulesFolder + module : module;

        if (typeof tempModule.initialize === "function") {
            List[tempModule.name].initialize(Eventer);
        }
    }
    
    function loadModulesFolder (rehash, nick) {
        modulesFolderContent = fs.readdirSync(modulesFolder);
        modulesFolderContent.forEach(function (module) {
            if (module.indexOf('_') === 0) {
                console.log('Ignored',module,'because of trailing underscore');
                return false;
            }
            if (!List[module]) rehash = false;

            initializeModule(module, rehash);
        });

        if (nick) {
            Eventer.client.notice(nick, 'Folder reloaded :D');
        }
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
                return;
            }

            // todo: make it so we can unload every module
            if (message.length  === 1) {
                loadModulesFolder(true, nick);
                Eventer.client.notice(nick, 'Reloading folder..');
                return;
            }

            if (!List[message[1]]) {
                return;
            }

            if (typeof List[message[1]].rehasher !== "function") {
                Eventer.client.notice(nick, 'Module does not have a rehashing function..');
                return;
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