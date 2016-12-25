/**
 * Created by Doge on 12/13/2016.
 */
var Discord = require("discord.js");
var request = require("request");
var fs = require("fs");

var bot = new Discord.Client();

var loginToken = process.env.SV_DISCORD_TOKEN;
var prefix = "!";
var cardData = {};
var messgQ = {};
const Q_SIZE = 50;
const DISC_INV = "https://discord.gg/ZJxsfBm";


bot.on("message", msg => {
    if (msg.content.startsWith(prefix) &&
        msg.content.length > 1 && !msg.author.bot) {
        try {
            let args = msg.content.substring(1).split(" ");
            let command = args[0].toLowerCase();
            console.log("Executing:", msg.content);
            if (["card-name", "name"].indexOf(command) > -1) {
                cardNameCommand(args, msg, false);
            } else if (["card-search", "card", "search"].indexOf(command) > -1) {
                cardSearchCommand(args, msg, false);
            } else if (["flair"].indexOf(command) > -1) {
                cardSearchCommand(args, msg, false, displayFlair);
            } else if (["img"].indexOf(command) > -1) {
                cardSearchCommand(args, msg, false, displayImg);
            } else if (["evoimg", "imgevo", "evo"].indexOf(command) > -1) {
                cardSearchCommand(args, msg, true, displayImg);
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
            } else if (command == "clean") {
                cleanChannel(msg, msg.channel);
            } else if (command == "help") {
                helpCommand(msg);
            } else if (command == "howmanyguilds") {
                checkGuilds(msg);
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

var memeDict = {};

bot.on('ready', () => {
    console.log(`Logged on to ${bot.channels.map(x => {
        return x.name;
    })}`);

    // bot.user.setAvatar('icons/icon.png');
    bot.user.setGame("Shadowverse");
});

bot.on("guildMemberAdd", (member) => {
    sendMessage(member.guild.defaultChannel, `Welcome, ${member.user.username}!`);
});

bot.on("disconnected", () => {
    bot.login(loginToken);
});

//MESSAGE HANDLING

function checkGuilds(msg) {
    let gArray = bot.guilds.array();
    let totalUsers = 0;
    for (var ii=0;ii<gArray.length;ii++) {
        totalUsers += gArray[ii].memberCount;
    }
    sendMessage(msg.channel, `Logged onto ${gArray.length} servers with a total of ${totalUsers} members`);
}

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
    if (!msg.guild.roles.find("name", "Maids") || !msg.member.roles.has(msg.guild.roles.find("name", "Maids").id)) {
        sendMessage(
            channel,
            `${msg.author.username}, you do not have cleaning rights.`
        );
        return;
    }
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

//CARD COMMANDS

function cardNameCommand(args, msg, isEvo) {
    let subname = args.slice(1).join(" ").toLowerCase();
    let cardNames = Object.keys(cardData).filter(function (name) {
        return name.includes(subname);
    });
    outputCards(msg, cardNames, isEvo, sendFormattedCardCombatInfo);
}


function cardSearchCommand(args, msg, isEvo, displayFunc = sendFormattedCardCombatInfo) {
    let cardNames = Object.keys(cardData); //card names are stored as lower
    givenSearch = args.slice(1).join(" ").toLowerCase();
    for (var ci = 0; ci < cardNames.length; ci++) {
        if (cardNames[ci] == givenSearch) {
            outputCards(msg, [cardNames[ci]], isEvo, displayFunc);
            return;
        }
    }
    for (var i = 1; i < args.length; i++) {
        cardNames = cardNames.filter(function (cardName) {
            return doesTermMatchCard(args[i], cardName);
        });
    }
    outputCards(msg, cardNames, isEvo, displayFunc);
}

function displayImg(msg, cardName, isEvo) {
    let card = cardData[cardName];
    if (!isEvo) {
        sendMessage(msg.channel, card.baseData.img);
    } else if (card.hasEvo) {
        sendMessage(msg.channel, card.evoData.img);
    } else {
        sendMessage(msg.channel, "That card does not have an evolution!")
    }

}

function displayFlair(msg, cardName) {
    let card = cardData[cardName];
    formattedText = `**${card.name}**\n` +
        `*${card.baseData.flair}*` +
        ((card.hasEvo) ? (`\n\n*${card.evoData.flair}*`) : "");
    sendMessage(msg.channel, formattedText);
}
function sendFormattedCardCombatInfo(msg, cardName) {
    let card = cardData[cardName];
    var raceVal = "";
    if (card["race"] && card["race"] != "") {
        var racewords = card["race"].split(" ").map(x => {
            return x.substring(0, 1).toUpperCase() + x.substring(1).toLowerCase();
        });
        raceVal = ` (${racewords.join(" ")})`;
    }
    formattedText = `**${card.name}**` + `${raceVal}\n\t` +
        card.faction + " " + (card.type || "") + "\n\t" +
        card.expansion + " -- " + card.rarity + "\n" +
        "**Base**:       " +
        `${card.manaCost}pp` + ((card.type == "Follower") ? ` ${card.baseData.attack}/${card.baseData.defense}` : "") + "\n\t" +
        ((card.baseData.description) ? `*${card.baseData.description.replace(/\n/g, "\n\t")}*` : "");
    if (card.hasEvo) {
        formattedText += "\n**Evolved**:  " +
            `${card.manaCost}pp` + ((card.type == "Follower") ? ` ${card.evoData.attack}/${card.evoData.defense}` : "") + "\n\t" +
            ((card.evoData.description) ? `*${card.evoData.description.replace(/\n/g, "\n\t")}*\n` : "");
    }
    /* +
     dataSource.flair + "`\n";*/
    /*formattedText += card.manaCost + " mana";
     if (["Unit", "General"].indexOf(card.type) > -1) {
     formattedText += " " + card.attack + "/" + card.health;
     }*/
    //formattedText += dataSource.img;
    sendMessage(msg.channel, formattedText);
}

function outputCards(msg, cardNames, isEvo, displayFunc) {
    if (cardNames.length == 1) {
        displayFunc(msg, cardNames[0], isEvo);
    } else if (cardNames.length > 1 && cardNames.length <= 32) {
        sendMessage(
            msg.channel,
            "I found these cards for you: " +
            cardNames.map(function (cardName) {
                return cardData[cardName].name;
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

function doesTermMatchCard(term, cardName) {
    return cardData[cardName].searchableText.includes(term.toLowerCase());
}

function formatCardData(cards) {
    for (var cardName in cards) {
        if (!cards.hasOwnProperty(cardName)) {
            continue;
        }
        card = cards[cardName];
        card.searchableText = card.name + card.faction + card.baseData.description + card.evoData.description + `${card.manaCost}pp`;
        card.searchableText = card.searchableText.toLowerCase();
        cardData[cardName.toLowerCase()] = card;
    }
}

function buildCardData(callback) {
    request("http://bagoum.com/svcards.json", function (err, resp, body) {
        if (err) {
            return callback(err);
        }
        if (resp.statusCode != 200) {
            return callback("Invalid status code: " + resp.statusCode);
        }
        var cards = JSON.parse(body);
        formatCardData(cards);
        return callback(null);
    });
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
        "__!clean__\n" +
        `Deletes the last ${Q_SIZE} messages by this bot\n\n` +
        "__!reddit__, __!discord__, __!twitch__, __!tourneys__\n" +
        "Returns relevant links to other Shadowverse resources\n" +
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
        "Shadowverse tournaments on Battlefy:\n\thttps://battlefy.com/excelsior-gaming\n" +
        "Shadowverse tournament Discord server:\n\thttps://discord.gg/XggKWNw");
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
    buildCardData(function (err) {
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