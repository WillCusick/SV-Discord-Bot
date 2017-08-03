/**
 * Created by Doge on 12/13/2016.
 */
var Discord = require("discord.js");
var fs = require("fs");
var request = require("request");
var cards = require('./modules/cards');
var display = require('./modules/displayFunc');
var mongo = require('./modules/mongo');
var log = require('./modules/logging');

var bot = new Discord.Client();

var loginToken = process.env.SV_DISCORD_TOKEN;
var blacklist = process.env.DISC_BLACKLIST.split(";");
var prefix = "!";
var messgQ = {};
var botUserQ = {};
var bypassID = process.env.DISC_BYPASSMOD.split(";"); //this gives supermod perms
var adminGuids = ["324802170031702017"]; //guilds where gobu serves special admin uses
var prebannedUsers = process.env.DISC_USERBLACKLIST.split(";");
//this only is applied to the admin guilds

const Q_SIZE = 50;
const DISC_INV = "https://discord.gg/sVapbKW";
const colors = {blue:"33023", green:"3997500", red:"16727100"};

function msgSpamCheck(msg) {
    return Array.from(msg.mentions.users).length > 3 || (false &&
        (msg.guild.id == "302976037929746442" && msg.member.id == "263929551632072706"));
}

function spamAlert(msg) {
    sendMessage(msg.guild.defaultChannel, `${msg.member.toString()} is possibly spamming.`);
}

bot.on("message", msg => {
    if (msgSpamCheck(msg)) {
        spamAlert(msg);
    }
    else if (msg.content.startsWith(prefix) &&
        msg.content.length > 1 && !msg.author.bot) {
        try {
            let args = msg.content.substring(1).split(" ");
            let command = args[0].toLowerCase();
            log.logCommand(msg);

            if (command == "destroy" && isSuperMod(msg.member)) {
            } else

            if (["card-name", "name"].indexOf(command) > -1) {
                cardNameCommand(args, msg, false);
            } else if (["randomcard"].indexOf(command) > -1) {
                randomCard(msg);
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
            } else if (["fullart", "full-art", "info"].indexOf(command) > -1) {
                cardSearchCommand(args, msg, false, display.fullCardLink);
            } else if (["deckcode", "code"].indexOf(command) > -1) {
                linkToDeckCode(msg, args[1]);
            } else if (["reddit", "subreddit"].indexOf(command) > -1) {
                linkToReddit(msg);
            } else if (["discord"].indexOf(command) > -1) {
                linkToDiscord(msg);
            } else if (["stream", "streams", "twitch", "strim"].indexOf(command) > -1) {
                linkToTwitch(msg);
            } else if (["tournament", "tournaments", "tourney", "tourneys", "battlefy"].indexOf(command) > -1) {
                linkToBattlefy(msg);
            } else if (["steam"].indexOf(command) > -1) {
                linkToSteam(msg);
            } else if (["bagoum"].indexOf(command) > -1) {
                linkToBagoum(msg);
            } else if (["tl", "tierlist"].indexOf(command) > -1) {
                linkToTierlist(msg);
            } else if (memeDict.hasOwnProperty(command)) {
                meme(memeDict[command], msg);
            } else if (["help", "man"].indexOf(command) > -1) {
                helpCommand(msg);
            } else if (["portal", "convert"].indexOf(command) > -1) {
                convertPortal(msg, args, true);
            } else if (isSuperMod(msg.member)) {
                if (["stahp"].indexOf(command) > -1) {
                    updateUsername(msg, args);
                } else if (["destroy"].indexOf(command) > -1) {
                    console.log("Logging out.");
                    bot.destroy();
                }
            } else if (isModEquiv(msg.member)) {
                if (command == "clean") {
                    cleanChannel(msg, msg.channel);
                } else if (["welcome"].indexOf(command) > -1) {
                    mongo.welcomeToggle(msg.guild.id, args, showToggled.bind(null, msg));
                } else {
                    cardSearchCommand(["card-search"].concat(args), msg);
                }
            }else {
                cardSearchCommand(["card-search"].concat(args), msg);
            }
        } catch (err) {
            log.log(`Couldn't process ${msg.content} on ${(msg.guild) ? msg.guild.name : "PM"} by ${msg.author.name}`);
        }
    } else if (msg.content.includes("shadowverse-portal") && !msg.author.bot) {
        convertPortal(msg);
    }
});

function isModEquiv(member) {
    return member && (bypassID.indexOf(member.id) > -1 || member.permissions.has("MANAGE_MESSAGES"));
}
function isSuperMod(member) {
    return (bypassID.indexOf(member.id) > -1);
}

var memeDict = {
    "sparta":"sv/sparta.jpg",
    "ouroboroost":"sv/ouroboroost.png",
    "thishead":"sv/thishead.png"
};

