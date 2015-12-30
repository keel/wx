'use strict';

var wechat = require('wechat');
var WechatAPI = require('wechat-api');
var OAuth = require('wechat-oauth');
var vlog = require('vlog').instance(__filename);


var cache = require('./../lib/cache');

var handlePic = require('./handlePic');
var handleEvent = require('./handleEvent');


var wxSecret = 'd4624c36b6795d1d99dcf0547af5443d';
var wxToken = 'p3WqgTyqearyMvSTsIK8Yqm4Z61RD1nL';
// appid: 'wx585ed80314689958',
var wxAppid = 'wx6194409e72790731';
// encodingAESKey: '8xqiBiBoCo8NSkFBNfTxZ1RZhHTWzoFSq0mxDLzzfGz'
var wxEncodingAESKey = '8xqiBiBoCo8NSkFBNfTxZ1RZhHTWzoFSq0mxDLzzfGz';
// var api = new WechatAPI(config.appid, '6a1adde746835f6bd48d5dd7248df756');



var api = null; //new WechatAPI(config.appid, secret);
var client = null; //new OAuth(config.appid, secret);

var menu = {
  'button': [{
      'type': 'pic_weixin',
      'name': '添加图片',
      'key': 'PIC_ADD_01'
    }, {
      'type': 'view',
      'name': '我的相册',
      'url': 'http://kf.loyoo.co/wxt/albumre'
    }
    // , {
    //   'name': '关于',
    //   'sub_button': [{
    //     'type': 'view',
    //     'name': '搜索',
    //     'url': 'http://www.soso.com/'
    //   }, {
    //     'type': 'click',
    //     'name': '赞一下我们',
    //     'key': 'V1001_GOOD'
    //   }]}
  ]
};

var defaultReply = '发送图片给我,就可以直接冲印成实体照片! 不信试试?!';

var init = function(callback) {
  var configArr = ['wxSecret', 'wxAppid', 'wxEncodingAESKey', 'wxToken'];
  cache.readConfig(configArr, function(err, re) {
    if (err) {
      return vlog.eo(err, 'init:readConfig');
    }
    wxSecret = re.wxSecret;
    wxAppid = re.wxAppid;
    wxEncodingAESKey = re.wxEncodingAESKey;
    wxToken = re.wxToken;
    // config = re.config;
    vlog.log('wxAppid:%j,en:%j,wxToken:%j', wxAppid, wxEncodingAESKey, wxToken);
    // client = new OAuth(wxAppid, wxSecret);
    if (!callback) {
      return;
    }
    callback(null, re);
  });
};



