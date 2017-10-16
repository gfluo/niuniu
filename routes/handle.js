'use strict'

/**
 * Created by luogf on 2017/5/12.
 */
var queryString = require('querystring');
var http = require('http');
var fs = require('fs');
var path = require('path');
let tool = require('./lib/tool');
let async = require('async');

var remote = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../private_files/config.json"))); ///获取远程配置

var Handle = function() {

};
var handle = new Handle();

/*
 * 初始化人员信息
 * @init
 */
Handle.prototype.init = function(params, callback) {
    async.map(params, function(item, cb) {
        tool.httpRequest({ method: item.method, 'jsonData': JSON.stringify(item.query) }, function(err, doc) {
            if (err) {
                return console.error(err);
            } else cb(null, { method: item.method, ret: doc });
        });
    }, function(err, results) {
        if (err)
            return callback(err);
        let room = {};
        results.forEach(function(tag) {
            if ('GetUserInfo' === tag['method']) {
                room['GetUserInfo'] = tag.ret;
            } else {
                room['GetRoomInfo'] = tag.ret;
            }
        });

        callback(null, room);
    });
    /*
    tool.httpRequest({ method: 'GetUserInfo', 'jsonData': JSON.stringify(params.user) }, function() {

    });
    tool.httpRequest({ method: 'GetRoomInfo', 'jsonData': JSON.stringify(params.room) }, function() {

    })
    */
}


/*
 * 用户鉴权
 * @userAuth
 * */
Handle.prototype.userAuth = function(param, callback) {
    var pushData = {
        type: "userAuth",
        data: {
            auth: true
        }
    };
    var postData = queryString.stringify(param.query);
    var option = {
        ///host: "http://",
        hostname: "wx.kdshuhua.com",
        port: 80,
        path: "/weikeCommon/validAccessToken.shtml",
        method: "POST",
        headers: {
            "Connection": "keep-alive",
            "Content-Length": param.query.length,
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36"
        }
    };

    var req = http.request(option, function(res) {
        var data = "";
        ///console.log('Status:', res.statusCode);
        ///console.log('headers:', JSON.stringify(res.headers));
        res.setEncoding('utf-8');
        res.on('data', function(chun) {
            data += chun;
        });
        res.on('end', function() {
            ///console.log(data);
            try {
                console.log(data);
                var authResult = JSON.parse(data);
                if ("1" === authResult["rtnCode"])
                    return callback(null, pushData);
                pushData["data"]["auth"] = false;
                callback(null, pushData);
            } catch (e) {
                callback(e);
            }
            ///console.log('No more data in response.********');
        });
    });
    req.on('error', function(err) {
        console.error(err);
    });
    req.write(param.query);
    req.end();
};

module.exports = handle;