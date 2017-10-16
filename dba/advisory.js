/**
 * Created by luogf on 2017/5/11.
 */
/*
* 数据库文件，用于保存课堂内容和用户听课信息
* */
'use strict';
var mongoose = require('mongoose'),
    db_url = "mongodb://localhost/advisory",
    Schema = mongoose.Schema;

///连接数据库(mongodb)
mongoose.Promise = global.Promise;
mongoose.connect(db_url);
mongoose.connection.on('error', console.error.bind(console, "DB connect error"));
mongoose.connection.on('open', console.log.bind(console, "DB connect success"));
mongoose.connection.on('disconnect', console.log.bind(console, "DB connect disable"));

/*
* 用户表
* @user
* */
let user = new Schema({
    username: String,       ///用户名
    password: String,       ///密码
    type: Number,           ///1: 客服
    time: Date,             ///创建日期
    sex: String             ///性别
});
let User = mongoose.model('User', user);

/*
* 课堂信息Schema
* @CourseContent
* */
var courseContent = new Schema({
    courseId: String,         ///课程id
    userId: String,           ///用户id
    msgDate: Date,          ///消息时间戳
    userType: String,         ///用户类型
    msgType: String,          ///消息类型
    msg: String             ///消息内容
});
var CourseContent = mongoose.model('CourseContent', courseContent);

/*
* 用户未观看记录
* @UserUnread
* */
var userUnread = new Schema({
    userId: String,     ///用户id
    courseId: String,       ///课堂id
    msgId: mongoose.Schema.ObjectId         ///消息id
});
var UserUnread = mongoose.model('UserUnread', userUnread);

/*
* 学士弹幕信息
* @Barrage
* */
var barrage = new Schema({
    userId: String,     ///用户id
    courseId: String,    ///课堂id
    msgDate: Date,         ///消息时间
    msg: String           ///消息内容
});
var Barrage = mongoose.model('Barrage', barrage);

exports.CourseContent = CourseContent;
exports.UserUnread = UserUnread;
exports.Barrage = Barrage;
exports.User = User;
