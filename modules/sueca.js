/**
 * Created by Mosh Mage on 5/22/2016.
 */
var Eventer;
var _SUECA;
var SUECA = module.exports = function SUECA() {
    if (!(this instanceof SUECA)) {
        return new SUECA();
    }

    this.name = "sueca";
    this.description = "game of sueca";
    this.author = "moshmage@gmail.com";
    this.version = "0.1";

    this.GAME = {
        "#mmdev": {
            PLAYERS:[
                {
                    nick: "r3dsmile",
                    hand: [],
                    team: 'A'
                }
            ]
        }
    }
};

function makeDeck() {

    var faces = "♥,♦,♣,♠".split(',');
    var figures = "A,K,J,Q".split(',');
    var numbers = { min: 2, max: 7 };
    var deck = [], i;

    faces.forEach(function(face){
        /** Insert numbers on deck */
        for (i = numbers.min; i <= numbers.max; i++) {
            deck.push({
                face: face,
                number: i
            });
        }

        /** Insert figures */
        figures.forEach(function (figure) {
            deck.push({
                face: face,
                number: figure
            })
        });
    });

    return deck;
}

function translateFace(face) {
    var faces = "♥,♦,♣,♠".split(',');
    var text = "C,O,P,E".split(',');

    return text[faces.indexOf(face)] || faces[text.indexOf(face)];
}

function readableHandString(handArray) {
    var string = '';
    handArray.forEach(function (card, index) {
        string += translateFace(card.face) + '' + card.number;
        if (index !== handArray.length - 1) {
            string += ', ';
        }
    });
    return string;
}

function dealHand(gameChannel) {
    var deck = makeDeck();
    var randomCardPos;
    var cardPerHand = 10, i = 1;

    _SUECA.GAME[gameChannel].PLAYERS.forEach(function (object, index) {
        for (i = 1; i <= cardPerHand; i++) {
            do {
                randomCardPos = Math.floor(Math.random() * deck.length);
            } while (deck[randomCardPos] === null);
            object.hand.push(deck[randomCardPos]);
            deck[randomCardPos] = null;
        }
        Eventer.client.notice(object.nick, '<sueca>' + readableHandString(object.hand));
    });
}

function startNewGame(nick) {
    var channelName;
    do {
        channelName = "#sueca" + Math.floor(Math.random() * 10000);
    } while(_SUECA.GAME[channelName] !== undefined);

    _SUECA.GAME[channelName] = {
        PLAYERS: [],
        whosTurn: '',
        pulledCard: {face: '', number: 0},
        trumpFace: '',
        tabledCards: [],
        totalPlayedCards: 0,
        playedCards: 0,
        TEAMSCORE: {}
    };

    Eventer.client.join(channelName);
    Eventer.catchEvent('join',channelName, function(channel, nick) {
        if (nick !== Eventer.client.nick || _SUECA.GAME[channelName].PLAYERS.length <= 4) {
            Eventer.client.say(channelName, nick + ', está um jogo a começar. escreve ".sueca join"');
        }
    });

    setTimeout(function startOrStop() {
        var starter;
        Eventer.releaseEvent('join', channelName);

        if (_SUECA.GAME[channelName].PLAYERS.length < 4) {
            Eventer.client.say(channelName, 'O jogo parou por falta de jogadores');
            Eventer.client.part(channelName);
            delete _SUECA.GAME[channelName];
        } else {
            starter = Math.floor(Math.random() * 4) + 1;
            _SUECA.GAME[channelName].whosTurn = starter;

            Eventer.client.say(channelName, '\'Tou a dar as cartas..');
            dealHand(channelName);
            Eventer.client.say(channelName, _SUECA.GAME[channelName].PLAYERS[starter] + ', começa :D');
        }
    },60 * 1000);

    return (_SUECA.GAME[channelName]) ? channelName : false;
}

function endGame(channelName) {
    Eventer.releaseEvent('join', channelName);
    venter.client.part(channelName);
    delete _SUECA.GAME[channelName];
}

function playerHasNoFaceCard(face, hand) {
    return hand.every(function(card){
        return card.face !== face;
    });
}

function parseStringOfCards(string) {
    var array = [];
    string = string.split(', ');
    string.forEach(function (card) {
        array.push({
            face: translateFace(card[0]),
            number: card.slice(1)
        })
    });
}

function userHasCardInHand(card, hand) {
    return hand.indexOf(parseStringOfCards(card)[0]) > -1;
}

function canThisCardBePlayed(channel, card, hand) {
    var topCard = _SUECA.GAME[channel].pulledCard;
    if (topCard.number !== 0) {
        return card.face === topCard.face ||
            _SUECA.GAME[channel].trumpFace === card.face && playerHasNoFaceCard(topCard.face, hand) ||
            playerHasNoFaceCard(topCard.face, hand);
    } else {
        return true;
    }
}

function getScoreOfCard(card) {
    var points;
    switch (card.face) {
        case 'A': points = 11; break;
        case '7': points = 10; break;
        case 'K': points = 4; break;
        case 'J': points = 3; break;
        case 'Q': points = 2; break;
    }
    return points;
}

function announceRoundWinner(cardsInTable, channel) {
    var team = {A: 0, B: 0};
    cardsInTable.forEach(function (play) {
        team[play.team].score += getScoreOfCard(play.card);
    });

    if (team.A > team.B) {
        _SUECA.GAME[channel].TEAMSCORE.A += team.A + team.B;
    } else if (team.A < team.B) {
        _SUECA.GAME[channel].TEAMSCORE.B += team.B + team.A;
    }
}

