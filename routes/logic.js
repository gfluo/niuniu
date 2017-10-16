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


        }

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
                        socket.send(JSON.stringify(sortOut.gameRunningData(doc));
                    })
                } else if ('ping' === data)
                    socket.send('pong');
                else {
                    console.log(data);
                }
                /*
                var queryParam = JSON.parse(data);
                switch (queryParam["method"]) {
                    case "getCourseInfo": ///获取课程信息
                        handle.getCourseInfo(queryParam["data"], function(err, data) {
                            if (err)
                                return console.error(err);
                            pushMsg(socket, data, function(err, data) {

                            });
                        });
                        break;
                    case "getCoursePre": ///获取课程预备内容
                        handle.getCoursePre(queryParam["data"], function(err, data) {
                            if (err)
                                return console.error(err);
                            pushMsg(socket, data, function(err, data) {

                            });
                        });

                        break;
                    case "getCourseContent": ///获取课堂内容
                        handle.getCourseContent(queryParam["data"], function(err, data) {
                            if (err)
                                return console.error(err);
                            pushMsg(socket, data, function(err, data) {

                            });
                        });
                        break;
                    case "getUserUnread": ///获取学生未读内容信息
                        handle.getUserUnread(queryParam["data"], function(err, data) {
                            if (err)
                                return console.error(err);
                            pushMsg(socket, data, function(err, data) {

                            });
                        });
                        break;
                    case "reward": ///学生打赏
                        handle.reward(queryParam["data"], function(err, data) {
                            if (err)
                                return console.error(err);
                            broadcastMsg(queryParam['data']['courseId'], data, function(err, data) {

                            });
                        });
                        break;
                    case "postCourseContent": ///提交课堂内容（老师教课，嘉宾点评和学生讨论部分）,
                        handle.postCourseContent(queryParam["data"], function(err, data) {
                            if (err)
                                return console.error(err);
                            broadcastMsg(queryParam['data']['courseId'], data, function(err, data) {

                            });
                        });
                        break;
                    case "barrage": ///学生发送弹幕
                        handle.barrage(queryParam["data"], function(err, data) {
                            if (err)
                                return console.error(err);
                            broadcastMsg(queryParam['data']['courseId'], data, function(err, data) {

                            });
                        });
                        break;
                    case "updateUnreadContent": ///更新学生未听课内容
                        handle.updateUnreadMsg(queryParam["data"], function(err, data) {
                            if (err)
                                return console.error(err);
                            pushMsg(socket, data, function(err, data) {

                            });
                        });
                        break;
                    case "entering": ///提示当前正在输入（讲师调用）
                        broadcastMsg(queryParam['data']['courseId'], { data: queryParam["data"], type: "entering" }, function(err, data) { ///数据无需处理，直接广播

                        });
                        break;
                    case "withdraw": ///退回消息
                        handle.withdraw(queryParam["data"], function(err, data) {
                            if (err)
                                return console.error(err);
                            broadcastMsg(queryParam['data']['courseId'], data, function(err, data) {

                            });
                        });
                        break;
                    default:
                        console.warn("unknown method");
                }
                */
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
        if (1 === item.readyState)
            item.send(msg);
    });
}

exports.start = start;