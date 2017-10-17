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
            global.roomList[socket.roomId]['running'] = '1'; ///代表当前房间已经创建，可以进入准备状态
            global.roomList[socket.roomId]['readyPeople'] = 0; ///当前房间无人准备
            global.roomList[socket.roomId]['waitStart'] = false; ///房间是否处于等待发牌倒计时中
            global.roomList[socket.roomId]['timer'] = 0; ///游戏开始倒计时timer
            global.roomList[socket.roomId]['grabZhuangTimer'] = 0; ///抢庄倒计时timer
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
                        switch (actionInfo.act) {
                            case 'ready':
                                socket.ready = 'ok';
                                global.roomList[socket.roomId]['readyPeople'] += 1;
                                broadcast(socket, JSON.stringify({ act: 'ready', data: socket['user_id'] }));
                                socket.send(JSON.stringify({ act: 'ready', data: socket['user_id'] }));
                                if (2 <= global.roomList[socket.roomId]['readyPeople']) {
                                    broadcast(socket, JSON.stringify({ act: 'forbidLeaveRoom', data: '' }));
                                    socket.send(JSON.stringify({ act: 'forbidLeaveRoom', data: '' }));
                                    if (!global.roomList[socket.roomId]['waitStart']) {
                                        global.roomList[socket.roomId]['waitStart'] = true;
                                        global.roomList[socket.roomId]['timer'] = 11;
                                        let now = new Date();
                                        now.setSeconds(now.getSeconds() + 12);
                                        schedule.scheduleJob(now, function() {
                                            let roomId = socket.roomId;
                                            dealCards(roomId, sortOut.startData({ roomId: roomId }));
                                        });
                                        let rule = new schedule.RecurrenceRule();
                                        let times = tool.createNatureNums(60);
                                        rule.second = times;
                                        let countDown = schedule.scheduleJob(rule, function() {
                                            if (1 === global.roomList[socket.roomId]['timer']){
                                                countDown.cancel();
                                
                                                global.roomList[socket.roomId]['grabZhuangTimer'] = 4;
                                                let grabZhuangTimer = new schedule.RecurrenceRule();        ///抢庄倒计时timer
                                                let newTimes =  tool.createNatureNums(60);
                                                grabZhuangTimer.second = newTimes;
                                                let newCountDown = schedule.scheduledJob(rule, function() {
                                                    console.log(socket.roomId);
                                                    if (1 === global.roomList[socket.roomId]['grabZhuangTimer']) {
                                                        newCountDown.cancel();
                                                    }
                                                    broadcast({roomId: socket.roomId}, JSON.stringify({act: 'timer', data: global.roomList[socket.roomId]['grabZhuangTimer']}));
                                                    global.roomList[socket.roomId]['grabZhuangTimer'] -= 1;
                                                });
                                            }
                                            broadcast({ roomId: socket.roomId }, JSON.stringify({ act: 'timer', data: global.roomList[socket.roomId]['timer'] }));
                                            global.roomList[socket.roomId]['timer'] -= 1;
                                        });
                                    }
                                }
                                break;
                            case 'grabZhuang':
                                if (0 === actionInfo.data.length) {
                                    broadcast({roomId: socket.roomId}, JSON.stringify({act: 'noGrab', data: [{sex: '0'}]}));
                                } else {
                                    socket['zhuangMultiple'] = actionInfo.data;
                                    broadcast(socket, JSON.stringify({act: 'grabZhuang', data: {user_id: socket['user_id'], zhuang_multiple: actionInfo.data, sex: '1'}}));

                                }
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

let broadcast = function(socket, msg) {     ///广播当前消息
    let roomId = socket.roomId;
    global.roomList[roomId]['sockets'].forEach(function(item) {
        if (1 === item.readyState && socket !== item)
            item.send(msg);
    });
}

let dealCards = function(roomId, data) {        ///发牌动作
    let cardsArray = createCards.createDefaultCards(2, []);
    global.roomList[roomId]['sockets'].forEach((item, index) => {
        if (1 === item.readyState) {
            data.data['cards'] = cardsArray[index];
            item.send(JSON.stringify(data));
        }
    });
}

exports.start = start;