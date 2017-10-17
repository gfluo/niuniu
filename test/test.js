'use strict'

const schedule = require('node-schedule');

let count = 0;

let rule = new schedule.RecurrenceRule();
let fn = len => Object.keys(new Array(len + 1).join(','))
let times = fn(59);
rule.second = times;
let j = schedule.scheduleJob(rule, function() {
    count += 1;
    console.log(new Date());
    console.log(count);
    if (12 <= count)
        j.cancel();
});