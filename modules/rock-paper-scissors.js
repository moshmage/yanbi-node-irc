/**
 * Created by Mosh Mage on 5/21/2016.
 */

var Eventer = null;
var CONF = {
    RESULTSCHANNEL: '#mmdev'
};

var RPS = module.exports = function RPS() {
    if (!(this instanceof RPS)) {
        return new RPS();
    }

    this.name = "RPS";
    this.description = "Rock Paper Scissors game";
    this.author = "moshmage@gmail.com";
    this.version = "1.0";

    this.allowedSigns = {
        'scissor|scissors|s|1': 'scissor',
        'paper|p|3': 'paper',
        'rock|r|2': 'rock'
    };

    this.logicalArray = {
        paper: ['rock','scissor'],
        rock: ['scissor', 'paper'],
        scissor: ['paper', 'scissor']
    };

    this.Players = {};
};

function handlePoints(nick, mod) {
    if (!RPS.Players[nick]) {
        RPS.Players[nick] = {
            points: 0
        }
    }

    RPS.Players[nick].score += mod;
}

function findChosenSign(sign) {
    var chosen;
    Object.keys(RPS.allowedSigns).some(function (key) {
        if (key.split('|').indexOf(sign) > -1) {
            chosen = RPS.allowedSigns[key];
            return true;
        }
    });

    if (chosen) return chosen;
    return false;
}

function rpsLadderString() {
    var string;
    var ladder = RPS.Players.sort(function (a, b) {
        if (a.score > b.score) {
            return 1;
        }

        if (a.score < b.score) {
            return -1;
        }
        return 0;
    });

    ladder.forEach(function (object, index) {
        string += object.nick + ': ' + object.score;
        if (index < ladder.length -1) {
            string += ', ';
        } else {
            string += '.';
        }
    });

    return string || 'no ladder yet.';
}

function releaseChallengeWith(nick) {
    Object(RPS.Players).forEach(function (player) {
        if (RPS.Players[player].challenge && RPS.Players[player].challenge.enemy === nick.toLowerCase()) {
            Eventer.client.notice(nick, + 'Player is not online.');
            delete RPS.Players[player].challenge;
        }
    });
}

function findChallenger(challenged) {
    var found;
    Object.keys(RPS.Players[challenged]).some(function(player) {
        if (RPS.Players[player].challenge && RPS.Players[player].challenge.enemy === challenged.toLowerCase()) {
            found = {player: player, chosen: RPS.Players[player].challenge.chosen};
            return true;
        }
    });

    if (found) return found;
    return false;
}

function makeChallenge(nick, chosen, challengeNick) {
    RPS.Players[nick].challenge = {
        chosen: chosen,
        enemy: challengeNick.toLowerCase()
    };

    Eventer.client.notice(challengeNick, nick + ' just challenged you to rock, paper or scissor');
    Eventer.client.notice(challengeNick, 'use "/notice .rps <rock|paper|scissor> reply" to play');

    setTimeout(function () {
        releaseChallengeWith(challengeNick);
    },25 * 1000);
}

function sayWinner(name, sign) {
    if (!name && !sign) {
        Eventer.client.say(CONF.RESULTSCHANNEL, "That's a tie!");
    } else {
        Eventer.client.say(CONF.RESULTSCHANNEL, name + ' won the match with ' + sign);
    }
}

function declareWinner(nick, challengeNick, chosen) {
    var result = RPS.logicalArray[challengeNick.chosen].indexOf(chosen);

    if (result === 0) {
        handlePoints(nick, -1);
        handlePoints(challengeNick.player, 1);
        sayWinner(challengeNick.player, challengeNick.chosen);
    } else if (result === 1) {
        handlePoints(nick, 1);
        handlePoints(challengeNick.player, -1);
        sayWinner(nick, chosen);
    } else {
        handlePoints(nick, 0);
        handlePoints(challengeNick.player, 0);
        sayWinner();
    }
}

function playRockPaperScissors(nick, to, message) {
    message = message.split(' ');
    var chosen, challengeNick = message[2];
    chosen = findChosenSign(message[1]);

    if (!chosen) {
        Eventer.client.say(nick, '!rps <rock|paper|scissor> [nick-of-a-player|reply]');
        return false;
    }

    if (!RPS.Players[nick]) {
        handlePoints(nick,0);
    }

    if (challengeNick === 'reply') {
        challengeNick = findChallenger(nick);
        declareWinner(nick, challengeNick, chosen);
    } else {
        makeChallenge(nick, chosen, challengeNick);
    }

}

function playRockPaperScissorsBot(nick, target, message) {
    var chosen;
    var result;
    var machineChoice = Object.keys(RPS.logicalArray)[Math.floor(Math.random() * 3) + 1];
    message = message.split(' ');
    chosen = findChosenSign(message[1]);
    result = machineChoice.indexOf(chosen);

    if (!chosen) {
        if (chosen === 'ladder') {
            Eventer.client.say(target, rpsLadderString());
        } else {
            Eventer.client.say(target, '!rps <rock|paper|scissor>');
        }

        return false;
    }

    Eventer.client.say(target, '.rps ' + machineChoice);

    if (result === 0) {
        Eventer.client.say(target, 'Hah! I win :)');
        handlePoints(nick, -1);
    } else if (result === 1) {
        Eventer.client.say(target, 'Best of 3?');
        handlePoints(nick, 1);
    } else {
        Eventer.client.say(target, '.. Again! :D');
        handlePoints(nick, 0);
    }


}

function catch401Raw(message) {
    if (message.rawCommand === '401') {
        releaseChallengeWith(message.args[1]);
    }
}

RPS.prototype.initialize = function (EventService) {
    Eventer = EventService;
    Eventer.catchEvent('message#','.rps', playRockPaperScissorsBot);
    Eventer.catchEvent('notice','.rps', playRockPaperScissors);
    Eventer.createEventType('error', catch401Raw);
};

RPS.prototype.rehasher = function () {
    Eventer.releaseEvent('join','mmBot');
    Eventer.releaseEvent('message#','.rps');
    Eventer.releaseEvent('error', catch401Raw);
};