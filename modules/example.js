/**
 * Created by Mosh Mage on 5/21/2016.
 */
var Eventer = null;
var EXAMPLE = module.exports = function HELP() {
    if (!(this instanceof HELP)) {
        return new HELP();
    }

    this.name = "Example";
    this.description = "Example module";
    this.author = "moshmage@gmail.com";
    this.version = "1.0";
};

function selfJoinedChannel(channel, nick) {
    if (channel.replace('#','') === 'mmdev') {
        Eventer.client.say('#mmdev','Hello, world');
    }
}

EXAMPLE.prototype.initialize = function (EventService) {
    Eventer = EventService;
    Eventer.catchEvent('join','mmBot',selfJoinedChannel);
};

EXAMPLE.prototype.rehasher = function () {
    Eventer.releaseEvent('join','mmBot');
};