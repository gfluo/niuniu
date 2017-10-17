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

function createOneCard(roomId) {
    let sentCards = global.roomList[roomId].sentCards;
    let cards = [];
    while (cards.length < 1) {
        let card = {
            color: Math.floor(Math.random() * 4) + '',
            value: (Math.floor(Math.random() * 13) + 1) + '',
        };

        let push = true;
        for (var i in sentCards) {
            if (i.color === card.color && i.value === card.value) {
                push = false;
                break;
            }
        }
        if (push) {
            sentCards.push(card);
            cards.push(card);
        }
    }
    return {
        act: 'turnover',
        data: cards[0]
    }; ///返回这张牌
}

function ifSame() {

}

/*
 * 
 *
 */

exports.createDefaultCards = createDefaultCards;
exports.createOneCard = createOneCard;