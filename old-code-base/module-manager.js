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

        if (!tempModule.name) {
            unloadModule(module, true);
            return;
        }

        console.log((!rehash) ? 'Loaded' : 'Reloaded',
            tempModule.name,tempModule.version || '', tempModule.author || '');

        List[tempModule.name] = tempModule;
        List[tempModule.name].path = !fs.existsSync(module) ? modulesFolder + module : module;

        if (typeof tempModule.initialize === "function") {
            List[tempModule.name].initialize(Eventer);
        }
    }

    /**
     * Loads the modules folder as yanbi modules and acalls @initializeModule
     * @param rehash {boolean}        if you're calling it from ;rehash, this should be true so you don't get copies
     * @param nick {string}           if you're calling from ;rehash, this will be used to /notice nick reloaded report
     */
    function loadModulesFolder (rehash, nick) {
        if (fs.existsSync(modulesFolder)) {
            modulesFolderContent = fs.readdirSync(modulesFolder);
            console.log('Found',modulesFolderContent.length,'modules..');
            modulesFolderContent.forEach(function (module) {
                if (module.indexOf('_') === 0) {
                    console.log('Ignored',module,'because of trailing underscore');
                    return false;
                }

                initializeModule(module, rehash);

            });
            
            if (nick) {
                Eventer.client.notice(nick, 'Folder reloaded :D');
            }
        } else {
            console.log('Folder',modulesFolder,'does not exist.');
            console.log('Create it, add a `owner` property to your config');
            console.log('Add some bot-scripts inside, and then issue');
            console.log('/notice <bot-nickname> .rehash');
            console.log('\n');
            console.log('That should reload the folder again.');
        }
    }

    /**
     * Unloads a module both from the require() and YANBI, calling the .rehasher() if it exists as a function
     * @param name       {string}    Module name
     * @param force     {boolean}    if true, and you provide a path ending with .js, it will delete its require cache
     * @param [callback] {function}    callback if you need, it calls back with 'name' as its argument

     */
    function unloadModule(name, force, callback) {

        if (force) {
            if (name.match(/\.js$/) && fs.existsSync(name)) {
                delete require.cache[name];
                return true;
            }
            return;
        }

        if (typeof List[name].rehasher() === "function") {
            List[name].rehasher();
        }

        delete require.cache[List[name].path];
        delete List[name];

        if (callback && typeof callback === "function") {
            callback(name);
            return;
        }
        return true;
    }

    function rehashAll() {
        Object.keys(List).forEach(function(module) {
            if (typeof List[module].rehasher() === "function") {
                List[module].rehasher();
            }
        });
    }

    function initialize(EventService) {
        Eventer = EventService;

        /**
         * .rehash <module-name>
         *     makes it so we can reload the module without having to
         *     kill the bot each time.
         */
        Eventer.catchEvent('notice','.rehash', function (nick, to, message) {
            message = message.split(' ');
            if (nick.toLowerCase() !== Owner.toLowerCase()) {
                return;
            }

            if (message.length  === 1) {
                Eventer.client.notice(nick, 'Reloading folder..');
                rehashAll();
                loadModulesFolder(true, nick);
                return;
            }

            if (!List[message[1]]) {
                return;
            }

            if (typeof List[message[1]].rehasher !== "function") {
                Eventer.client.notice(nick, 'Module does not have a rehashing function..');
                return;
            }

            List[message[1]].rehasher(EventService);
            initializeModule(List[message[1]].path, true);
            Eventer.client.notice(nick, 'Reloaded ' + List[message[1]].name + ' v' + List[message[1]].version);
        });

        /** .unload moduleName */
        Eventer.catchEvent('notice', '.unload', function (nick, to, message) {
            message = message.split(' ');
            if (!message[1]) {
                Eventer.client.notice(nick, 'Need a module to unload');
                return;
            }

            if (!List[message[1]]) {
                Eventer.client.notice(nick, 'Unexisting module: ' + message[1]);
                return;
            }

            unloadModule(message[1]);
            Eventer.client.notice(nick, 'Unloaded: ' + message[1] + ' :)');
        })

    }
    
    return {
        List: List,
        initialize: initialize,
        loadModulesFolder: loadModulesFolder,
        initializeModule: initializeModule,
        unloadModule: unloadModule
    }
};