function updateUsername(msg, args) {
    botUserQ[msg.guild.id].setNickname(args.slice(1).join(" ") || "SV.BagoumBot");
}

bot.on('ready', () => {
    log.log(`Logged on to ${bot.guilds.map(x => {
        x.fetchMember(bot.user).then(botmember => {
            botUserQ[x.id] = botmember;
            botmember.setNickname("SV.BagoumBot");
        });
        return x.name;
    })}`);
    Array.from(bot.guilds.values()).forEach(x => {
        if (blacklist.indexOf(x.id) > -1) {
            log.log("Found blacklisted guild on login: " + x.name + " " + x.id);
            x.leave();
        }
    });
    bot.user.setAvatar('icons/gobu.jpg');
    bot.user.setGame("discord.me/svbagoum");
});
bot.on("guildCreate", (guild) => {
    log.log("Joined " +  guild.name + " " + guild.id);
    if (blacklist.indexOf(guild.id) > -1) {
        log.log("Blacklisted guild! Leaving.");
        guild.leave();
    } else {
        guild.fetchMember(bot.user).then(botmember => {
            botUserQ[guild.id] = botmember;
        });
        sendMessage(guild.defaultChannel, "Shadowverse Bot has successfully joined the server gobu!", true);
    }
});
bot.on("guildMemberAdd", (member) => {
    if (adminGuids.indexOf(member.guild.id) > -1 && prebannedUsers.indexOf(member.id) > -1) {
        member.ban();
        log.log("Prebanned " + member.user.username + "(" + member.id + ") from " + member.guild.name);
    } else {
        mongo.getWelcomeToggle(member.guild.id, function (toggle) {
            if (toggle) {
                if (adminGuids.indexOf(member.guild.id) > -1) {
                    sendMessage(member.guild.defaultChannel, `Welcome gobu, ${member.toString()}!\nThis is the official Discord server for sv.bagoum.com. If you'd like to inquire about the website, contact ElDynamite. Otherwise, enjoy your stay!`);

                } else {
                    sendMessage(member.guild.defaultChannel, `Welcome gobu, ${member.toString()}!`);
                }
            }
        });
    }
});

bot.on("disconnect", () => {
    log.log("Bot disconnected!");
    bot.login(loginToken);
});

//MESSAGE HANDLING

function sendMessage(channel, message, overridePermCheck=false, color="green") {
    if (channel instanceof Discord.TextChannel) {
        let gid = channel.guild.id;
        if (!overridePermCheck &&
            (!botUserQ.hasOwnProperty(gid) || !channel.permissionsFor(botUserQ[gid]).has(["SEND_MESSAGES"]))) {
            log.log(`Could not send message. Guild: ${channel.guild.name} Channel: ${channel.name}`);
            return;
        }
    }
    channel.send(options={embed:{description:message, color:colors[color]}})
        .then(message => {
            addMessageToQueue(channel, message);
        })
        .catch(console.log);
}
function sendEmbed(channel, embed, overridePermCheck=false, color="", footer=true) {
    if (channel instanceof Discord.TextChannel) {
        let gid = channel.guild.id;
        if (!overridePermCheck &&
            (!botUserQ.hasOwnProperty(gid) || !channel.permissionsFor(botUserQ[gid]).has(["SEND_MESSAGES"]))) {
            log.log(`Could not send embed. Guild: ${channel.guild.name} Channel: ${channel.name}`);
            return;
        }
    }
    if (color) {
        embed.color = colors[color];
    }
    if (footer) {
        embed.footer = {
            icon_url: "http://sv.bagoum.com/logo_white.png",
            text: "Bot by Bagoum: sv.bagoum.com"
        }
    }
    channel.send(options={embed:embed})
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
        "Cleaned messages gobu."
    );
}

function showToggled(msg, success, isToggle) {
    if (!success) {
        sendMessage(msg.channel, "Couldn't set welcome toggle gobu!", undefined, "red");
    } else {
        if (isToggle) {
            sendMessage(msg.channel, "Set welcome toggle to ON gobu.");
        } else {
            sendMessage(msg.channel, "Set welcome toggle to OFF gobu.");
        }
    }
}

//CARD COMMANDS

function cardNameCommand(args, msg, isEvo) {
    let subname = args.slice(1).join(" ").toLowerCase();
    let cardNames = cards.cardsList.filter(function (name) {
        return name.includes(subname);
    });
    outputCards(msg, cardNames, isEvo, display.displayCombatInfo);
}


