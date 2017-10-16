/**
 * Created by luogf on 2017/6/5.
 */
/*仅用于接口文档和部分测试案例*/

/*
* socket 的连接
* param: 1.accessToken, 2.courseId
* return: userInfo
* */
var socket = new WebSocket('ws://42.62.29.203:3000?accessToken=&coursed=');

/*
* socket 向后台发送数据
* param: json字符串
* */
socket.onopen = function () {
    var sendData = {};
    socket.send(JSON.stringify(sendData));

    sendData = {      ///获取课程信息接口
        method: 'getCourseInfo',
        data: {
            courseId: '',
            accessToken: ''
        }
    };

    sendData = {        ///获取课程预备信息
        method: 'getCoursePre',
        data: {
            courseId: '',
            accessToken: ''
        }
    };

    sendData = {        ///获取课程内容
        method: 'getCourseContent',
        data: {
            courseId: ''
        }
    };

    sendData = {        ///获取未读内容信息
        method: 'getUserUnread',
        data: {
            courseId: '',
            userId: ''
        }
    };

    sendData = {        ///学生发送弹幕
        method: 'barrage',
        data: {
            courseId: '',
            userId: '',
            msg: ''
        }
    };

    sendData = {        ///更新未读消息内容
        method: 'updateUnreadContent',
        data: {
            courseId: '',
            userId: '',
            msgId: ''
        }
    };

    sendData = {        ///教师正在录入接口
        method: 'entering',
        data: {
            courseId: ''
        }
    };

    sendData = {        ///老师提交课堂内容
        method: 'postCourseContent',
        data: {
            courseId: '',
            msgType: '',        ///消息类型
            msg: '',             ///具体消息
            id: ''
        }
    };

    sendData = {
        method: 'reward',
        data: {
            courseId: '',
            userId: ''
        }
    }
};

/*
* socket 监听 server 返回数据
* */
socket.onmessage = function (server) {
    var serverInfo = JSON.parse(server.data);

    serverInfo = {        ///连接socket用户鉴权成功返回数据
        type: 'userAuth',
        broadcast: false,
        data: {
            uid: '',
            tp: '',         ///用户类型
            icon_url: '',        ///用户头像
            nice_name: ''       ///用户昵称
        }
    };

    serverInfo = {
        type: 'getCourseInfo',
        broadcast: false,
        data: {
            id: '',
            name: '',            ///课程名字
            start_time: '',      ///开始时间
            lecture_mode: '',    ///授课方式
            desct: '',           ///课程简介
            duration: '',        ///课程时长
            status: '',          ///课程状态
            room_id: '',         ///所属直播室
            room_name: '',       ///直播室名称
            room_attention_num: ''      ///人气
        }
    };

    serverInfo = {
        type: 'getCoursePre',
        broadcast: false,
        data: {
            datas: [],      ///素材集
            id: "",         ///素材id
            title: "",      ///标题
            tp: '',         ///类型 1.文本，2.图片，3.语音，4.视频
            index: -1,      ///素材顺序，默认为-1 为不存在
            content: ''     ///类型文字内容是内容，其他为服务器地址
        }
    };

    serverInfo = {
        type: 'getCourseContent',
        broadcast: false,
        data: {
            content: []
        }
    };

    serverInfo = {
        type: 'getUserUnread',
        broadcast: false,
        data: {
            msgId: ''       ///第一个未读消息id
        }
    };

    serverInfo = {
        type: 'barrage',
        broadcast: true,
        data: {
            msg: ''     ///其他用户弹幕消息
        }
    };

    serverInfo = {
        type: 'reward',
        broadcast: true,
        data: {
            userId: '',         ///打赏用户
            detail: ''         ///具体打赏内容
        }
    };

    serverInfo = {
        type: 'postCourseContent',
        broadcast: true,
        data: {
            msgType: '',     ///类型
            msg: ''          ///消息消息
        }
    };

    serverInfo = {
        type: 'entering',
        broadcast: true,
        data: {

        }
    };
};

/*
* socket断开监听
* */
socket.onclose = function () {

};