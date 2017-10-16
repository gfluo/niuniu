'use strict'

function initData(params) {
    params.socket['user_id'] = params['GetUserInfo']['data']['UserID'];
    let roomId = params.socket['roomId'];
    let is_join = '0';
    console.log(global.roomList[roomId]);
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
            cards: [{ color: '2', value: '5' }, { color: '0', value: '7' }, { color: '1', value: '12' }, { color: '3', value: '7' }]
        }
    }
}

exports.initData = initData;
exports.gameRunningData = gameRunningData;
exports.playerjoinData = playerjoinData;
exports.startData = startData;