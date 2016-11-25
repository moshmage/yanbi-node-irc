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
        this.moduleName = module.name;
        this.self = module;
    }
}

export class ModuleManager {
    constructor(modulesPath, events) {
        if (!modulesPath) throw Error('ModuleManager needs a path to load from');
        if (!events) throw Error('ModuleManager needs the Events class to work');
        this.events = events;
        this.modules = {};
        this.modulesPath = modulesPath;
    }

    /**
     * grabms module.self from @this.modules
     * @param name
     * @returns {*}
     */
    getModule(name) {
        return this.modules[name].self;
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

    loadFromFolder(rehashing, nick) {
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
