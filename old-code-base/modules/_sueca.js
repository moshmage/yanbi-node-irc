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
    
    this.DEFAULTS = {
        maxPlayers: 4,
        maxPlaysPerRound: 4,
        gameStartTimeout: 60 * 1000,
        maxGames: 5,
        reportToChannel: '#mmDev',
        owner: 'r3dsmile'
    };
    
    this.GAME = {};
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
        string += card.face + '' + card.number;
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

function setTrumpFace() {
    var faces = "♥,♦,♣,♠".split(',');
    var rnd = Math.floor(Math.random() * (faces.length - 1));
    return faces[rnd];
}

function endGame(channelName) {
    Eventer.releaseEvent('join', channelName);
    Eventer.releaseEvent('part', channelName);
    Eventer.client.part(channelName);
    Eventer.client.say(_SUECA.DEFAULTS.reportToChannel, 'Jogo no ' + channelName + ' acabou.');
    delete _SUECA.GAME[channelName];
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
        lastTrumpPoint: 0,
        lastTrumpTeam: '',
        tabledCards: [],
        totalPlayedCards: 0,
        playedCards: 0,
        TEAMSCORE: {}
    };

    Eventer.client.join(channelName);
    Eventer.catchEvent('join', channelName, function(channel, nick) {
        if (nick !== Eventer.client.nick || _SUECA.GAME[channelName].PLAYERS.length <= 4) {
            Eventer.client.say(channelName, nick + ', está um jogo a começar. escreve ".sueca join"');
        }
    });
    
    Eventer.catchEvent('part', channelName, function(channel, nick) {
        if (_SUECA.GAME[channelName]) {
            if (findPlayer(nick, channel) && nick !== Eventer.client.nick) {
                if (Object.keys(Eventer.client.chans[channelName].users).length - 1 === 1) {
                    endGame(channelName);
                }
            } else if (Eventer.client.nick === nick) {
                endGame(channelName);
            }
        }
    });
    

    setTimeout(function startOrStop() {
        var starter;
        Eventer.releaseEvent('join', channelName);
        
        if (!_SUECA.GAME[channelName]) {
            return false;
        }
        
        if (_SUECA.GAME[channelName].PLAYERS.length < _SUECA.DEFAULTS.maxPlayers) {
            Eventer.client.say(channelName, 'O jogo parou por falta de jogadores');
            Eventer.client.part(channelName);
            delete _SUECA.GAME[channelName];
        } else {
            starter = Math.floor(Math.random() * (_SUECA.DEFAULTS.maxPlayers - 1));
            starter = _SUECA.GAME[channelName].PLAYERS[starter].nick;
            _SUECA.GAME[channelName].whosTurn = starter;
            _SUECA.GAME[channelName].trumpFace = setTrumpFace();

            Eventer.client.say(channelName, '\'Tou a dar as cartas..');
            dealHand(channelName);
            Eventer.client.say(channelName,  starter + ', começa. O trunfo é ' + _SUECA.GAME[channelName].trumpFace);
        }
    }, _SUECA.DEFAULTS.gameStartTimeout);

    return (_SUECA.GAME[channelName]) ? channelName : false;
}

function playerHasFaceCard(face, hand) {
    return hand.some(function (card) {
        return card.face === face.face || card.face === face;
    });
}

function parseStringOfCards(string) {
    var array = [];

    if (string) {
        string = string.split(', ');
        string.forEach(function (card) {
            array.push({
                face: translateFace(card[0]),
                number: card.slice(1)
            })
        });
    }

    return array;
}

function userHasCardInHand(card, hand) {
    return readableHandString(hand).indexOf(readableHandString([card])) > -1;
}

function canThisCardBePlayed(channel, card, hand) {
    var topCard = _SUECA.GAME[channel].pulledCard;

    if (topCard.number === 0) {
        return true;
    }

    if (card.face === topCard.face || _SUECA.GAME[channel].trumpFace === card.face && playerHasFaceCard(topCard.face, hand) === false) {
        return true
    }

    return (playerHasFaceCard(topCard.face, hand) === false);

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

    if (!_SUECA.GAME[channel].lastTrumpTeam) {
        if (team.A > team.B) {
            _SUECA.GAME[channel].TEAMSCORE.A += team.A + team.B;
            Eventer.client.say(channel, 'Equipa A levou a ronda');
        } else if (team.A < team.B) {
            _SUECA.GAME[channel].TEAMSCORE.B += team.B + team.A;
            Eventer.client.say(channel, 'Equipa B levou a ronda');
        } else {
            Eventer.client.say(channel, 'Nova ronda');
        }
    } else {
        _SUECA.GAME[channel].TEAMSCORE[_SUECA.GAME[channel].lastTrumpTeam] += team.B + team.A;
        Eventer.client.say(channel, 'Equipa ' +_SUECA.GAME[channel].lastTrumpTeam + ' levou a ronda');
    }
}

