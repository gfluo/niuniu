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
                                            broadcast({ roomId: roomId }, JSON.stringify(sortOut.startData({ roomId: roomId })));
                                        });
                                        let rule = new schedule.RecurrenceRule();
                                        let times = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
                                        rule.second = times;
                                        schedule.scheduleJob(rule, function() {
                                            console.log(new Date());
                                            broadcast({ roomId: socket.roomId }, JSON.stringify({ act: 'timer', data: global.roomList[socket.roomId]['timer'] }));
                                            global.roomList[socket.roomId]['timer'] -= 1;
                                        });
                                    }
                                }
                                break;
                            default:
                        }
                    } catch (e) {

                    }
                    console.log(data);
                }
            } catch (e) {
                console.error(e);
            }
        });

        socket.on('close', function(code) { ///code 1000正常关闭， 1006强制关闭或者一场关闭

        });
    });
}

let broadcast = function(socket, msg) {
    let roomId = socket.roomId;
    global.roomList[roomId]['sockets'].forEach(function(item) {
        if (1 === item.readyState && socket !== item)
            item.send(msg);
    });
}

exports.start = start;