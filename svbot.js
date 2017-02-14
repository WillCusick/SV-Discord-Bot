/**
 * Created by Doge on 12/13/2016.
 */
var Discord = require("discord.js");
var fs = require("fs");
var request = require("request");
var moment = require('moment');
var cards = require('./modules/cards');
var display = require('./modules/displayFunc');
var mongo = require('./modules/mongo');

var bot = new Discord.Client();

var loginToken = process.env.SV_DISCORD_TOKEN;
var blacklist = process.env.DISC_BLACKLIST.split(";");
var prefix = "!";
var messgQ = {};
const Q_SIZE = 50;
const DISC_INV = "https://discord.gg/ZJxsfBm";


function logCommand(msg) {
    let toRet = moment().format("YY-MM-DD--HH-mm-ss") + ":";
    if (msg.guild) {
        toRet += msg.guild.name + "; " + msg.author.username;
    } else {
        toRet += "PM; " + msg.author.username;
    }
    console.log(toRet + "; " + msg.content);
}

bot.on("message", msg => {
    if (msg.content.startsWith(prefix) &&
        msg.content.length > 1 && !msg.author.bot) {
        if (msg.guild && blacklist.indexOf(msg.guild.id) > -1) {
            console.log("Blocked:", msg.guild.name, ";", msg.content);
            return;
        }
        try {
            let args = msg.content.substring(1).split(" ");
            let command = args[0].toLowerCase();
            logCommand(msg);
            if (["card-name", "name"].indexOf(command) > -1) {
                cardNameCommand(args, msg, false);
            } else if (["card-search", "card", "search"].indexOf(command) > -1) {
                cardSearchCommand(args, msg, false);
            } else if (["flair"].indexOf(command) > -1) {
                cardSearchCommand(args, msg, false, display.displayFlair);
            } else if (["img"].indexOf(command) > -1) {
                cardSearchCommand(args, msg, false, display.displayImg);
            } else if (["evoimg", "imgevo", "evo"].indexOf(command) > -1) {
                cardSearchCommand(args, msg, true, display.displayImg);
            } else if (["altimg", "imgalt", "alt"].indexOf(command) > -1) {
                cardSearchCommand(args, msg, false, display.displayAltImg);
            } else if (["altevo", "evoalt", "altevoimg"].indexOf(command) > -1) {
                cardSearchCommand(args, msg, true, display.displayAltImg);
            } else if (["voice"].indexOf(command) > -1) {
                cardSearchCommand(args.slice(2), msg, false, display.getVoice.bind(null, args[1], args[2]));
            } else if (["reddit", "subreddit"].indexOf(command) > -1) {
                linkToReddit(msg);
            } else if (["discord", "do"].indexOf(command) > -1) {
                linkToDiscord(msg);
            } else if (["stream", "streams", "twitch", "strim"].indexOf(command) > -1) {
                linkToTwitch(msg);
            } else if (["tournament", "tournaments", "tourney", "tourneys", "battlefy"].indexOf(command) > -1) {
                linkToBattlefy(msg);
            } else if (["steam"].indexOf(command) > -1) {
                linkToSteam(msg);
            } else if (memeDict.hasOwnProperty(command)) {
                meme(memeDict[command], msg);
            } else if (["help", "man"].indexOf(command) > -1) {
                helpCommand(msg);
            } else if (command == "howmanyguilds") {
                checkGuilds(msg);
            } else if (msg.member && msg.member.permissions.hasPermission("MANAGE_MESSAGES")) {
                if (command == "clean") {
                    cleanChannel(msg, msg.channel);
                } else if (["welcome"].indexOf(command) > -1) {
                    mongo.welcomeToggle(msg.guild.id, args, showToggled.bind(null, msg));
                } else {
                    cardSearchCommand(["card-search"].concat(args), msg);
                }
            } else {
                cardSearchCommand(["card-search"].concat(args), msg);
            }
        } catch (err) {
            console.log(
                "Had error processing", msg.content, " error:", err
            );
        }
    }
});

var memeDict = {
    "sparta":"sv/sparta.jpg"
};

bot.on('ready', () => {
    console.log(`Logged on to ${bot.guilds.map(x => {
        return x.name;
    })}`);

    // bot.user.setAvatar('icons/gobu.png');
    bot.user.setGame("Shadowverse");
});

bot.on("guildMemberAdd", (member) => {
    mongo.getWelcomeToggle(member.guild.id, function (toggle) {
        if (toggle) {
            sendMessage(member.guild.defaultChannel, `Welcome, ${member.user.username}!`);
        }
    });
});

bot.on("disconnected", () => {
    bot.login(loginToken);
});

//MESSAGE HANDLING

function sendMessage(channel, message) {
    channel.sendMessage(message)
        .then(message => {
            addMessageToQueue(channel, message);
        })
        .catch(console.log);
}

function addMessageToQueue(channel, message) {
    let channel_id = channel.id;
    if (!messgQ[channel_id]) {
        messgQ[channel_id] = {
            'index': -1,
            'queue': []
        };
    }
    let queue = messgQ[channel_id];
    queue.index = (queue.index + 1) % Q_SIZE;
    if (queue.queue.length == Q_SIZE) {
        queue.queue[queue.index] = message;
    } else {
        queue.queue.push(message);
    }
}

