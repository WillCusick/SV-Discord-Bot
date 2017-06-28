/**
 * Created by Doge on 1/9/2017.
 */

var cards = require('./cards');
module.exports = {};

//all display functions return embed objects.

function displayImg(cardName, isEvo) {
    let card = cards.cardData[cardName];
    if (!isEvo) {
        return {image: {url: card.baseData.img}};
    } else if (card.hasEvo) {
        return {image: {url: card.evoData.img}};
    } else {
        return {description: "That card does not have an evolution!"};
    }
}
module.exports.displayImg = displayImg;

function displayAltImg(cardName, isEvo) {
    let card = cards.cardData[cardName];
    if (!isEvo && card.baseData.altimg != null) {
        return {image: {url: card.baseData.altimg}};
    } else if (card.hasEvo && card.evoData.altimg != null) {
        return {image: {url: card.evoData.altimg}};
    } else {
        return {description: "That card does not have an alternate image!"};
    }
}
module.exports.displayAltImg = displayAltImg;

function displayFlair(cardName) {
    let card = cards.cardData[cardName];
    formattedText = `*${card.baseData.flair}*` +
        ((card.hasEvo) ? (`\n\n*${card.evoData.flair}*`) : "");
    return {title: card.name, description: formattedText};
}
module.exports.displayFlair = displayFlair;

function displayCombatInfo(cardName) {
    let card = cards.cardData[cardName];
    cardName = cards.cardData[cardName].name;
    var raceVal = "";
    if (card["race"] && card["race"] != "") {
        var racewords = card["race"].split(" ").map(x => {
            return x.substring(0, 1).toUpperCase() + x.substring(1).toLowerCase();
        });
        raceVal = ` (${racewords.join(" ")})`;
    }
    fields = [];
    formattedText = `${card.manaCost}pp ` + card.rarity + " " + card.faction + " " + (card.type || "") + "\n\t" + card.expansion;
    fields.push({
        name: "**Base**: 　 　" + ((card.type == "Follower") ? ` ${card.baseData.attack}/${card.baseData.defense}` : ""),
        value: ((card.baseData.description) ? `*${card.baseData.description.trim(" ")}*` : "")
    });
    if (card.hasEvo) {
        fields.push({
            name: "\n**Evolved**:　" + ((card.type == "Follower") ? ` ${card.evoData.attack}/${card.evoData.defense}` : ""),
            value: ((card.evoData.description) ? `*${card.evoData.description.trim(" ")}*\n` : "")
        });
    }
    return {
        title: `**${card.name}**` + `${raceVal}\n\t`,
        description: formattedText,
        fields: fields,
        thumbnail: {url: encodeURI("http://sv.bagoum.com/images/sv/smallCard/en/" + cardName + ".png")}
    };
}
module.exports.displayCombatInfo = displayCombatInfo;

function getVoice(ENJP, type, cardName) {
    let linkName = lowerUnderscoreCondense(cardName);
    let cid = cards.cardData[cardName].id;
    cardName = cards.cardData[cardName].name;
    ENJP = ENJP.toLowerCase();
    type = type.toLowerCase();
    let langPref = "j";
    if (["en", "eng", "e", "english", "eigo"].indexOf(ENJP) > -1) {
        langPref = "e";
    } else if (["ko", "kor", "k", "korean"].indexOf(ENJP) > -1) {
        langPref = "k";
    }
    if (["summon", "play"].indexOf(type) > -1) {
        return {
            title: "Summon voice for " + cardName,
            description: `http://sv.bagoum.com/voice/${langPref}/vo_${cid}_1.mp3`
        };
    } else if (["attack", "atk"].indexOf(type) > -1) {
        return {
            title: "Attack voice for " + cardName,
            description: `http://sv.bagoum.com/voice/${langPref}/vo_${cid}_2.mp3`
        };
    } else if (["evo", "evolve"].indexOf(type) > -1) {
        return {
            title: "Evolve voice for " + cardName,
            description: `http://sv.bagoum.com/voice/${langPref}/vo_${cid}_3.mp3`
        };
    } else if (["death", "die"].indexOf(type) > -1) {
        return {
            title: "Death voice for " + cardName,
            description: `http://sv.bagoum.com/voice/${langPref}/vo_${cid}_4.mp3`
        };
    } else if (["effect"].indexOf(type) > -1) {
        return {
            title: "Effect voice for " + cardName,
            description: `http://sv.bagoum.com/voice/${langPref}/vo_${cid}_5.mp3`
        };
    }
    return {
        title: "All voices for " + cardName,
        description: `http://sv.bagoum.com/cards/${cardName.replace(/\W/g, "")}`
    };
}
module.exports.getVoice = getVoice;

function fullCardLink(cardName) {
    return {description: `Full card art for ${cardName.toUpperCase()}:\n\t<http://sv.bagoum.com/getRawImage/0/0/${cardName.replace(/\W/g, "")}>\nCard info and other arts:\n\t<http://sv.bagoum.com/cards/${cardName.replace(/\W/g, "")}>`}
}
module.exports.fullCardLink = fullCardLink;

function lowerUnderscoreCondense(str) {
    return str.replace(/ /g, "_").replace(/\W/g, "");
}