function removeCardFromHand(card, hand) {
    var i;
    hand.forEach(function(cardInHand, index) {
        if (cardInHand.face === card.face && cardInHand.number == card.number) {
            i = index;
        }
    });
    
    if (i >= 0) {
        hand.splice(i, 1);
    }

    return hand;
}

function playCard(channel, card, nick, nickIndex) {
    var nextInLine = nickIndex - 1, team = false, playersLength = _SUECA.GAME[channel].PLAYERS.length - 1;

    if (!userHasCardInHand(card, nick.hand)) {
        Eventer.client.notice(nick.nick, readableHandString(nick.hand));
        Eventer.client.say(channel, nick.nick + ', não tens essa carta.');
        return false;
    }

    if (!canThisCardBePlayed(channel, card, nick.hand)) {
        if (playerHasFaceCard(_SUECA.GAME[channel].pulledCard, nick.hand)) {
            Eventer.client.notice(nick.nick, readableHandString(nick.hand));
            Eventer.client.say(channel, 'Tens uma carta que podes jogar');
            return false;
        }
        Eventer.client.say(channel, 'Essa carta não pode ser jogada');
        return false;
    }

    if (_SUECA.GAME[channel].pulledCard.number === 0) {
        _SUECA.GAME[channel].pulledCard = card;
    }

    if (playerHasFaceCard(_SUECA.GAME[channel].pulledCard, nick.hand) && card.face !== _SUECA.GAME[channel].trumpFace) {
        team = nick.team === 'A' ? 'B' : 'A';
    }

    if (card.face === _SUECA.GAME[channel].trumpFace) {
        if (getScoreOfCard(card) > _SUECA.GAME[channel].lastTrumpPoint) {
            _SUECA.GAME[channel].lastTrumpPoint = getScoreOfCard(card);
            _SUECA.GAME[channel].lastTrumpTeam = nick.team;
        }
    }

    _SUECA.GAME[channel].tabledCards.push({team: team || nick.team, card: card});
    _SUECA.GAME[channel].whosTurn = (nextInLine === -1) ? _SUECA.GAME[channel].PLAYERS[playersLength].nick : _SUECA.GAME[channel].PLAYERS[nextInLine].nick;
    _SUECA.GAME[channel].playedCards += 1;
    _SUECA.GAME[channel].totalPlayedCards += _SUECA.GAME[channel].playedCards;
    
    if (_SUECA.GAME[channel].totalPlayedCards === 40) {
        Eventer.client.say(channel, 'A ultima carta foi jogada. Ganhou a Equipa ' + (_SUECA.GAME[channel].TEAMSCORE.A > _SUECA.GAME[channel].TEAMSCORE.B) ? 'A' : 'B');
        endGame(channel);
        return false;
    } else {
        _SUECA.GAME[channel].PLAYERS[nickIndex].hand = removeCardFromHand(card, nick.hand);
        Eventer.client.say(channel, nick.nick + ' jogou ' + readableHandString([card]) + '; ' + _SUECA.GAME[channel].whosTurn + ', joga.');
    }
    
    if (_SUECA.GAME[channel].playedCards === _SUECA.DEFAULTS.maxPlaysPerRound) {
        announceRoundWinner(_SUECA.GAME[channel].tabledCards, channel);
        _SUECA.GAME[channel].tabledCards = [];
        _SUECA.GAME[channel].pulledCard = {face: '', number: 0};
        
        _SUECA.GAME[channel].playedCards = 0;
        _SUECA.GAME[channel].lastTrumpPoint = 0;
        _SUECA.GAME[channel].lastTrumpTeam = '';
        _SUECA.GAME[channel].pulledCard = {number: 0};
    }
    
}

function isValidCard(card) {
    card = card.match(/(^[Cc](opas?|OPAS?)|^[Oo](uros?|UROS?)|^[Pp](aus?|AUS?)|^[Ee](spadas?|SPADAS?)|^[COPEcope])\s?([2-7]|[AKJQakjq])/g);
    
    if (!card) {
        return false;
    }
    
    card = card[0].replace(/((opas?)|(uros?)|(aus?)|(spadas?)|(OPAS?)|(UROS?)|(AUS?)|(SPADAS?))\s?/g,'').toUpperCase();
    card = parseStringOfCards(card) || false;
    return card;
}

