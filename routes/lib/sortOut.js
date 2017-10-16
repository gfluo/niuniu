'use strict'

function initData(params) {
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
            
        }
    };
}
exports.initData = initData;
exports.gameRunningData = gameRunningData;