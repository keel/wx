/*
每月开始时重置所有用户的点数
 */
'use strict';

var vlog = require('vlog').instance(__filename);
var db = require('./db');
var userTable = 'wxUser';

var lastResetTime = 0;
var loopSleep = 1000 * 60 * 60;

var resetAllPoint = function() {
  var updateMap = {
    '$set': {
      'wxPoint': 23
    }
  };
  db.update(userTable, {
    'state': 1,
    'orderPoint': 20
  }, updateMap, null, function(err) {
    if (err) {
      vlog.eo(err, 'resetAllPoint');
      return;
    }
  });

  var updateMap2 = {
    '$set': {
      'wxPoint': 33
    }
  };
  db.update(userTable, {
    'state': 1,
    'orderPoint': 30
  }, updateMap2, null, function(err) {
    if (err) {
      vlog.eo(err, 'resetAllPoint');
      return;
    }
  });

  vlog.log('wxPoint month reset:',new Date());
};

var nextMonth = function(dateTime) {
  dateTime.setMonth(dateTime.getMonth()+1);
  dateTime.setDate(1);
  dateTime.setHours(0,0,0,0);
  lastResetTime = dateTime.getTime();
  vlog.log('monthReset nextMonth:%s',new Date(lastResetTime));
  return lastResetTime;
};


//如果是当月的1号,则判断是否大于lastResetTime,如果大于则进行reset,然后重置lastResetTime,
//当lastResetTime为0时,直接重置lastResetTime为下月1号
var loopCheck = function() {
  var now = new Date();
  if (lastResetTime === 0) {
    //重置lastResetTime为下月1号
    nextMonth(now);
    return;
  }
  if (now.getDate() === 1) {
    if (now.getTime() >=  lastResetTime) {
      nextMonth(now);
      resetAllPoint();
    }
  }
};

var start = function() {
  vlog.log('monthReset start.');
  setInterval(loopCheck, loopSleep);
};

exports.start = start;
