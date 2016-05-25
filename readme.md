# YANBI
### Yet Another Node-IRC Bot Implementation
---
YANBI aims to be a base to make your bot reacto to whatever it likes. To do so it provides a simple interface for node-irc, complete with reloading of modules (thanks to re-require) so you don't have to kill your bot on every change.    
tl;dr [yanbi-example](https://github.com/moshmage/yanbi-example)


#### Basic Configuration
The bot comes with a simple configuration to feel node-irc needs, a nickname, a network, a channel, and a owner this can be found in `conf/init.conf.js`;
If you don't provide an object with `server`, `selfNickname`, `channelsArray`, adn `yanbiModules` the bot will use the default configuration and join #mmDev @ snoonet.
Remember this is built on node-irc, so anything that node-irc can handle as a config this should also be able to; Just don't forget those four important properties.

Don't forget to assign a `owner` property (this is a __very basic__ security property) on the `init.conf.js` file so you can `/notice botName ;rehash` later and reload your modules.

#### Modules
Making a module is easy. All you need to do is a `module.exports` which exports a function.
If you need the module to have a IRC context then you need to return a `initialize` function on you `module.exports` function which takes `EventService` as an argument, like so:

```js
module.exports = function exampleModule() {
    function initialize(EventService) {
        EventService.doSomethingWithIt();
    }
    return {
        initialize: initialize
    }
}
```

If, on the other hand, you don't need an IRC context and since module manager is already expecting a function to come out of `module.exports`, all you have to do to get a module starting is:

```js
module.exports = function exampleModule() {
    console.log('this will be ran because the require is self-executing the module.exports');
}
```

##### Reloading your modules
Reloading your modules can be done by providing a `rehasher` function on your `module.exports`. This function will be called everytime a `;rehash` event is caught by the Module Manager. Triggering a rehash is made by sending a notice to the bot made of `;rehash <module-name>`.

Use the `rehasher` function to unhook from the events you hooked on the `initialize` call, so your bot doesn't answer twice to the same event when it gets initiated again.

```js
EXAMPLE.prototype.rehasher = function () {
    Eventer.releaseEvent('join','mmBot');
};
```

##### Naming, author and version
You __must__ provide a `name` string property in your module, so Module Manager knows how to identify your module. If you provide an `author` and `version` both will be logged when `node init.js` is ran.

```js
// examplemodule.js
module.exports = function EXAMPLE() {
    function initialize(EventService) {}
    function rehasher() {}
    return {
        name: 'example',
        author: 'moshmage@gmail.com',
        version: '0.1',
        initialize: initialize,
        rehasher: rehasher
    }
};
```
Place the `examplemodule.js` file inside `modules/` folder and you're ready to `node init.js`

##### Disabling a module
If the name of the file inside the modules folder starts with a `_` (underscore) that module will be ignored.
Modules can't be ignored on `;rehash`.

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
Normal bot stuff as `say`, `notice`, `join` etc.. are the default ones provided by node-irc, you can use them through the `Eventer` object that is passed to all your modules as long as you provide a `initliaze` function. You can use it calling the `client` property that was initiated when you called `node init.js`.

```js
Eventer.catchEvent('join#channel',function (channel, nick) {
    Eventer.client.say('#channel', 'Hi, ' + nick); // Greet everyone who joins
});
```

### More examples
More examples of modules can be seen in `modules/` folder.
