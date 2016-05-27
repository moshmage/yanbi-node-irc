# YANBI
### Yet Another Node-IRC Bot Implementation
---
YANBI aims to be a base to make your bot react to whatever it likes. To do so it provides a simple interface for node-irc, complete with reloading of modules (thanks to [re-require-module](https://www.npmjs.com/package/re-require-module)) so you don't have to kill your bot on every change.
tl;dr [yanbi-example](https://github.com/moshmage/yanbi-example)


#### Initializing
`require('yanbi')()` Will use the default configuration, connect to Snoonet and join #mmDev. Provide a [node-irc-like](https://node-irc.readthedocs.io/en/latest/API.html#client) configuration and you'll be good to go:

```js
// config.js
module.exports = {
    debug: false,               // use node-irc debugging
    server: 'irc.snoonet.org',  // server to connect to
    channelsArray: ['#mmDev'],  // equal to `channels` array from node-irc
    selfNickname: 'yanbi',      // the bots nickname
    nickserv: false,            // if this is filed, bot auto-identifies with the given string
    owner: 'r3dsmile',          // nickname of the owner
    yanbiModules: './modules/'  // module folder to be loaded.
}
```
```js
    // init.js
    require('./config.js);
    require('yanbi')(config);
```


#### Modules (bot-scripts)
Modules are javascript files that will be require()d by yanbi from the get go, depending on how you build your module, you will have a node-irc context and reload ability.
A module is composed, primarily, of function which sets `name`, `version` and `author` as its propreties; `name` is mandatory for the module to be loaded. Since yanbi requires it anyway, to know if these props exist, it unloades it right after via `delete require.cache[]`.

```js
EXAMPLE = function () {
    this.name = "Example";
    this.author = "moshmage@gmail.com";
    this.version = "0.0.0";
    this.description = "Example and simple implementation";
};
module.exports = EXAMPLE;
```

```js
module.exports = function exampleModule() {
    console.log('this will be ran because the require is self-executing the module.exports');
}
```
##### Giving your module a IRC Context
This can be achieved by providing a `initialize` proprety, which will be executed by yanbi with the `Eventer` Object:
```js
EXAMPLE.prototype.initialize = function (EventerService) {
    // ...
};
```
##### Reloading your modules
Reloading your modules is done by issueing a notice to your bot containing `.rehash <module-name>`, if no module name is provided yanbi will reload the entire folder (useful for enabling or disabling modules). yanbi also posesses a `.unload <module-name>` but it **wont** unload your whole folder if you don't type a module-name. Also, this is where the `owner` prop from your configuration is used.

```js
EXAMPLE.prototype.rehasher = function (EventerService) {
    // use this function to unhook from Eventer,
    // delete setIntervals or setTimeouts that havent finished
    // .. etc
};
```
Reloading your modules, if made properly, shouldn't kill your bot and if successfull it will report back with a notice.

##### Disabling a module
If the name of the file inside the modules folder starts with a `_` (underscore) that module will be ignored from the loading of the module folder, both on initialize and on rehash.

##### Module Manager
YANBI returns a `ModuleMan` proprety so you can build around it as well.
`ModuleMan` contains an Object `List` holding every module, `loadModulesFolder`, `initializeModule` and `unloadModule` which are self explanatory. It also provides an `initialize` but I advise against calling on it, as it will cause all your modules to be re-loaded without calling the `rehasher()` before.

### Eventer

Hooking to the node-irc events is different. You have to create the Parent Event and assign a function handler, and then you set a `catchEvent` with a word filter and another function handler. This all sounds complicated, but it isn't. This was made so that we don't pollute the EventEmitter with the same event-request. You can still hook to the default node-irc behaviour by using `Eventer.client.*` functions as they are available throughout the modules.

##### Default Hooks
By default, `dispatcher.js` has the following hooks
- join
- part
- names
- notice
- message#

To these events, all you have to do is use the [`Eventer.catchEvent`](https://github.com/moshmage/irc-slap-bot/blob/master/eventer.js#L54) function.

##### Creating a new hook
In the case that you need to create another hook, you can do so by using [`Eventer.createEventType`](https://github.com/moshmage/irc-slap-bot/blob/master/eventer.js#L34) function.

##### Releasing a hook
In the event that you don't want the event to be caught again, you can release it using [`Eventer.releaseEvent()`](https://github.com/moshmage/irc-slap-bot/blob/master/eventer.js#L78)



### Botting
Botting is done via the `Eventer.client` object. both your modules have it and YANBI exports it as a proprety from the require function. `Eventer.client` is, in itself, the [node-irc](https://node-irc.readthedocs.io/en/latest/API.html#Client.join) lib so you can use all those available comands through it.

```js
function sayHi(channel, nick) {
    // channel = "#mmDev", nick = "r3d"
    Eventer.client.say(channel, 'Hi, ' + nick); // Issues message to #mmDev saying "Hi, r3d"
});
```

### More examples
More examples of modules can be seen in the yanbi `modules/` folder.