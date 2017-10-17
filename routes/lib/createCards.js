'use strict'

const tool = require('./tool');
/*
* 生成默认的组牌
* createDefaultCards
*/

function createDefaultCards(peopleNum, sentCards) {
    ///let cards = new Array(tool.createNatureNums(4), tool.createNatureNums(13));
    let cardsArray = [];
    while (cardsArray.length < peopleNum) {
        let peopleCards = [];
        while (peopleCards.length < 4) {
            let card = {};
            let color = Math.floor(Math.random() * 4);
            let value = Math.floor(Math.random() * 13) + 1;
            card.color = color + '';
            card.value = value + '';
            let push = true;
            for (let i in sentCards) {
                if (i.color === color + '' && i.value === value + '') {
                    push = false;
                    break;
                }
            }
            if (push) {
                peopleCards.push(card);
                sentCards.push(card);
            }
        }

        cardsArray.push(peopleCards);
    }

    return cardsArray;
}

function ifSame() {

}

/*
* 
*
*/

exports.createDefaultCards = createDefaultCards;