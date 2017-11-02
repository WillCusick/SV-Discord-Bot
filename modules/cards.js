/**
 * Created by Doge on 1/9/2017.
 */

var request = require("request");

module.exports = {};
var cardData = {};
module.exports.cardData = cardData;

function doesTermMatchCard(term, cardName) {
    return cardData[cardName].searchableText.includes(term.toLowerCase());
}
module.exports.doesTermMatchCard = doesTermMatchCard;

function formatCardData(cards) {
    for (var cardName in cards) {
        if (cards.hasOwnProperty(cardName)) {
            card = cards[cardName];
            cardData[cardName.toLowerCase()] = card;
            card.baseData.img = `https://shadowverse-portal.com/image/card/en/C_${card.id}.png`;
            if (card.hasAlt) {
                card.baseData.altimg = `https://shadowverse-portal.com/image/card/en/C_${card.altid}.png`;
            }
            if (card.hasEvo) {
                card.evoData.img = `https://shadowverse-portal.com/image/card/en/E_${card.id}.png`;
                if (card.hasAlt) {
                    card.evoData.altimg = `https://shadowverse-portal.com/image/card/en/E_${card.altid}.png`;
                }
            }
        }
    }
}

function buildCardData(callback) {
    request("http://sv.bagoum.com/cardsFullJSON", function (err, resp, body) {
        if (err) {
            return callback(err);
        }
        if (resp.statusCode != 200) {
            return callback("Invalid status code: " + resp.statusCode);
        }
        var cards = JSON.parse(body.replace(/\<br\>/g, "\\n"));
        formatCardData(cards);
        module.exports.cardsList = Object.keys(module.exports.cardData);
        return callback(null);
    });
}
module.exports.buildCardData = buildCardData;