function playCard(channel, card, nick, nickIndex) {
    var nextInLine = nickIndex - 1;

    if (!userHasCardInHand(card, nick.hand)) {
        Eventer.client.notice(nick.nick, readableHandString(nick.hand));
        Eventer.client.say(channel, nick.nick + ', não tens essa carta.');
        return false;
    }

    if (!canThisCardBePlayed(channel, card, nick.hand)) {
        Eventer.client.say(channel, 'Essa carta não pode ser jogada');
        return false;
    }

    _SUECA.GAME[channel].tabledCards.push({team: nick.team, card: parseStringOfCards(card)[0]});
    _SUECA.GAME[channel].whosTurn = (nextInLine === -1) ? _SUECA.GAME[channel].PLAYERS[3].nick : _SUECA.GAME[channel].PLAYERS[nextInLine].nick;
    _SUECA.GAME[channel].playedCards += 1;

    if (_SUECA.GAME[channel].playedCards === 4) {
        announceRoundWinner(_SUECA.GAME[channel].tabledCards, channel);
        _SUECA.GAME[channel].tabledCards = [];
        _SUECA.GAME[channel].pulledCard = {face: '', number: 0};
        _SUECA.GAME[channel].totalPlayedCards += _SUECA.GAME[channel].playedCards;
        _SUECA.GAME[channel].playedCards = 0;
    }

    if (_SUECA.GAME[channel].totalPlayedCards === 40) {
        Eventer.client.say(channel, 'A ultima carta foi jogada. Ganhou a Equipa ' + (_SUECA.GAME[channel].TEAMSCORE.A > _SUECA.GAME[channel].TEAMSCORE.B) ? 'A' : 'B');
        endGame(channel);
    } else {
        Eventer.client.say(channel, nick.nick + ' jogou ' + card + '; ' + _SUECA.GAME[channel].whosTurn + ', joga.');
    }
}

function isValidCard(card) {
    card = card.match(/(^[Cc](opas?|OPAS?)|^[Oo](uros?|UROS?)|^[Pp](aus?|AUS?)|^[Ee](spadas?|SPADAS?)|^[COPEcope])(\d|[AKJQakjq])/g);
    card = card[0].replace(/((opas?)|(uros?)|(aus?)|(spadas?)|(OPAS?)|(UROS?)|(AUS?)|(SPADAS?))/g,'');
    card = parseStringOfCards(card) || false;
    return card;
}

function triggerPlayEvent(nick, channel, message) {
    var card, nickIndex = false;
    message = message.split(' ');

    if (!_SUECA.GAME[channel]) {
        return false;
    }

    card = isValidCard(message[1]);

    _SUECA.GAME[channel].PLAYERS.some(function(object, index){
        if (object.nick.toLowerCase() === nick.toLowerCase()) {
            nick = object;
            nickIndex = index;
            return true;
        }
    });

    if (!nick.hand || !nickIndex) {
        Eventer.client.say(channel, nick + ', tu não estás a jogar');
        return false;
    }

    playCard(channel, card, nick, nickIndex);
}

function choosePlayerTeam(playerList) {
    var team = {a: 0, b: 0};
    playerList.forEach(function(player){
        if (player.team === 'A') {
            team.a += 1;
        } else {
            team.b += 1;
        }
    });
    if (team.a > team.b) {
        return 'B';
    } else {
        return 'A';
    }
}

function findPlayer(nick, channel) {
    var found;
    _SUECA.GAME[channel].PLAYERS.some(function (player) {
        if (player.nick === nick) {
            found = player.nick;
            return true;
        }
    });

    return found;
}

function parseSuecaCommand(nick, channel, message) {
    message = message.split(' ');
    var channelName, team;

    if (message[1] === 'start') {
        channelName = startNewGame(nick);
        if (channelName) {
            Eventer.client.say(channel, 'Foi criado o ' + channelName + ' - O jogo irá começar dentro de 1m');
        } else {
            Eventer.client.say(channel, 'Não foi possivel criar o canal...');
        }
    }

    if (message[1] === 'join' && _SUECA.GAME[channel]) {
        if (!findPlayer(nick, channel)) {
            team = choosePlayerTeam(_SUECA.GAME[channel].PLAYERS);
            _SUECA.GAME[channel].PLAYERS.push({nick: nick, hand: [], team: team});
            Eventer.client.say(channel, nick + ' entra para a equipa ' + team);
        } else {
            Eventer.client.say(channel, nick + ' já estás em jogo, equipa ' + findPlayer(nick).team);
        }
    }

    if (!message[1]) {
        Eventer.client.say(channel, 'Começar um novo jogo .sueca start');
        Eventer.client.say(channel, 'jogar uma carta .spl <naipe><numero>; ex: .spl copas7');
    }
}

SUECA.prototype.initialize = function (EventService) {
    Eventer = EventService;
    _SUECA = this;

    Eventer.catchEvent('message#','.sueca', parseSuecaCommand);
    Eventer.catchEvent('message#','.spl', triggerPlayEvent);
};

SUECA.prototype.rehasher = function () {
    Eventer.releaseEvent('message#','.sueca');
    Eventer.releaseEvent('message#','.spl');
};