function triggerPlayEvent(nick, channel, message) {
    var card, nickIndex = false;
    message = message.split(' ');
    
    if (message[2]) {
        message[1] += message[2];
    }
    
    if (!_SUECA.GAME[channel]) {
        return false;
    }

    if (!message[1]) {
        Eventer.client.say(channel, nick + 'You need to say the card..');
        return false;
    }

    if (nick !== _SUECA.GAME[channel].whosTurn) {
        Eventer.client.say(channel, nick + ', nao es tu a jogar.');
        return false;
    }

    card = isValidCard(message[1]);

    if (!card) {
        Eventer.client.say(channel, nick + 'Isso nao e uma carta..');
        return false;
    }

    _SUECA.GAME[channel].PLAYERS.some(function(object, index){
        if (object.nick.toLowerCase() === nick.toLowerCase()) {
            nick = object;
            nickIndex = index;
            return true;
        }
    });

    if (!nick) {
        Eventer.client.say(channel, nick.nick + ', tu nao estas a jogar');
        return false;
    }

    playCard(channel, card[0], nick, nickIndex);


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
            found = player;
            return true;
        }
    });

    return found;
}

function parseSuecaCommand(nick, channel, message) {
    message = message.split(' ');
    var channelName, team;

    if (message[1] === 'start') {
        
        if (Object.keys(_SUECA.GAME).length === _SUECA.DEFAULTS.maxGames) {
            Eventer.client.say(channel, 'Máximo de jogos atingido, espera um bocado..');
            return false;
        }
        
        channelName = startNewGame(nick);
        if (channelName) {
            Eventer.client.say(channel, 'Foi criado o ' + channelName + ' - O jogo irá começar dentro de ' + _SUECA.DEFAULTS.gameStartTimeout / 1000 + 's');
        } else {
            Eventer.client.say(channel, 'Não foi possivel criar o canal...');
        }
        return false;
    }

    if (message[1] === 'join' && _SUECA.GAME[channel]) {
        if (!findPlayer(nick, channel)) {
            if (_SUECA.GAME[channel].PLAYERS.length === _SUECA.DEFAULTS.maxPlayers) {
                Eventer.client.say(channel, nick + ' começa outro jogo, este esta cheio.');
                return false;
            }

            team = choosePlayerTeam(_SUECA.GAME[channel].PLAYERS);
            _SUECA.GAME[channel].PLAYERS.push({nick: nick, hand: [], team: team});
            Eventer.client.say(channel, nick + ' entra para a equipa ' + team);
        } else {
            Eventer.client.say(channel, nick + ' já estás em jogo, equipa ' + findPlayer(nick, channel).team);
            return false;
        }
    }
    
    if (message[1] === 'cartas' && _SUECA.GAME[channel]) {
        nick = findPlayer(nick, channel);
        if (nick.hand.length) {
            Eventer.client.notice(nick.nick, readableHandString(nick.hand));
        } else {
            Eventer.client.notice(nick.nick, 'Ainda nao tens cartas..');
        }
        
        return false;
    }
    
    if (message[1] === 'naipe' && _SUECA.GAME[channel]) {
        Eventer.client.say(channel, 'Naipe em jogo: ' + _SUECA.GAME[channel].pulledCard && _SUECA.GAME[channel].pulledCard.face || 'Nenhum naipe em jogo');
        return false;
    }
    
    if (message[1] === 'trunfo' && _SUECA.GAME[channel]) {
        Eventer.client.say(channel, 'Trunfo na mesa: ' + _SUECA.GAME[channel].trumpFace.face || _SUECA.GAME[channel].trumpFace);
        return false;
    }
    
    if (message[1] === 'quem' && _SUECA.GAME[channel]) {
        Eventer.client.say(channel, 'É a vez de ' + _SUECA.GAME[channel].whosTurn + ' jogar');
        return false;
    }
    
    if (message[1] === 'share' && !_SUECA.GAME[channel]) {
        if (nick.toLowerCase() === _SUECA.DEFAULTS.owner.toLowerCase()) {
            message[2] = (message[2].indexOf('#') > -1) ? message[2] : "#" + message[2];
            Eventer.client.join(message[2]);
            Eventer.client.say(message[2], 'A .sueca chegou :D');
        }
        
        return false;
    }
    
    if (!message[1]) {
        Eventer.client.say(channel, '.sueca <start|join|cartas|naipe|trunfo|quem>');
        Eventer.client.say(channel, 'jogar uma carta: .spl <naipe> <numero>');
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
    Eventer.client.say('#mmdev', 'Reload da sueca. A sair dos canais..');
    
    Object.keys(_SUECA.GAME).forEach(function (channel) {
        Eventer.client.part(channel);
    });
};