function cleanChannel(msg, channel) {
    let queue = messgQ[channel.id];
    if (queue) {
        for (var i = 0; i < queue.queue.length; i++) {
            let message = queue.queue[i];
            message.delete();
        }
        messgQ[channel.id] = null;
    }
    sendMessage(
        channel,
        "Cleaned messages"
    );
}

function showToggled(msg, success, isToggle) {
    if (!success) {
        sendMessage(msg.channel, "Failed to set welcome toggle.");
    } else {
        if (isToggle) {
            sendMessage(msg.channel, "Set welcome toggle to ON.");
        } else {
            sendMessage(msg.channel, "Set welcome toggle to OFF.");
        }
    }
}

//CARD COMMANDS

function cardNameCommand(args, msg, isEvo) {
    let subname = args.slice(1).join(" ").toLowerCase();
    let cardNames = Object.keys(cards.cardData).filter(function (name) {
        return name.includes(subname);
    });
    outputCards(msg, cardNames, isEvo, display.displayCombatInfo);
}


function cardSearchCommand(args, msg, isEvo, displayFunc = display.displayCombatInfo) {
    let cardNames = Object.keys(cards.cardData); //card names are stored as lower
    givenSearch = args.slice(1).join(" ").toLowerCase();
    for (var ci = 0; ci < cardNames.length; ci++) {
        if (cardNames[ci] == givenSearch) {
            outputCards(msg, [cardNames[ci]], isEvo, displayFunc);
            return;
        }
    }
    for (var i = 1; i < args.length; i++) {
        cardNames = cardNames.filter(function (cardName) {
            return cards.doesTermMatchCard(args[i], cardName);
        });
    }
    outputCards(msg, cardNames, isEvo, displayFunc);
}


function outputCards(msg, cardNames, isEvo, displayFunc) {
    if (cardNames.length == 1) {
        sendMessage(msg.channel, displayFunc(cardNames[0], isEvo));
    } else if (cardNames.length > 1 && cardNames.length <= 32) {
        sendMessage(
            msg.channel,
            "I found these cards for you: " +
            cardNames.map(function (cardName) {
                return cards.cardData[cardName].name;
            }).join(", ")
        );
    } else if (cardNames.length > 32) {
        sendMessage(
            msg.channel,
            "I found " + cardNames.length + " cards. Could you be more specific?"
        );
    } else {
        sendMessage(
            msg.channel,
            "I can't find that card."
        );
    }
}

//LINK COMMANDS

function helpCommand(msg) {
    msg.author.sendMessage(
        "__!name__ _name_\n" +
        "Finds card(s) with the given name\n" +
        "\tAlternate forms: !card-name\n" +
        "__!card__ _term1 term2_...\n" +
        "Finds card(s) that match the given terms\n" +
        "\tAlternate forms: !search, !card-search, !\n" +
        "__!flair__ _term1 term2_...\n" +
        "Shows card flair text for the card that matches the terms\n" +
        "__!img__ _term1 term2_...\n" +
        "Shows the card image for the card that matches the terms\n" +
        "\tEvolved search: !evoimg, !imgevo, !evo\n" +
        "\tAlternate image search: !alt, !altimg, !imgalt\n" +
        "\tAlternate evolved image search: !evoalt, !altevo, !altevoimg\n" +
        "__!voice__ _lang type term1 term2_...\n" +
        "Gets a link from usamin.love for a card's voice.\n" +
        "\tProvide E or J for language, and SUMMON, ATTACK, EVOLVE, DEATH, EFFECT, or ALL for type.\n" +
        "__!reddit__, __!discord__, __!twitch__, __!tourneys__\n" +
        "Returns relevant links to other Shadowverse resources\n\n" +
        "__!clean__\n" +
        `Deletes the last ${Q_SIZE} messages by this bot. Requires mod permissions.\n` +
        "__!welcome__\n" +
        `Toggles the welcome message. Add TRUE/FALSE to explicitly toggle. Requires mod permissions.\n` +
        "\nPlease report any issues to ElDynamite#4773"
    );
    sendMessage(msg.channel, `${msg.author.username}, I've sent you a list of commands via PM.`);
}


function linkToReddit(msg) {
    sendMessage(msg.channel,
        "Shadowverse Subreddit:\n\thttps://www.reddit.com/r/shadowverse/");
}

function linkToDiscord(msg) {
    sendMessage(msg.channel,
        `Shadowverse Discord:\n\t${DISC_INV}`);
}

function linkToTwitch(msg) {
    sendMessage(msg.channel,
        "Shadowverse on Twitch:\n\thttps://www.twitch.tv/directory/game/Shadowverse");
}

function linkToBattlefy(msg) {
    sendMessage(msg.channel,
        "Shadowverse tournaments on Battlefy:\n\t\<https://battlefy.com/excelsior-gaming\>\n" +
        "Shadowverse tournament Discord servers:\n\tNA/EU: https://discord.gg/XggKWNw" +
        "\n\tSEA: https://discord.gg/79Vh6W3");
}

function linkToSteam(msg) {
    sendMessage(msg.channel,
        "Shadowverse on Steam:\n\thttp://store.steampowered.com/app/453480/"
    );
}

function meme(imgLink, msg) {
    sendMessage(msg.channel,
        "http://www.bagoum.com/images/memes/" + imgLink);
}

//INIT

function initializeData(callback) {
    console.log("Starting...");
    cards.buildCardData(function (err) {
        if (err) {
            return callback(err);
        }
        return callback(null);
    });
}

initializeData((err) => {
    if (err) {
        return console.log(err);
    }
    bot.login(loginToken);
});