function cardSearchCommand(args, msg, isEvo, displayFunc = display.displayCombatInfo) {
    let cardNames = cards.cardsList; //card names are stored as lower
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

function randomCard(msg) {
    outputCards(msg, [cards.cardsList[cards.cardsList.length * Math.random() << 0]], false, display.displayCombatInfo);
}

function outputCards(msg, cardNames, isEvo, displayFunc) {
    if (cardNames.length == 1) {
        sendEmbed(msg.channel, displayFunc(cardNames[0], isEvo), undefined, "green");
        //TODO
    } else if (cardNames.length > 1 && cardNames.length <= 32) {
        sendMessage(
            msg.channel,
            "I found these cards gobu: " +
            cardNames.map(function (cardName) {
                return cards.cardData[cardName].name;
            }).join(", ")
        );
    } else if (cardNames.length > 32) {
        sendMessage(
            msg.channel,
            "I found " + cardNames.length + " cards. That's too many gobu!"
        );
    } else {
        sendMessage(
            msg.channel,
            "I can't find that card gobu."
        );
    }
}

function convertPortal(msg, args=[], forceResponse=false) {
    let content = msg.content;
    if (args.length > 0) {
        content = args[1];
    }
    var execPortal = /(shadowverse\-portal\.com\/deck\/.+)/.exec(content);
    if (execPortal) {
        request.post({
            url: "http://sv.bagoum.com/hashify",
            form: {link:execPortal[1]}
        }, function(err, res, body) {
            if (!err && res.statusCode == 200) {
                if (body) {
                    sendEmbed(msg.channel, {fields:[{
                        name:"Shadowverse-Portal link detected!",
                        value:"Consider using the Bagoum deckbuilder instead. [Here's your deck](http://sv.bagoum.com/deckbuilder" + body + ")."
                    }]}, null, "blue", false);
                } else if (forceResponse) {
                    sendMessage(msg.channel, `The URL "${content}" could not be read.`, null, "red");
                }
            } else {
                console.log("Failed to convert", execPortal[1]);
            }
        });
    } else if (forceResponse) {
        sendMessage(msg.channel, `The URL "${content}" could not be read.`, null, "red")
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
            "__!randomcard__\n" +
            "Gets a random card\n" +
        "__!flair__ _term1 term2_...\n" +
        "Shows card flair text for the card that matches the terms\n" +
        "__!img__ _term1 term2_...\n" +
        "Shows the card image for the card that matches the terms\n" +
        "\tEvolved search: !evoimg, !imgevo, !evo\n" +
        "\tAlternate image search: !alt, !altimg, !imgalt\n" +
        "\tAlternate evolved image search: !evoalt, !altevo, !altevoimg\n" +
        "__!voice__ _lang type term1 term2_...\n" +
        "Gets a link from Bagoum for a card's voice.\n" +
        "\tProvide E or J for language, and SUMMON, ATTACK, EVOLVE, DEATH, EFFECT, or ALL for type.\n" +
        "__!fullart__ _term 1 term2_...\n" +
        "Links to the full card art and information for the card that matches the terms\n" +
        "__!deckcode__ _deck code_\n" +
        "Get a deckbuilder link with the deck code\n" +
        "__!portal__ _sv-portal link_\n" +
        "Converts a Shadowverse-Portal deck link\n" +
        "__!reddit__, __!bagoum__, __!discord__, __!twitch__, __!tourneys__\n" +
        "Returns relevant links to other Shadowverse resources\n\n" +
        "__!clean__\n" +
        `Deletes the last ${Q_SIZE} messages by this bot. Requires mod permissions.\n` +
        "__!welcome__\n" +
        `Toggles the welcome message. Add TRUE/FALSE to explicitly toggle. Requires mod permissions.\n` +
        `\nPlease report any issues to ElDynamite#4773 on the Bagoum server: ${DISC_INV}`
    );
    sendMessage(msg.channel, `${msg.author.username}, I've sent you a list of commands via PM gobu.`);
}

function linkToDeckCode(msg, code) {
    sendMessage(msg.channel, `Deck for code ${code}: http://sv.bagoum.com/portal/${code}`)
}

function linkToReddit(msg) {
    sendMessage(msg.channel,
        "Shadowverse Subreddit:\n\thttps://www.reddit.com/r/shadowverse/");
}

function linkToDiscord(msg) {
    sendMessage(msg.channel,
        `Interested in the bot or our Shadowverse resources? Come hang with us over at the Shadowverse Bagoum Discord!\n\t${DISC_INV}`);
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

function linkToBagoum(msg) {
    sendMessage(msg.channel,
        "Visit Bagoum for all your Shadowverse needs!\n\thttp://sv.bagoum.com\n" +
            `Or come visit us at our Discord server!\n\t${DISC_INV}`
    );
}

function linkToTierlist(msg) {
    sendMessage(msg.channel,
        "ExG's tournament tier list:\n\thttp://teamexg.com/tierlist"
    )
}

function meme(imgLink, msg) {
    sendEmbed(msg.channel,
        {image:{url:"http://www.bagoum.com/images/memes/" + imgLink}});
}

//INIT

function initializeData(callback) {
    log.log("Starting...");
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