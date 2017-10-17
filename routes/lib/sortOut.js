'use strict'

function initData(params) {
    params.socket['user_id'] = params['GetUserInfo']['data']['UserID'];
    let roomId = params.socket['roomId'];
    let is_join = '0';
    if (0 > global.roomList[roomId]['userList'].length)
        is_join = '1';
    let user = { ///初始化当前用户在该房间的信息
        user_id: params['GetUserInfo']['data']['UserID'],
        nickname: params['GetUserInfo']['data']['Nick'],
        path: params['GetUserInfo']['data']['Headimg'],
        position: global.roomList[roomId]['userList'].length + 1,
        value: '0',
        is_join: is_join,
        online: '1',
    };

    params['GetUserInfo']['data']['position'] = user['position'];
    global.roomList[roomId]['userList'].push(user); ///将该用户放进房间用户组

    let data = {
        act: 'init',
        data: {
            number: params['GetRoomInfo']['data']['RoomNumbuer'],
            running: global.roomList[roomId]['running'],
            room_users: global.roomList[roomId]['userList'],
            max_matches: params['GetRoomInfo']['data']['Rules']['max_matches'],
            cur_match: global.roomList[roomId]['cur_match'] + '',
            hand_patterns: [''],
            card_rule: params['GetRoomInfo']['data']['Rules']['card_rule'],
            end_points: params['GetRoomInfo']['data']['Rules']['end_points'],
            zhuang_value: params['GetRoomInfo']['data']['Rules']['zhuang_value'] + '',
            zhuang_type: params['GetRoomInfo']['data']['Rules']['zhuang_type']
        }
    };
    return data;
}

function gameRunningData(params) {
    let roomId = params.socket['roomId'];
    let users = [];
    global.roomList[roomId]['userList'].forEach(function(item) {
        let info = [];
        info[0] = item['user_id'];
        info[1] = item['online'];
        info[2] = item['value'];
        users.push(info);
    });
    return {
        "act": "gameRunning",
        "data": {
            "running": global.roomList[roomId]['running'],
            "cur_match": global.roomList[roomId]['cur_match'] + '',
            "users": users,
        }
    }

}

function playerjoinData(params) {
    let roomId = params.socket.roomId;
    return {
        act: 'playerjoin',
        data: {
            user_id: params['GetUserInfo']['data']['UserID'],
            nickname: params['GetUserInfo']['data']['Nick'],
            path: params['GetUserInfo']['data']['Headimg'],
            position: params['GetUserInfo']['data']['position'],
            sex: '0'
        }
    };
}

/*
 * 开始发牌
 * @startData
 */
function startData(params) {
    let roomId = params.roomId;
    global.roomList[roomId]['cur_match'] += 1;
    let userIdS = [];
    global.roomList[roomId].sockets.forEach(function(item) {
        if ('ok' === item.ready)
            userIdS.push(item['user_id']);
    });
    return {
        act: 'start',
        data: {
            cur_match: global.roomList[roomId]['cur_match'],
            user_ids: userIdS,
        }
    }
}

/*
 * 选庄
 * selectedMaster
 */
function selectedMaster(params) {
    let { roomId } = params;
    let random_users = [];
    let total = {
        four: [],
        three: [],
        two: [],
        one: [],
        other: [],
    }
    global.roomList[roomId].sockets.forEach((item, index) => { ///将玩家抢庄状态存入数组备用
        if ('4' === item['zhuangMultiple'])
            total.four.push(index);
        else if ('3' === item['zhuangMultiple'])
            total.three.push(index);
        else if ('2' === item['zhuangMultiple'])
            total.two.push(index);
        else if ('1' === item['zhuangMultiple'])
            total.one.push(index);
        else
            total.other.push(index);
        if (item['zhuangMultiple'])
            random_users.push(item['user_id']);
    });

    let zhuang = -1;
    let socketIndex = -1;
    let multiple = 1;
    if (0 !== total.four.length) {
        zhuang = Math.floor(Math.random() * total.four.length);
        socketIndex = total.four[zhuang];
        multiple = '4';
    } else {
        if (0 !== total.three.length) {
            zhuang = Math.floor(Math.random() * total.three.length);
            socketIndex = total.three[zhuang];
            multiple = '3';
        } else {
            if (0 !== total.two.length) {
                zhuang = Math.floor(Math.random() * total.two.length);
                socketIndex = total.two[zhuang];
                multiple = '2';
            } else {
                if (0 !== total.one.length) {
                    zhuang = Math.floor(Math.random() * total.one.length);
                    socketIndex = total.one[zhuang];
                } else {
                    zhuang = Math.floor(Math.random() * total.other.length);
                    socketIndex = total.other[zhuang];
                }
            }
        }
    }

    global.roomList[roomId]['zhuang'] = socketIndex; ///本局游戏庄家
    return {
        act: 'selectedMaster',
        data: {
            master_userid: global.roomList[roomId].sockets[socketIndex]['user_id'],
            multiple: multiple,
            random_users: random_users,
        }
    }
}

/*
 * 展示闲家下注倍数
 * showMultiple
 */
function showMultiple(params) {
    let { roomId } = params;
    let zhuangIndex = global.roomList[roomId]['zhuang'];
    let choices = [];
    global.roomList[roomId].sockets.forEach((item, index) => {
        if (zhuangIndex !== index) {
            let user = {};
            user['user_id'] = item['user_id'];
            user.multiple = item.choiceMultiple + '';
            choices.push(user);
        }
    });

    return {
        act: 'showMultiple',
        data: choices,
    }
}

/*
 * 玩家主动摊牌
 * @showdown
 */
function showdown(params) {
    let { roomId, user_id, cards } = params;
    return {
        act: 'showdown',
        data: {
            user_id: user_id,
            hand_cards: cards,
            code: Math.floor(Math.random() * 14),
        }
    }
}

exports.initData = initData;
exports.gameRunningData = gameRunningData;
exports.playerjoinData = playerjoinData;
exports.startData = startData;
exports.selectedMaster = selectedMaster;
exports.showMultiple = showMultiple;
exports.showdown = showdown;