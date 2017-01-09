/**
 * Created by Doge on 1/9/2017.
 */

var cards = require('./cards');
module.exports = {};



function displayImg(cardName, isEvo) {
    let card = cards.cardData[cardName];
    if (!isEvo) {
        return card.baseData.img;
    } else if (card.hasEvo) {
        return card.evoData.img;
    } else {
        return "That card does not have an evolution!";
    }
}
module.exports.displayImg = displayImg;

function displayAltImg(cardName, isEvo) {
    let card = cards.cardData[cardName];
    if (!isEvo && card.baseData.altimg != null) {
        return card.baseData.altimg;
    } else if (card.hasEvo && card.evoData.altimg != null) {
        return card.evoData.altimg;
    } else {
        return "That card does not have an alternate image!";
    }
}
module.exports.displayAltImg = displayAltImg;

function displayFlair(cardName) {
    let card = cards.cardData[cardName];
    formattedText = `**${card.name}**\n` +
        `*${card.baseData.flair}*` +
        ((card.hasEvo) ? (`\n\n*${card.evoData.flair}*`) : "");
    return formattedText;
}
module.exports.displayFlair = displayFlair;

function displayCombatInfo(cardName) {
    let card = cards.cardData[cardName];
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
    return formattedText;
}
module.exports.displayCombatInfo = displayCombatInfo;

function getVoice(ENJP, type, cardName) {
    let linkName = lowerUnderscoreCondense(cardName);
    ENJP = ENJP.toLowerCase();
    type = type.toLowerCase();
    let langPref = "j_";
    if (["en", "eng", "e", "english", "eigo"].indexOf(ENJP) > -1) {
        langPref = "e_";
    }
    if (["summon", "play"].indexOf(type) > -1) {
        return `http://usamin.love/card/${linkName}/${langPref}summon.wav`;
    } else if (["attack", "atk"].indexOf(type) > -1) {
        return `http://usamin.love/card/${linkName}/${langPref}attack.wav`;
    } else if (["evo", "evolve"].indexOf(type) > -1) {
        return `http://usamin.love/card/${linkName}/${langPref}evolve.wav`;
    } else if (["death", "die"].indexOf(type) > -1) {
        return `http://usamin.love/card/${linkName}/${langPref}death.wav`;
    } else if (["effect"].indexOf(type) > -1) {
        return `http://usamin.love/card/${linkName}/${langPref}effect.wav`;
    }
    return `http://usamin.love/sv.html#${cardName.replace(/ /g, "_")}`;
}
module.exports.getVoice = getVoice;

function lowerUnderscoreCondense(str) {
    return str.replace(/ /g, "_").replace(/\W/g, "");
}