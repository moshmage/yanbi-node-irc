/**
 * Created by Mosh Mage on 11/25/2016.
 */
"use strict";
const fs = require('fs');
const reRequire = require('re-require-module').reRequire;

class Module {
    constructor(module) {
        if (!module) throw Error(`Can't load an undefined module`);
        if (typeof module.initialize !== "function") throw Error(`Module ${module.name} needs a initialize public function`);
        this.self = module;
    }
}

class ModuleManager {
    constructor(events, options, onReady) {
        if (!events) throw Error('ModuleManager needs the Events class to work');
        this.events = events;
        this.modules = {};
        this.modulesPath = options.modulesPath;
        this.botOwner = options.botOwner;

        this.events.addType('registered', () => {
            this.loadFromFolder();

            this.events.listen('notice', '.rehash', (nick, to, message) => {
                if (!this.isBotOwner(nick)) return;
                message = message.split(' ');
                let moduleName = message[1];
                this.rehashModule(moduleName, nick);

            });
            
            this.events.listen('notice', '.rehash', (nick, to, message) => {
                message = message.split(' ');
                let moduleName = message[1];
                if (!moduleName) {
                    this.events.client.notice(nick, 'Need a module to unload');
                    return;
                }

                if (!this.getModule(moduleName)) {
                    this.events.client.notice(nick, 'Unexisting module: ' + moduleName);
                    return;
                }

                this.unloadModule(message[1]);
                this.events.client.notice(nick, 'Unloaded: ' + moduleName + ' :)');
            });

            if (onReady && typeof onReady === "function") {
                onReady(this.events);
            }
        }, true);
    }

    isBotOwner(nick) {
        return this.botOwner.toLowerCase() === nick.toLowerCase();
    }

    /**
     * grabms module.self from @this.modules
     * @param name
     * @returns {*}
     */
    getModule(name) {
        return this.modules[name] && this.modules[name].self;
    }

    /**
     * requires or re-requires a @Module to @this.modules
     * @param file
     * @param rehash
     */
    loadModule(file, rehash) {
        let path = this.modulesPath + file;
        let tempModule;

        if (!rehash) tempModule = require(path);
        else tempModule = reRequire(path);

        this.modules[tempModule.name] = new Module(tempModule);
        this.modules[tempModule.name].path = this.modulesPath + file;
        this.modules[tempModule.name].initialize(this.events);

        console.log(`${!rehash ? 'loaded' : 'rehashed'} ${tempModule.name}@${tempModule.version} by ${tempModule.author}`);

    }

    rehashModule(moduleName, nick) {
        let module = this.getModule(moduleName);

        if (!module) {
            this.events.client.notice(nick, `No such module ${moduleName}`);
            return;
        }
        if (!module.rehasher) {
            this.events.client.notice(nick, `${moduleName} is not rehashable`);
            return;
        }

        module.rehasher(this.events);
        this.events.client.notice(nick, `Reloaded ${moduleName}; v${this.getModule(moduleName).version}`);
    }

    /**
     * Unloads a module from @this.modules and its require-cache counter-part
     * @param name
     */
    unloadModule(name) {

        if (typeof this.getModule(name).rehasher() === "function") {
            this.getModule(name).rehasher();
        }

        delete require.cache[this.modules[name].path];
        delete this.modules[name];

        console.log(`Info: Unloaded ${name}: ${!!this.modules[name]}`)
    }

    loadFromFolder() {
        if (!fs.existsSync(this.modulesPath)) throw Error(`Folder ${this.modulesPath} does not exist`);
        fs.readdirSync(this.modulesPath).forEach(file => {
            if (file.indexOf('_') !== 0) {
                this.loadModule(file);
            } else {
                console.log(`Info: Ignored ${file} because of trailing underscore`);
            }
        })
    }

}
module.exports = ModuleManager;