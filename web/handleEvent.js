/*
处理Event,包括关注,取消关注
 */
'use strict';


var vlog = require('vlog').instance(__filename);
var db = require('./dbweb');
var url = require('url');
var http = require('http');

var postData = function(postUrl, data, callback) {
  var postData = data; //querystring.stringify(datas);
  var options = url.parse(postUrl);
  options.method = 'POST';
  options.headers = {
    'Content-Type': 'application/json',
    'Content-length': (new Buffer(data)).length
  };
  // vlog.log('options:%j',options);
  var req = http.request(options, function(res) {
    res.setEncoding('utf8');
    var body = '';
    // var bufferHelper = new BufferHelper();
    res.on('data', function(chunk) {
      // bufferHelper.concat(chunk);
      body += chunk;
      // vlog.log('chunk:%s', chunk);
    });
    // res.on('data', function(chunk) {
    //   body += chunk;
    // });
    res.on('end', function() {
      // var body = bufferHelper.toBuffer().toString();
      // vlog.log('test-postData-resp-body:%s', body);
      callback(null, body);
    });
  });
  req.on('error', function(e) {
    callback(vlog.ee(e, 'postData', postUrl));
  });
  req.write(postData);
  req.end();
};


var bindItvUser = function(message) {
  var bindApiUrl = 'http://10.1.1.71/itvxc/api/qrcode/bindwechat';
  postData(bindApiUrl, message, function(err, re) {
    if (err) {
      vlog.eo(err, 'bindItvUser');
      return;
    }
    vlog.log('bindItvUser re:%j', re);
  });
};

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
    vlog.log('evnt msg:%j', message);
    //如果用户还未关注公众号，则用户可以关注公众号，关注后微信会将带场景值关注事件推送给开发者
    // <xml><ToUserName><![CDATA[toUser]]></ToUserName>
    // <FromUserName><![CDATA[FromUser]]></FromUserName>
    // <CreateTime>123456789</CreateTime>
    // <MsgType><![CDATA[event]]></MsgType>
    // <Event><![CDATA[subscribe]]></Event>
    // <EventKey><![CDATA[qrscene_123123]]></EventKey>
    // <Ticket><![CDATA[TICKET]]></Ticket>
    // </xml>
    res.reply('发送图片给我,就可以直接冲印成实体照片! 不信试试?');
    if (message.EventKey) {
      bindItvUser(message.EventKey);
    }
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
