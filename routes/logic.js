/**
 * Created by luogf on 2017/5/12.
 */
/*
 * 逻辑中心启动函数
 * @start
 * */
'use strict'
var url = require('url');
var handle = require("./handle");
var queryString = require('querystring');
const schedule = require('node-schedule');
let sortOut = require('./lib/sortOut');
let tool = require('./lib/tool');
let createCards = require('./lib/createCards');

global.roomList = {};

function start(ws) {
    ws.on('connection', function(socket) { ///监听客户端连接
        var currentUrl = socket.upgradeReq.url; ///用户连接地址
        var socketUrl = url.parse(currentUrl);
        if (undefined === socketUrl.query)
            return socket.close(); ///参数不足关闭当前连接

        var query = queryString.parse(socketUrl['query']);
        socket.token = query['token']; ///用户token
        socket.roomId = query['code']; ///房间code
        if (undefined === global.roomList[socket.roomId]) {
            global.roomList[socket.roomId] = {};
            global.roomList[socket.roomId]['userList'] = [];
            global.roomList[socket.roomId]['sockets'] = [];
            global.roomList[socket.roomId]['cur_match'] = 0;
            global.roomList[socket.roomId]['running'] = '0'; ///0代表房间只有一个人，还不能准备
        } else {
            ///此处可能出现bug
            global.roomList[socket.roomId]['sentCards'] = [];
            global.roomList[socket.roomId]['running'] = '1'; ///代表当前房间已经创建，可以进入准备状态
            global.roomList[socket.roomId]['readyPeople'] = 0; ///当前房间无人准备
            global.roomList[socket.roomId]['timer'] = 0; ///本局游戏倒计时timer 有发牌倒计时和抢庄倒计时
            global.roomList[socket.roomId]['waitStatus'] = '';
        }
        global.roomList[socket.roomId]['sockets'].push(socket);

        socket.on('message', function(data) { ///接收用户信息
            try {
                if ('join' === data)
                    socket.send('join_success');
                else if ('join_suceess' === data)
                    socket['joinSuccess'] = ture;
                else if ('init' === data) {
                    handle.init([{ method: 'GetUserInfo', query: { UserToken: socket.token } },
                        { method: 'GetRoomInfo', query: { RoomCode: socket.roomId } }
                    ], function(err, doc) {
                        if (err)
                            return console.error(err);
                        doc['socket'] = socket;
                        socket.send(JSON.stringify(sortOut.initData(doc)));
                        socket.send(JSON.stringify(sortOut.gameRunningData(doc)));
                        broadcast(socket, JSON.stringify(sortOut.playerjoinData(doc)));
                    })
                } else if ('ping' === data)
                    socket.send('pong');
                else {
                    try {
                        let actionInfo = JSON.parse(data);
                        let roomId = socket.roomId;
                        switch (actionInfo.act) {
                            case 'ready':
                                socket.ready = 'ok';
                                global.roomList[roomId]['readyPeople'] += 1;
                                ///向当前房间广播用户准备
                                broadcast({ roomId: roomId }, JSON.stringify({ act: 'ready', data: socket['user_id'] }));
                                if (2 <= global.roomList[roomId]['readyPeople']) {
                                    global.roomList[roomId]['waitStatus'] = 'waitStart';
                                    forbidLeaveRoom(roomId, JSON.stringify({ act: 'forbidLeaveRoom', data: '' }));
                                    if ('1' === global.roomList[roomId]['running']) { ///当前房间未进入发牌到抢庄倒计时
                                        if ('waitStart' === global.roomList[roomId]['waitStatus']) { ///进入发牌倒计时timer
                                            global.roomList[roomId]['timer'] = 8;
                                        }
                                        let rule = new schedule.RecurrenceRule();
                                        let times = tool.createNatureNums(60);
                                        rule.second = times;
                                        let countDown = schedule.scheduleJob(rule, function() { ///倒计时任务开始
                                            if (0 === global.roomList[roomId]['timer']) {
                                                if ('waitStart' === global.roomList[roomId]['waitStatus']) {
                                                    global.roomList[roomId]['waitStatus'] = 'waitGrabZhuang';
                                                    global.roomList[roomId]['timer'] = 4;
                                                    dealCards(roomId, sortOut.startData({ roomId: roomId }));
                                                } else if ('waitGrabZhuang' === global.roomList[roomId]['waitStatus']) {
                                                    ///此处倒计时抢庄结束
                                                    global.roomList[roomId]['timer'] = 4; ///重新计时
                                                    global.roomList[roomId]['running'] = '3';
                                                    global.roomList[roomId]['waitStatus'] = 'waitChoice';
                                                    broadcast({ roomId: roomId }, JSON.stringify(sortOut.selectedMaster({ roomId: roomId })));
                                                } else if ('waitChoice' === global.roomList[roomId]['waitStatus']) {
                                                    ///倒计时闲家下注结束
                                                    global.roomList[roomId]['timer'] = 4; ///重新计时，倒计时摊牌
                                                    global.roomList[roomId]['running'] = '4';
                                                    global.roomList[roomId]['waitStatus'] = 'waitOpen';
                                                    ///此处应该仍有广播消息
                                                    broadcast({ roomId: roomId }, JSON.stringify(sortOut.showMultiple({ roomId: roomId })));
                                                } else {
                                                    global.roomList[roomId]['running'] = '4';
                                                }
                                            } else {
                                                broadcast({ roomId: roomId }, JSON.stringify({ act: 'timer', data: global.roomList[roomId]['timer'] }));
                                                global.roomList[roomId]['timer'] -= 1;
                                            }
                                        });

                                        global.roomList[roomId]['running'] = '2';
                                    } else {

                                    }
                                }
                                break;
                            case 'grabZhuang':
                                if (0 === actionInfo.data.length) {
                                    socket['zhuangMultiple'] = '0';
                                    broadcast({ roomId: socket.roomId }, JSON.stringify({ act: 'noGrab', data: [{ sex: '0' }] }));
                                } else {
                                    socket['zhuangMultiple'] = actionInfo.data;
                                    broadcast(socket, JSON.stringify({ act: 'grabZhuang', data: { user_id: socket['user_id'], zhuang_multiple: actionInfo.data, sex: '1' } }));
                                }
                                break;
                            case 'choiceMultiple':
                                socket['choiceMultiple'] = actionInfo.data;
                                broadcast({ roomId: roomId }, JSON.stringify({ act: 'choiceMultiple', data: { user_id: socket['user_id'], multiple: actionInfo.data, sex: '0' } }));
                                break;
                            case 'turnover':
                                let card = createCards.createOneCard(roomId);
                                socket.cards.push(card);
                                socket.send(JSON.stringify(card));
                                break;
                            case 'showdown':
                                socket['show'] = true;
                                broadcast({ roomId: roomId }, JSON.stringify(sortOut.showdown(socket)));
                            default:

                        }
                    } catch (e) {

                    }
                }
            } catch (e) {
                console.error(e);
            }
        });

        socket.on('close', function(code) { ///code 1000正常关闭， 1006强制关闭或者一场关闭

        });
    });
}

let broadcast = function(socket, msg) { ///广播当前消息
    let roomId = socket.roomId;
    global.roomList[roomId]['sockets'].forEach(function(item) {
        if (1 === item.readyState && socket !== item)
            item.send(msg);
    });
}

let dealCards = function(roomId, data) { ///发牌动作
    let cardsArray = createCards.createDefaultCards(2, global.roomList[roomId]['sentCards']);
    global.roomList[roomId]['sockets'].forEach((item, index) => {
        if (1 === item.readyState) {
            item.cards = cardsArray[index];
            data.data['cards'] = cardsArray[index];
            item.send(JSON.stringify(data));
        }
    });
}

/*
 * 向房间已经准备的玩家发出禁止离开消息
 * @ForbidLeave
 */
let forbidLeaveRoom = function(roomId, data) {
    global.roomList[roomId]['sockets'].forEach((item) => {
        if (1 === item.readyState && 'ok' === item.ready) {
            item.send(data);
        }
    });
}

exports.start = start;