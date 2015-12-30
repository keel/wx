/*
处理Event,包括关注,取消关注
 */
'use strict';


var vlog = require('vlog').instance(__filename);
var db = require('./dbweb');
var handle = function(message, req, res, callback) {

  // message为事件内容
  // { ToUserName: 'gh_d3e07d51b513',
  // FromUserName: 'oPKu7jgOibOA-De4u8J2RuNKpZRw',
  // CreateTime: '1359125022',
  // MsgType: 'event',
  // Event: 'LOCATION',
  // Latitude: '23.137466',
  // Longitude: '113.352425',
  // Precision: '119.385040',
  // MsgId: '5837397520665436492' }

  // vlog.log('evnt msg:%j', message);
  if (message.Event === 'subscribe') {

    res.reply('发送图片给我,就可以直接冲印成实体照片! 不信试试?');
    db.subUser(message.FromUserName, function(err, re) {
      if (err) {
        callback(vlog.ee(err, 'handleEvent. subUser'));
        return;
      }
      callback(null, re);
    });
  } else if (message.Event === 'unsubscribe') {
    db.unSubUser(message.FromUserName, function(err, re) {
      if (err) {
        callback(vlog.ee(err, 'handleEvent. unSubUser'));
        return;
      }
      callback(null, re);
    });
  } else if (message.Event === 'subscribe_status' ||
    message.Event === 'unsubscribe_status') {
    //WIFI设备状态订阅,回复设备状态(1或0)
    res.reply(1);
  } else {
    // vlog.log('event:%j',message);
    res.reply('发送图片给我,就可以直接冲印成实体照片! 不相试试?');
  }


};

exports.handle = handle;
