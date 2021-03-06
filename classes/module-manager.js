/**
 * Created by Mosh Mage on 11/25/2016.
 */
"use strict";
const fs = require('fs');
const path = require('path');
const reRequire = require('re-require-module').reRequire;
const defaultHooks = require('./helpers/default-hooks.js');

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
        this.modulesPath = path.normalize(process.cwd() + options.modulesPath);
        this.botOwner = options.botOwner;

        this.events.addType('registered', () => {

            defaultHooks.create(this.events);
            this.loadFromFolder();
            
            this.events.listen('notice', '.rehash', (nick, to, message) => this.rehashModule(message, nick));
            this.events.listen('notice', '.unload', (nick, to, message) => this.unloadModule(message, nick));

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
        tempModule = new tempModule(this.events);

        this.modules[tempModule.name] = new Module(tempModule);
        this.modules[tempModule.name].path = this.modulesPath + file;
        tempModule.initialize();

        console.log(`${!rehash ? 'loaded' : 'rehashed'} ${tempModule.name}@${tempModule.version} by ${tempModule.author}`);

    }

    rehashModule(moduleName, nick) {
        if (!this.isBotOwner(nick)) return;

        moduleName = moduleName.split(' ');
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
    unloadModule(message, nick) {
        let moduleName;

        if (!nick) {
            moduleName = message;
        } else {
            moduleName = message[1];
        }

        if (!moduleName) {
            if (nick) this.events.client.notice(nick, 'Need a module to unload');
            else console.log(`Warn: cannot unload undefined modules`);
            return;
        }

        if (!this.getModule(moduleName)) {
            if (nick) this.events.client.notice(nick, 'Unexisting module: ' + moduleName);
            else console.log(`Warn: ${moduleName} doesn't exist`);
            return;
        }

        if (typeof this.getModule(name).rehasher() === "function") {
            this.getModule(name).rehasher();
        }

        delete require.cache[this.modules[name].path];
        delete this.modules[name];

        if (nick) this.events.client.notice(nick, 'Unloaded: ' + moduleName + ' :)');
        console.log(`Info: Unloaded ${name}: ${!!this.modules[name]}`);

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