'use strict';
let QS = require('querystring');
let http = require('http');

let httpRequest = function(params, callback) {
    let token = new Buffer(params.jsonData).toString('base64');
    let content = '?method=' + params.method + '&jsonData=' + token;

    var option = {
        ///host: "http://",
        hostname: "niuniu.weisite.org",
        port: 80,
        path: "/api/index" + content,
        method: 'GET',
    };

    console.log(option['path']);

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
                var authResult = JSON.parse(data);
                callback(null, authResult);
            } catch (e) {
                callback(e);
            }
            ///console.log('No more data in response.********');
        });
    });
    req.on('error', function(err) {
        console.error(err);
    });
    ///req.write(content);
    req.end();
}

/*
* 生成自然数数组
* @createNatureNums
*/

let createNatureNums = length => Array.from({length}, (v, k) => k);

exports.httpRequest = httpRequest;
exports.createNatureNums = createNatureNums;