var createWX = function(callback) {
  init(function(err) {
    if (err) {
      callback(vlog.ee(err,'createWX.init'));
      return;
    }

    api = new WechatAPI(wxAppid, wxSecret);
    // api.getMenu(function(err, re) {
    //   if (err) {
    //     vlog.eo(err, 'api.getMenu');
          api.createMenu(menu, function(err) {
            if (err) {
              return vlog.eo(err, 'api.createMenu');
            }
            vlog.log('menu created:%j', menu);
          });
    //   }
    //   vlog.log('getMenu:%j', re);
    // });
    var wec =  wechat(wxToken, wechat.text(function(message, req, res, next) {
      // message为文本内容
      // { ToUserName: 'gh_d3e07d51b513',
      // FromUserName: 'oPKu7jgOibOA-De4u8J2RuNKpZRw',
      // CreateTime: '1359125035',
      // MsgType: 'text',
      // Content: 'http',
      // MsgId: '5837397576500011341' }
      res.reply(defaultReply);
    }).image(function(message, req, res, next) {
      // vlog.log('msgId:%j',message.MsgId);
      handlePic.handle(message, req, res, function(err) {
        if (err) {
          vlog.eo(err, 'handlePic:' + message);
        }
      });
    }).event(function(message, req, res, next) {
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

      //web-app-2 msg:{'ToUserName':'gh_edd9a4c70883','FromUserName':'ocNuRw4WfsKKuGmZ_9h_iY3BXV6I','CreateTime':'1450148376','MsgType':'event','Event':'subscribe','EventKey':'}

      handleEvent.handle(message, req, res, function(err) {
        if (err) {
          vlog.eo(err, 'handleEvent');
        }
      });
    }).voice(function(message, req, res, next) {
      // message为音频内容
      // { ToUserName: 'gh_d3e07d51b513',
      // FromUserName: 'oPKu7jgOibOA-De4u8J2RuNKpZRw',
      // CreateTime: '1359125022',
      // MsgType: 'voice',
      // MediaId: 'OMYnpghh8fRfzHL8obuboDN9rmLig4s0xdpoNT6a5BoFZWufbE6srbCKc_bxduzS',
      // Format: 'amr',
      // MsgId: '5837397520665436492' }
      res.reply(defaultReply);
    }).video(function(message, req, res, next) {
      // message为视频内容
      // { ToUserName: 'gh_d3e07d51b513',
      // FromUserName: 'oPKu7jgOibOA-De4u8J2RuNKpZRw',
      // CreateTime: '1359125022',
      // MsgType: 'video',
      // MediaId: 'OMYnpghh8fRfzHL8obuboDN9rmLig4s0xdpoNT6a5BoFZWufbE6srbCKc_bxduzS',
      // ThumbMediaId: 'media_id',
      // MsgId: '5837397520665436492' }
      res.reply(defaultReply);
    }).shortvideo(function(message, req, res, next) {
      // message为短视频内容
      // { ToUserName: 'gh_d3e07d51b513',
      // FromUserName: 'oPKu7jgOibOA-De4u8J2RuNKpZRw',
      // CreateTime: '1359125022',
      // MsgType: 'shortvideo',
      // MediaId: 'OMYnpghh8fRfzHL8obuboDN9rmLig4s0xdpoNT6a5BoFZWufbE6srbCKc_bxduzS',
      // ThumbMediaId: 'media_id',
      // MsgId: '5837397520665436492' }
      res.reply(defaultReply);
    }).location(function(message, req, res, next) {
      // message为位置内容
      // { ToUserName: 'gh_d3e07d51b513',
      // FromUserName: 'oPKu7jgOibOA-De4u8J2RuNKpZRw',
      // CreateTime: '1359125311',
      // MsgType: 'location',
      // Location_X: '30.283950',
      // Location_Y: '120.063139',
      // Scale: '15',
      // Label: {},
      // MsgId: '5837398761910985062' }
      res.reply(defaultReply);
    }).link(function(message, req, res, next) {
      // message为链接内容
      // { ToUserName: 'gh_d3e07d51b513',
      // FromUserName: 'oPKu7jgOibOA-De4u8J2RuNKpZRw',
      // CreateTime: '1359125022',
      // MsgType: 'link',
      // Title: '公众平台官网链接',
      // Description: '公众平台官网链接',
      // Url: 'http://1024.com/',
      // MsgId: '5837397520665436492' }
      res.reply(defaultReply);
    }).device_text(function(message, req, res, next) {
      // message为设备文本消息内容
      // { ToUserName: 'gh_d3e07d51b513',
      // FromUserName: 'oPKu7jgOibOA-De4u8J2RuNKpZRw',
      // CreateTime: '1359125022',
      // MsgType: 'device_text',
      // DeviceType: 'gh_d3e07d51b513'
      // DeviceID: 'dev1234abcd',
      // Content: 'd2hvc3lvdXJkYWRkeQ==',
      // SessionID: '9394',
      // MsgId: '5837397520665436492',
      // OpenID: 'oPKu7jgOibOA-De4u8J2RuNKpZRw' }
      res.reply(defaultReply);
    }).device_event(function(message, req, res, next) {
      // message为设备事件内容
      // { ToUserName: 'gh_d3e07d51b513',
      // FromUserName: 'oPKu7jgOibOA-De4u8J2RuNKpZRw',
      // CreateTime: '1359125022',
      // MsgType: 'device_event',
      // Event: 'bind'
      // DeviceType: 'gh_d3e07d51b513'
      // DeviceID: 'dev1234abcd',
      // OpType : 0, //Event为subscribe_status/unsubscribe_status时存在
      // Content: 'd2hvc3lvdXJkYWRkeQ==', //Event不为subscribe_status/unsubscribe_status时存在
      // SessionID: '9394',
      // MsgId: '5837397520665436492',
      // OpenID: 'oPKu7jgOibOA-De4u8J2RuNKpZRw' }
      //
      handleEvent.handle(message, req, res, function(err) {
        if (err) {
          vlog.eo(err, 'handleEvent');
        }
      });
    }));
    callback(null,wec);
  });

};

var createClient = function(callback) {
  init(function(err) {
    if (err) {
      callback(vlog.ee(err,'createWX.init'));
      return;
    }
    callback(null,new OAuth(wxAppid, wxSecret));
  });
};

// var wx = createWX();
// var oauthClient = createClient();

exports.init = init;
exports.wx = createWX;
exports.oauthClient = createClient;
